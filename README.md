# RAG-Eval: Observable & Self-Evaluating RAG Pipeline

**RAG-Eval** is a production-ready Retrieval-Augmented Generation (RAG) pipeline built with observability and automated evaluation as first-class citizens. 

While most RAG applications blindly retrieve documents and generate answers, they lack the mechanisms to detect hallucinations or measure the quality of their responses. RAG-Eval solves this by implementing an **LLM-as-a-judge** pattern that automatically scores every single answer for Faithfulness and Relevance in the background, all while providing a beautiful dashboard to monitor system latency, cost, and query volume.

🌐 **Live Demo:** [https://rag-eval-zeta.vercel.app/](https://rag-eval-zeta.vercel.app/)

---

## 🎯 Use Case & Purpose

The primary use case of RAG-Eval is to provide a reliable, hallucination-free way to query private documents (like company knowledge bases, research papers, or personal resumes). 

**Key Problems Solved:**
1. **Hallucination Detection:** By scoring the "Faithfulness" of every response, the system proves whether its answer was actually derived from the uploaded document, or if the AI made it up.
2. **Zero-Dependency Vectorization:** Cloud embedding APIs (like OpenAI's) cost money and can rate-limit you. This project solves that by running a highly optimized ONNX embedding model locally, meaning ingesting thousands of documents is completely free and requires zero internet connectivity.
3. **Observability:** It provides a visual dashboard to track exactly how much the system costs to run per query, how fast it is responding, and how accurate it is over time.

---

## ⚙️ How It Works (The Pipeline)

1. **Ingestion & Chunking:** When a user uploads a PDF, Markdown, or Text file, the backend extracts the text and splits it into logical, overlapping chunks (1000 characters each) to preserve context.
2. **Local Embedding:** These chunks are instantly converted into vector embeddings using a lightweight, locally hosted `all-MiniLM-L6-v2` ONNX model. No cloud API is used for this step.
3. **Vector Storage:** The embeddings are saved into a local ChromaDB instance for lightning-fast semantic search.
4. **Retrieval & Generation:** When a user asks a question, their query is embedded and compared against the database. The top 3 most relevant chunks are retrieved and sent to a powerful LLM (Llama-3 via Groq) alongside a strict system prompt to generate a conversational, accurate answer.
5. **Continuous Evaluation:** After the answer is sent to the user, a background task spins up. A secondary "Judge" LLM looks at the user's question, the retrieved context, and the generated answer. It computes a score from 0.0 to 1.0 for:
   - **Faithfulness:** Does the context support the answer?
   - **Relevance:** Did the answer actually address the prompt?
6. **Telemetry:** The scores, token costs, and latency are logged to a SQLite database and instantly visualized on the Next.js frontend Dashboard.

---

## 🛠️ Detailed Tech Stack

### Frontend
- **Next.js 16 (App Router):** The core React framework used for server-side rendering and routing.
- **Tailwind CSS v4:** Used for the dark-mode, glassmorphism UI styling, allowing for rapid, responsive design without writing custom CSS files.
- **Framer Motion:** Powers the smooth micro-animations, chat bubble pop-ins, and smooth accordion drop-downs.
- **Recharts:** Renders the interactive trend graphs on the observability dashboard.
- **Lucide React:** Clean, consistent iconography used throughout the interface.

### Backend
- **FastAPI (Python):** A lightning-fast, asynchronous web framework that handles the API routes, document uploads, and background evaluation tasks.
- **ChromaDB:** A high-performance, open-source vector database used to store and query the document embeddings.
- **ONNX Runtime:** Executes the `all-MiniLM-L6-v2` model directly on the CPU for free, instantaneous text embeddings.
- **LangChain:** Used specifically for its robust `RecursiveCharacterTextSplitter` to intelligently chunk documents without breaking sentences.
- **Groq API / OpenAI Client:** The `openai` Python SDK is used to interface with Groq's ultra-fast LPU inference engine, running the `llama3-8b-8192` model for generation and evaluation.
- **SQLite:** A lightweight, serverless relational database used to persist all chat logs, token costs, latency metrics, and evaluation scores.

---

## 🚀 Running Locally

### Backend Setup (Python)
1. Navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```
3. Install the pinned, stable dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file with your Groq API key:
   ```env
   GROQ_API_KEY=your_key_here
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   *The backend will be available at `http://localhost:8000`.*

### Frontend Setup (Next.js)
1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the Node packages:
   ```bash
   npm install
   ```
3. Ensure the `.env.local` points to your running backend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:3000`.*

---

## 🔮 Long-Term Maintainability
This project was architected to be highly resilient against software rot:
- **Zero Cloud Embedding Lock-in:** Because the ONNX model is stored directly in the repository (`backend/onnx_models`), the application does not rely on third-party embedding APIs that could be deprecated or put behind a paywall.
- **Pinned Dependencies:** The `requirements.txt` is strictly version-pinned to ensure future, breaking updates to libraries like LangChain or FastAPI do not crash the application.
- **Swappable LLM:** Because the generation script uses the standard OpenAI Python SDK format, the primary AI model can be instantly swapped from Groq to OpenAI, Anthropic, or even a local Ollama instance simply by changing the `base_url` variable.

---
*Designed & Built as a Showcase of Observable AI Engineering.*
