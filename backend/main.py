import time
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from db.chroma_client import test_chroma_connection
from services.ingestion import process_document
from services.embeddings import generate_and_store_embeddings
from services.retrieval import retrieve_chunks
from services.generation import generate_answer
from services.evaluation import evaluate_faithfulness, evaluate_relevance
from db.sqlite_client import log_query, update_log_evals, get_log, LogEntry

class QueryRequest(BaseModel):
    query: str
    top_k: int = 3

app = FastAPI(
    title="RAG-Eval API",
    description="Backend for RAG-Eval with observability and evaluation",
    version="1.0.0"
)

# Configure CORS for the frontend (Next.js typically runs on port 3000 locally)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"], # Restrict this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to RAG-Eval API"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/chroma-test")
async def chroma_test():
    try:
        result = test_chroma_connection()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ChromaDB Error: {str(e)}")

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        chunks = process_document(contents, file.filename)
        num_stored = generate_and_store_embeddings(chunks, file.filename)
        return {
            "message": f"Successfully processed and embedded {file.filename}",
            "chunks_created": len(chunks),
            "chunks_stored": num_stored
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@app.post("/retrieve")
async def retrieve(request: QueryRequest):
    try:
        chunks = retrieve_chunks(request.query, request.top_k)
        return {"query": request.query, "results": chunks}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve chunks: {str(e)}")

def run_evals_background(log_id: int, query: str, answer: str, chunks: list[str]):
    # Extract just the text from the chunks for faithfulness evaluation
    chunk_texts = [c["document"] for c in chunks]
    faithfulness = evaluate_faithfulness(answer, chunk_texts)
    relevance = evaluate_relevance(query, answer)
    update_log_evals(log_id, faithfulness, relevance)

@app.post("/ask")
async def ask_question(request: QueryRequest, background_tasks: BackgroundTasks):
    start_time = time.time()
    try:
        # 1. Retrieve chunks
        chunks = retrieve_chunks(request.query, request.top_k)
        
        # 2. Generate answer
        answer = generate_answer(request.query, chunks)
        
        latency_ms = (time.time() - start_time) * 1000
        
        # 3. Log query to SQLite
        log_entry = LogEntry(
            query=request.query,
            answer=answer,
            latency_ms=latency_ms,
            token_cost=0.001 # Stub token cost
        )
        log_id = log_query(log_entry)
        
        # 4. Trigger background evals
        background_tasks.add_task(run_evals_background, log_id, request.query, answer, chunks)
        
        return {
            "log_id": log_id,
            "query": request.query,
            "answer": answer,
            "latency_ms": latency_ms,
            "retrieved_chunks": chunks
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {str(e)}")

@app.get("/log/{log_id}")
async def get_log_entry(log_id: int):
    log = get_log(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log
