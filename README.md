# RAG-Eval

RAG-Eval is a Retrieval-Augmented Generation (RAG) pipeline built with evaluation and observability as first-class citizens. Unlike most RAG chatbots that just answer questions, RAG-Eval automatically scores its own answers for faithfulness and relevance using an LLM-as-a-judge pattern, while tracking performance metrics like latency and cost.

## Features

- **Ingestion & Retrieval**: Upload documents (PDF, TXT, MD), chunk them automatically, embed them using local SentenceTransformers (`all-MiniLM-L6-v2`), and store them in ChromaDB.
- **Generation**: Powered by Google's Gemini Flash API for high-quality answers.
- **Continuous Evaluation**: Every answer is evaluated asynchronously for:
  - **Faithfulness**: Is the answer supported by the retrieved context?
  - **Relevance**: Does the answer actually address the user's question?
- **Observability Dashboard**: Tracks query volume, latency trends, cost, and evaluation score trends.
- **Dark Cinematic UI**: A beautiful Glassmorphism interface built with Next.js and Tailwind CSS.

## Architecture

1. **Backend**: FastAPI (Python)
   - `/upload`: Handles document ingestion, chunking (LangChain), and embedding (ChromaDB).
   - `/ask`: Retrieves relevant chunks, queries Gemini, logs the query to SQLite, and triggers a background task for evaluation.
   - `/eval/run`: Runs a test suite (`test_set.json`) to compute aggregate precision/recall/faithfulness/relevance.
2. **Frontend**: Next.js (React) + Tailwind CSS
   - Chat Interface: Chat with your documents and view context.
   - Dashboard: Monitor metrics and evaluation scores.

## Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+
- A Gemini API Key

### Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set your Gemini API Key:
   ```bash
   export GEMINI_API_KEY="your_api_key_here"
   ```
4. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend will run on `http://localhost:8000`.

### Frontend Setup

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`.

### Running a Demo

1. With the backend running, use the ingestion script to upload a demo file:
   ```bash
   cd backend/scripts
   python ingest_demo.py
   ```
2. Open the frontend and ask: "What is RAG-Eval?"

## License
MIT
