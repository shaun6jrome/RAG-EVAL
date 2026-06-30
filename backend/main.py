import time
import os
import logging
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from db.chroma_client import test_chroma_connection
from services.ingestion import process_document
from services.embeddings import generate_and_store_embeddings
from services.retrieval import retrieve_chunks
from services.generation import generate_answer
from services.evaluation import evaluate_faithfulness, evaluate_relevance
from db.sqlite_client import log_query, update_log_evals, get_log, get_dashboard_stats, get_recent_logs, get_unique_recent_queries, LogEntry

class QueryRequest(BaseModel):
    query: str
    top_k: int = 3

app = FastAPI(
    title="RAG-Eval API",
    description="Backend for RAG-Eval with observability and evaluation",
    version="1.0.0"
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure Rate Limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS
frontend_urls = os.getenv("FRONTEND_URL", "http://localhost:3000,http://localhost:3001").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_urls,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to RAG-Eval API"}

@app.get("/health")
async def health_check():
    # Verify DB connection
    try:
        from db.sqlite_client import get_dashboard_stats
        get_dashboard_stats()
        test_chroma_connection()
        return {"status": "ok", "db": "connected"}
    except Exception as e:
        logger.error(f"Database unavailable: {str(e)}", exc_info=True)
        raise HTTPException(status_code=503, detail="Database unavailable")

@app.get("/chroma-test")
async def chroma_test():
    try:
        result = test_chroma_connection()
        return result
    except Exception as e:
        logger.error(f"ChromaDB Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Internal Server Error: Vector database issue")

@app.post("/upload")
@limiter.limit("5/minute")
async def upload_document(request: Request, file: UploadFile = File(...)):
    try:
        # Validate file type
        if file.content_type not in ["text/plain", "application/pdf"]:
            raise HTTPException(status_code=400, detail="Only .txt and .pdf files are supported")
        
        contents = await file.read()
        
        # Validate file size (e.g. 5MB)
        if len(contents) > 5 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 5MB limit")

        chunks = process_document(contents, file.filename)
        num_stored = generate_and_store_embeddings(chunks, file.filename)
        return {
            "message": f"Successfully processed and embedded {file.filename}",
            "chunks_created": len(chunks),
            "chunks_stored": num_stored
        }
    except Exception as e:
        logger.error(f"Failed to process document: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to process document")

@app.post("/retrieve")
async def retrieve(request: QueryRequest):
    try:
        chunks = retrieve_chunks(request.query, request.top_k)
        return {"query": request.query, "results": chunks}
    except Exception as e:
        logger.error(f"Failed to retrieve chunks: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve information")

def run_evals_background(log_id: int, query: str, answer: str, chunks: list[str]):
    # Extract just the text from the chunks for faithfulness evaluation
    chunk_texts = [c["document"] for c in chunks]
    faithfulness = evaluate_faithfulness(answer, chunk_texts)
    relevance = evaluate_relevance(query, answer)
    update_log_evals(log_id, faithfulness, relevance)

@app.post("/ask")
@limiter.limit("20/minute")
async def ask_question(request: Request, query_req: QueryRequest, background_tasks: BackgroundTasks):
    start_time = time.time()
    try:
        # 1. Retrieve chunks
        chunks = retrieve_chunks(query_req.query, query_req.top_k)
        
        # 2. Generate answer
        generation_result = generate_answer(query_req.query, chunks)
        answer = generation_result["answer"]
        
        latency_ms = (time.time() - start_time) * 1000
        
        # Calculate true cost based on Groq Llama-3.3-70b pricing ($0.59/M input, $0.79/M output)
        prompt_cost = (generation_result["prompt_tokens"] / 1_000_000) * 0.59
        completion_cost = (generation_result["completion_tokens"] / 1_000_000) * 0.79
        token_cost = prompt_cost + completion_cost
        
        # 3. Log query to SQLite
        log_entry = LogEntry(
            query=query_req.query,
            answer=answer,
            latency_ms=latency_ms,
            token_cost=token_cost
        )
        log_id = log_query(log_entry)
        
        # 4. Trigger background evals
        background_tasks.add_task(run_evals_background, log_id, query_req.query, answer, chunks)
        
        return {
            "log_id": log_id,
            "query": query_req.query,
            "answer": answer,
            "latency_ms": latency_ms,
            "retrieved_chunks": chunks
        }
    except Exception as e:
        logger.error(f"Failed to generate answer: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate answer")

@app.get("/log/{log_id}")
async def get_log_entry(log_id: int):
    log = get_log(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

@app.get("/dashboard/stats")
async def dashboard_stats():
    try:
        return get_dashboard_stats()
    except Exception as e:
        logger.error(f"Failed to fetch stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load dashboard statistics")

@app.get("/dashboard/logs")
async def dashboard_logs(limit: int = 50):
    try:
        return get_recent_logs(limit)
    except Exception as e:
        logger.error(f"Failed to fetch logs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to load activity logs")

import json
from services.evaluation import evaluate_precision_recall

import asyncio
# ... wait we can use asyncio.sleep because it's async def
@app.post("/eval/run")
async def run_eval_suite():
    try:
        queries = get_unique_recent_queries(10)
        if not queries:
            raise HTTPException(status_code=400, detail="No chat history found. Please ask at least 1 question first.")
            
        results = []
        total_faithfulness = 0
        total_relevance = 0
        
        for query in queries:
            chunks = retrieve_chunks(query, top_k=3)
            generation_result = generate_answer(query, chunks)
            answer = generation_result["answer"]
            chunk_texts = [c["document"] for c in chunks]
            
            faithfulness = evaluate_faithfulness(answer, chunk_texts)
            relevance = evaluate_relevance(query, answer)
            
            total_faithfulness += faithfulness
            total_relevance += relevance
            
            results.append({
                "query": query,
                "answer": answer,
                "faithfulness": faithfulness,
                "relevance": relevance,
            })
            
        avg_faithfulness = total_faithfulness / len(queries) if queries else 0
        avg_relevance = total_relevance / len(queries) if queries else 0
        
        return {
            "average_faithfulness": avg_faithfulness,
            "average_relevance": avg_relevance,
            "results": results
        }
    except Exception as e:
        logger.error(f"Failed to run eval suite: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to run evaluation suite")
