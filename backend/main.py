from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from db.chroma_client import test_chroma_connection
from services.ingestion import process_document
from services.embeddings import generate_and_store_embeddings
from services.retrieval import retrieve_chunks

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
