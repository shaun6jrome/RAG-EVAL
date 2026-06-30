from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
