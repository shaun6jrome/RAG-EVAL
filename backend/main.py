from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from db.chroma_client import test_chroma_connection

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
