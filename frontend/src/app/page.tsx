"use client";

import { useState } from "react";
import { Send, Upload, FileText, ChevronDown, ChevronRight, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  retrieved_chunks?: any[];
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedChunks, setExpandedChunks] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("http://localhost:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      alert(`Uploaded! ${data.chunks_created} chunks created.`);
    } catch (error) {
      console.error(error);
      alert("Failed to upload document");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: userMsg.content, top_k: 3 }),
      });
      const data = await res.json();
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        retrieved_chunks: data.retrieved_chunks,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { id: Date.now().toString(), role: "assistant", content: "Error connecting to server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 glass-panel p-4 px-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--color-accent)] tracking-tight">
            RAG-Eval
          </h1>
          <p className="text-sm text-gray-400 font-sans">Observable RAG Pipeline</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <label className="cursor-pointer glass-panel px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition-colors text-sm font-medium">
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
            <div className="w-16 h-16 rounded-full glass-panel flex items-center justify-center">
              <FileText className="w-8 h-8 opacity-50" />
            </div>
            <p>Upload a document and ask a question to begin.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`max-w-[85%] ${msg.role === "user" ? "bg-[var(--color-accent)] text-white" : "glass-panel"} p-5 rounded-2xl`}>
                <div className="prose prose-invert max-w-none text-sm/relaxed">
                  {msg.content}
                </div>
                
                {/* Context viewer for assistant responses */}
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
                                <div className="text-[10px] text-[var(--color-accent)] uppercase tracking-wider mb-1 font-mono">
                                  Source: {chunk.metadata.source} (Chunk {chunk.metadata.chunk_index})
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
      <div className="glass-panel p-2 rounded-2xl flex items-center relative">
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
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 text-white p-3 rounded-xl transition-colors ml-2"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
