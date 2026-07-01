"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Upload, FileText, ChevronDown, ChevronRight, Activity, ShieldCheck, Target, Zap, BarChart2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type EvalScores = {
  faithfulness?: number;
  relevance?: number;
  precision?: number;
};

type Message = {
  id: string;
  log_id?: number;
  role: "user" | "assistant";
  content: string;
  retrieved_chunks?: any[];
  eval_scores?: EvalScores;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const savedMsgs = localStorage.getItem("rag_messages");
      const savedFile = localStorage.getItem("rag_active_file");
      if (savedMsgs) setMessages(JSON.parse(savedMsgs));
      if (savedFile) setActiveFile(savedFile);
    } catch (e) {
      console.error("Failed to parse localStorage", e);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("rag_messages", JSON.stringify(messages));
    } else {
      localStorage.removeItem("rag_messages");
    }
  }, [messages]);

  useEffect(() => {
    if (activeFile) {
      localStorage.setItem("rag_active_file", activeFile);
    } else {
      localStorage.removeItem("rag_active_file");
    }
  }, [activeFile]);

  // Poll for eval scores for assistant messages that lack them
  useEffect(() => {
    const interval = setInterval(async () => {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        
        for (let i = 0; i < updatedMessages.length; i++) {
          const msg = updatedMessages[i];
          if (msg.role === "assistant" && msg.log_id && !msg.eval_scores) {
            // Fetch log
            const API_URL = "https://rag-eval-backend-y97e.onrender.com";
            fetch(`${API_URL}/log/${msg.log_id}`)
              .then((res) => res.json())
              .then((data) => {
                if (data.faithfulness_score !== null && data.relevance_score !== null) {
                  setMessages((current) => {
                    const next = [...current];
                    const idx = next.findIndex(m => m.id === msg.id);
                    if (idx !== -1) {
                      next[idx].eval_scores = {
                        faithfulness: data.faithfulness_score,
                        relevance: data.relevance_score,
                        precision: data.precision_score,
                      };
                    }
                    return next;
                  });
                }
              })
              .catch(() => {});
          }
        }
        return prevMessages; // The actual state update happens in the promise resolution
      });
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const API_URL = "https://rag-eval-backend-y97e.onrender.com";
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || "Upload failed on the server.");
      }
      const data = await res.json();
      setActiveFile(file.name);
      alert(`Uploaded! ${data.chunks_created} chunks created.`);
    } catch (error) {
      console.error(error);
      alert("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async (overrideInput?: string | React.MouseEvent) => {
    // If it's an event (from a button click without args), ignore it, or we just take string
    const textToSend = typeof overrideInput === "string" ? overrideInput : input;
    if (!textToSend.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const API_URL = "https://rag-eval-backend-y97e.onrender.com";
      const res = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg.content, top_k: 3 }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(typeof errorData.detail === 'string' ? errorData.detail : "Server error");
      }
      
      const data = await res.json();
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        log_id: data.log_id,
        role: "assistant",
        content: data.answer,
        retrieved_chunks: data.retrieved_chunks,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Error connecting to server.";
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined || score === null) return "text-gray-500 border-gray-700 bg-gray-800/30";
    if (score >= 0.8) return "text-green-400 border-green-900 bg-green-950/30";
    if (score >= 0.5) return "text-amber-400 border-amber-900 bg-amber-950/30";
    return "text-red-400 border-red-900 bg-red-950/30";
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 glass-panel p-4 px-4 sm:px-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--color-accent)] tracking-tight">
            RAG-Eval
          </h1>
          <p className="text-sm text-gray-400 font-sans">Observable RAG Pipeline</p>
        </div>
        
        <div className="flex gap-2 sm:gap-4 items-center w-full sm:w-auto justify-between sm:justify-end">
          <Link href="/dashboard" className="glass-panel px-3 sm:px-4 py-2 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none whitespace-nowrap">
            <BarChart2 className="w-4 h-4" />
            Dashboard
          </Link>
          <label className="cursor-pointer glass-panel px-3 sm:px-4 py-2 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none whitespace-nowrap">
            {isUploading ? <Activity className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            <span>Upload Document</span>
            <input type="file" className="hidden" accept=".pdf,.txt,.md" onChange={handleUpload} disabled={isUploading} />
          </label>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto mb-6 space-y-6 pr-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center mb-2">
              <FileText className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg">Upload a document and ask a question to begin.</p>
            
            {activeFile && (
              <div className="mt-8 flex flex-col items-center">
                <p className="text-sm text-gray-400 mb-4">Try asking something like:</p>
                <div className="flex flex-wrap justify-center gap-3 max-w-2xl">
                  {[
                    "What is the main topic of this document?",
                    "Can you summarize the key points?",
                    "What is the work experience listed?",
                    "What are the main skills or technologies mentioned?"
                  ].map((q, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(q)}
                      className="glass-panel px-4 py-2 rounded-full text-sm hover:bg-[var(--color-accent)] hover:text-black transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] ${msg.role === "user" ? "bg-[var(--color-accent)] text-black" : "glass-panel"} p-5 rounded-2xl`}>
                <div className={`prose max-w-none text-sm/relaxed ${msg.role === "user" ? "" : "prose-invert"}`}>
                  {msg.content}
                </div>
                
                {/* Eval Badges */}
                {msg.role === "assistant" && msg.log_id && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {!msg.eval_scores ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-full border border-[var(--color-glass-border)] bg-[var(--color-glass)] text-gray-400">
                        <Activity className="w-3 h-3 animate-spin" />
                        Evaluating...
                      </span>
                    ) : (
                      <>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-full border ${getScoreColor(msg.eval_scores.faithfulness)}`}>
                          <ShieldCheck className="w-3 h-3" />
                          Faithfulness: {msg.eval_scores.faithfulness?.toFixed(2) || "N/A"}
                        </span>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded-full border ${getScoreColor(msg.eval_scores.relevance)}`}>
                          <Target className="w-3 h-3" />
                          Relevance: {msg.eval_scores.relevance?.toFixed(2) || "N/A"}
                        </span>
                        {/* Precision is not calculated on the fly yet, so we omit or show N/A */}
                      </>
                    )}
                  </div>
                )}

                {/* Context viewer */}
                {msg.role === "assistant" && msg.retrieved_chunks && msg.retrieved_chunks.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-glass-border)]">
                    <button 
                      onClick={() => setExpandedChunks(expandedChunks === msg.id ? null : msg.id)}
                      className="flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {expandedChunks === msg.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      View Retrieved Context ({msg.retrieved_chunks.length} chunks)
                    </button>
                    
                    <AnimatePresence>
                      {expandedChunks === msg.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 space-y-2">
                            {msg.retrieved_chunks.map((chunk, idx) => (
                              <div key={idx} className="bg-black/30 p-3 rounded-lg border border-[var(--color-glass-border)]">
                                <div className="text-[10px] text-[var(--color-accent)] uppercase tracking-wider mb-1 font-mono flex items-center justify-between">
                                  <span>Source: {chunk.metadata.source} (Chunk {chunk.metadata.chunk_index})</span>
                                  <span className="text-gray-500">Dist: {chunk.distance?.toFixed(3)}</span>
                                </div>
                                <div className="text-xs text-gray-300 font-mono line-clamp-3 hover:line-clamp-none transition-all">
                                  {chunk.document}
                                </div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="glass-panel p-4 rounded-2xl flex gap-2 items-center">
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: "0.1s" }} />
              <div className="w-2 h-2 rounded-full bg-[var(--color-accent)] animate-bounce" style={{ animationDelay: "0.2s" }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="mt-auto">
        {activeFile && (
          <div className="flex items-center justify-between glass-panel p-3 px-4 rounded-t-2xl border-b-0 border-[var(--color-glass-border)] text-sm font-medium">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--color-accent)]" />
              <span className="truncate max-w-[200px]">{activeFile}</span>
            </div>
            <button 
              onClick={() => {
                setActiveFile(null);
                setMessages([]);
              }}
              className="text-gray-400 hover:text-white p-1 rounded-md transition-colors"
              title="Close chat and clear local history"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className={`glass-panel p-2 flex items-center relative ${activeFile ? 'rounded-b-2xl rounded-t-none' : 'rounded-2xl'}`}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask a question based on your documents..."
          className="w-full bg-transparent border-none outline-none text-white px-4 py-3 placeholder:text-gray-500"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-black p-3 rounded-xl transition-colors ml-2"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
      </div>
    </div>
  );
}

// Force Vercel cache reset deployment
