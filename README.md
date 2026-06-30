# RAG-Eval

**Most RAG chatbots just answer questions over documents. This one also tells you, automatically, whether it's lying to you — and tracks its own performance like a production system would.**

RAG-Eval is a full-stack Retrieval-Augmented Generation pipeline with built-in evaluation and observability. 

## Features
- **Ingestion + Retrieval:** Upload documents, chunk them, embed them, and store them in ChromaDB.
- **Generation:** Gemini-powered generation grounded in retrieved context.
- **Eval & Observability:** Automatically scores every answer on retrieval precision/recall, faithfulness (hallucination check), and answer relevance.
- **Monitoring Dashboard:** Tracks latency, token cost, and eval scores over time.

## Architecture
*(Architecture diagram coming soon)*

## Tech Stack
- **Backend:** Python, FastAPI
- **Vector DB:** ChromaDB (Local)
- **Embeddings:** `sentence-transformers` (Local)
- **LLM:** Google Gemini API
- **Frontend:** React + Next.js + Tailwind CSS
- **Observability:** SQLite
