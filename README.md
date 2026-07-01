# RAG-Eval: Observable & Self-Evaluating RAG Pipeline

**RAG-Eval** is a production-ready Retrieval-Augmented Generation (RAG) pipeline built with observability and automated evaluation as first-class citizens. 

🌐 **Live Demo:** [https://rag-eval-zeta.vercel.app/](https://rag-eval-zeta.vercel.app/)

---

## 🧠 What is RAG? (And why do we need it?)

**RAG** stands for **Retrieval-Augmented Generation**. 

Standard Large Language Models (LLMs) like ChatGPT or Llama are trained on massive public datasets, but they have two major flaws:
1. **They lack private knowledge:** They don't know about your company's internal documents, your personal resume, or data created after their training cut-off.
2. **They hallucinate:** When they don't know an answer, they often confidently make things up.

**RAG solves this by combining "Search" with "Generation".** 
Instead of relying on the LLM's internal memory, a RAG pipeline first *Retrieves* relevant facts from a database of your private documents, and then *Augments* the LLM's prompt with those facts, instructing the LLM to *Generate* an answer based strictly on the provided context. 

This results in highly accurate, up-to-date, and domain-specific responses while drastically reducing hallucinations.

---

## 🎯 Why I Built This Project

Building a simple RAG chatbot is easy. Building a **reliable, production-grade** RAG system is incredibly difficult. 

I built **RAG-Eval** to showcase mastery over the entire AI engineering lifecycle. Most beginners stop at generating an answer. This project goes further by addressing the hardest challenges in modern AI:
1. **Hallucination Detection:** How do we prove the AI isn't lying? I implemented an **LLM-as-a-judge** loop (Step 11) that automatically scores every single answer for *Faithfulness* and *Relevance*.
2. **Zero-Dependency Vectorization:** Cloud embedding APIs (like OpenAI's) cost money and cause rate limits. I bypassed this entirely by deploying a highly optimized ONNX embedding model locally.
3. **Observability:** You can't improve what you can't measure. I built a comprehensive dashboard to track token costs, latency, and evaluation scores in real-time.

---

## ⚙️ The 11-Step Architecture (How It Works)

This pipeline closely follows the industry-standard 11-step RAG architecture:

1. **User Query:** The user asks a question via the Next.js chat interface.
2. **Query Preprocessing:** The backend (FastAPI) receives the query.
3. **Embedding Model:** A local `all-MiniLM-L6-v2` ONNX model instantly converts the text query into a semantic vector representation. *(No cloud APIs used)*.
4. **Vector Database:** The vector is sent to a local ChromaDB instance, which stores the embeddings of all previously uploaded documents (which were chunked using LangChain's Recursive splitter).
5. **Retriever:** ChromaDB performs a Dense Similarity Search.
6. **Top-k Relevant Documents:** The retriever returns the top 3 most relevant document chunks.
7. **Context Augmentation:** The backend merges these retrieved document chunks with the user's original query.
8. **Prompt Template:** The System Prompt + Retrieved Context + User Question are combined into a single, strict final prompt.
9. **Large Language Model (LLM):** The prompt is sent to Llama-3 (via the Groq API) for high-speed inference.
10. **Generated Response:** An accurate, grounded answer is returned to the user interface.
11. **Evaluation & Feedback:** In the background, a secondary "Judge" LLM evaluates the interaction, calculating scores for **Faithfulness** (did the context support the answer?) and **Relevance** (did it answer the prompt?). These metrics are logged to SQLite and displayed on the Dashboard.

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
