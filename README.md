# RAG-Eval Pipeline (2026 Edition)

Welcome to the RAG-Eval project. This project was built to be a fully observable, highly accurate, and completely free RAG pipeline.

## 🕰️ Future-Proofing (For your 2029 self)
If you are opening this project years from now, here is how we ensured it will still work:

### 1. The Embeddings & Database are 100% Local
We intentionally removed all reliance on cloud embedding APIs (like Google Gemini or OpenAI). Instead, the `all-MiniLM-L6-v2` ONNX model is committed directly to this repository (`backend/onnx_models`). When the server starts, it loads the model from disk into ChromaDB. 
* **Why this matters:** You will never face an "API Deprecated", "Rate Limit Exceeded", or "Timeout" error during startup or document upload. The core RAG engine is entirely self-contained.

### 2. Pinned Dependencies
All Python dependencies in `backend/requirements.txt` are pinned to their exact versions from July 2026. This guarantees that future, backwards-incompatible releases of FastAPI, ChromaDB, or LangChain will not break your build.

### 3. Swappable LLM Generation
The only external dependency is the Groq API, used in `backend/services/generation.py` to generate the final chat answers.
If Groq no longer exists or changes their free tier, **do not panic**. 
We used the standard `openai.OpenAI` Python client. You can instantly swap to any modern LLM by changing two lines in `generation.py`:
```python
client = openai.OpenAI(
    api_key="YOUR_NEW_API_KEY",
    base_url="https://api.openai.com/v1" # Or any local server like Ollama (http://localhost:11434/v1)
)
```

## 🚀 Running Locally

### Backend (Python/FastAPI)
1. `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `source venv/bin/activate` (Mac/Linux) or `.\venv\Scripts\activate` (Windows)
4. Install exactly pinned packages: `pip install -r requirements.txt`
5. Create a `.env` file with `GROQ_API_KEY=your_key_here`
6. Run the server: `uvicorn main:app --reload`

### Frontend (Next.js)
1. `cd frontend`
2. Install packages: `npm install`
3. Run the dev server: `npm run dev`
4. Ensure the `.env.local` points to your backend: `NEXT_PUBLIC_API_URL=http://localhost:8000`

## 📊 Architecture
- **Frontend**: Next.js, React, Tailwind CSS, Framer Motion
- **Backend**: FastAPI, Python
- **Vector DB**: ChromaDB (Local Ephemeral/Persistent)
- **Embeddings**: ONNX `all-MiniLM-L6-v2` (Local)
- **LLM**: Llama-3 (via Groq API)
- **Evals**: Faithfulness & Relevance scoring on every turn
