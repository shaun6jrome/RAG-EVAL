# RAG-Eval Pipeline (2026 Edition)

Welcome to the **RAG-Eval** project. This project is a fully observable, highly accurate, and completely free Retrieval-Augmented Generation (RAG) pipeline. Unlike most RAG chatbots that just answer questions blindly, RAG-Eval automatically scores its own answers for **faithfulness** and **relevance** using an LLM-as-a-judge pattern, while tracking performance metrics like latency and cost.

🌐 **Live Demo:** [https://rag-eval-zeta.vercel.app/](https://rag-eval-zeta.vercel.app/)

---

## ✨ Features

- **End-to-End RAG Pipeline:** Upload documents (PDF, TXT, MD), chunk them automatically, and query them in natural language.
- **Continuous Evaluation:** Every single answer is evaluated asynchronously in the background for:
  - **Faithfulness:** Is the answer fully supported by the retrieved context? (No hallucinations)
  - **Relevance:** Does the answer actually address the user's question?
- **Observability Dashboard:** A dedicated analytics page that tracks query volume, latency trends, cost per query, and aggregate evaluation score trends.
- **100% Local Embeddings:** We intentionally removed all reliance on cloud embedding APIs. Documents are embedded instantly using a local `all-MiniLM-L6-v2` ONNX model and stored in a local ChromaDB instance.
- **Dark Cinematic UI:** A beautiful, responsive Glassmorphism interface built with Next.js, Tailwind CSS v4, and Framer Motion.

---

## 📊 Architecture

- **Frontend:** Next.js (App Router), React, Tailwind CSS v4, Recharts, Framer Motion
- **Backend:** FastAPI, Python, SQLite (for logging)
- **Vector DB:** ChromaDB (Local Persistent)
- **Embeddings:** ONNX `all-MiniLM-L6-v2` (Local, zero API keys required)
- **LLM Generator:** Llama-3 (via Groq API, using the standard OpenAI Python client)

---

## 🚀 Running Locally

### Backend (Python/FastAPI)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
3. Install exactly pinned packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your Groq API key:
   ```env
   GROQ_API_KEY=your_key_here
   ```
5. Run the server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will run on `http://localhost:8000`.*

### Frontend (Next.js)
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Ensure the `.env.local` points to your backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Run the dev server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:3000`.*

---

## 🕰️ Future-Proofing (For your 2029 self)

If you are opening this project years from now, here is how we ensured it will still work flawlessly:

### 1. The Embeddings & Database are 100% Local
We committed the `all-MiniLM-L6-v2` ONNX model directly to this repository (`backend/onnx_models`). When the server starts, it loads the model from disk into ChromaDB. You will never face an "API Deprecated", "Rate Limit Exceeded", or "Timeout" error during document upload. The core RAG engine is entirely self-contained.

### 2. Pinned Dependencies
All Python dependencies in `backend/requirements.txt` are pinned to their exact versions from July 2026. This guarantees that future, backwards-incompatible releases of FastAPI, ChromaDB, or LangChain will not break your build.

### 3. Swappable LLM Generation
The only external dependency is the Groq API. If Groq no longer exists or changes their free tier, **do not panic**. We used the standard `openai.OpenAI` Python client. You can instantly swap to any modern LLM by changing two lines in `backend/services/generation.py`:
```python
client = openai.OpenAI(
    api_key="YOUR_NEW_API_KEY",
    base_url="https://api.openai.com/v1" # Or any local server like Ollama (http://localhost:11434/v1)
)
```

---
*Designed & Built as a Showcase of Observable AI Engineering.*
