"use client";

import { useState, useEffect } from "react";
import { Activity, Clock, DollarSign, ShieldCheck, Target, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type DashboardStats = {
  total_queries: number;
  avg_latency: number;
  total_cost: number;
  avg_faithfulness: number;
  avg_relevance: number;
  avg_precision: number;
};

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvalRunning, setIsEvalRunning] = useState(false);
  const [evalResults, setEvalResults] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const API_URL = "https://rag-eval-backend-y97e.onrender.com";
      try {
        const [statsRes, logsRes] = await Promise.all([
          fetch(`${API_URL}/dashboard/stats`),
          fetch(`${API_URL}/dashboard/logs?limit=20`)
        ]);
        const statsData = await statsRes.json();
        const logsData = await logsRes.json();
        setStats(statsData);
        // Reverse logs for chronological order in charts
        setLogs(logsData.reverse());
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const runEvalSuite = async () => {
    setIsEvalRunning(true);
    setEvalResults(null);
    try {
      const API_URL = "https://rag-eval-backend-y97e.onrender.com";
      const res = await fetch(`${API_URL}/eval/run`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to run eval suite");
      const data = await res.json();
      setEvalResults(data);
    } catch (err) {
      console.error(err);
      alert("Failed to run eval suite");
    } finally {
      setIsEvalRunning(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 glass-panel p-4 px-4 sm:px-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--color-accent)] tracking-tight">
            Observability Dashboard
          </h1>
          <p className="text-sm text-gray-400 font-sans">RAG System Performance & Evals</p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
          <button 
            onClick={runEvalSuite}
            disabled={isEvalRunning}
            className="glass-panel px-3 sm:px-4 py-2 flex items-center justify-center gap-2 hover:bg-[var(--color-accent)] hover:text-black transition-colors text-xs sm:text-sm font-medium rounded-lg disabled:opacity-50 flex-1 sm:flex-none whitespace-nowrap"
          >
            {isEvalRunning ? <Activity className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isEvalRunning ? "Running..." : "Run Eval Suite"}
          </button>
          <Link href="/" className="glass-panel px-3 sm:px-4 py-2 flex items-center justify-center gap-2 hover:bg-white/10 transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none whitespace-nowrap">
            <ArrowLeft className="w-4 h-4" />
            Back to Chat
          </Link>
        </div>
      </header>

      {evalResults && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 glass-panel p-6 rounded-2xl border border-[var(--color-accent)]"
        >
          <h2 className="text-xl font-heading font-semibold mb-4 text-[var(--color-accent)]">Eval Suite Results</h2>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-6">
            <div>
              <p className="text-sm text-gray-400">Avg Faithfulness</p>
              <p className="text-2xl font-mono text-green-400">{evalResults.average_faithfulness.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg Relevance</p>
              <p className="text-2xl font-mono text-amber-400">{evalResults.average_relevance.toFixed(2)}</p>
            </div>
          </div>
          <div className="space-y-4">
            {evalResults.results.map((res: any, idx: number) => (
              <div key={idx} className="bg-black/30 p-4 rounded-lg">
                <p className="font-medium text-sm mb-2 text-white">Q: {res.query}</p>
                <div className="flex gap-4 text-xs font-mono">
                  <span className={res.faithfulness >= 0.8 ? "text-green-400" : "text-red-400"}>
                    Faithfulness: {res.faithfulness.toFixed(2)}
                  </span>
                  <span className={res.relevance >= 0.8 ? "text-amber-400" : "text-red-400"}>
                    Relevance: {res.relevance.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {isLoading && !stats ? (
        <div className="flex justify-center p-12">
          <Activity className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Stats Cards */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-sm font-medium">Total Queries</span>
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-3xl font-bold font-mono">{stats?.total_queries || 0}</span>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-sm font-medium">Avg Latency</span>
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-3xl font-bold font-mono">
              {stats?.avg_latency ? `${stats.avg_latency.toFixed(0)} ms` : "0 ms"}
            </span>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-sm font-medium">Avg Faithfulness</span>
              <ShieldCheck className="w-4 h-4 text-green-400" />
            </div>
            <span className="text-3xl font-bold font-mono text-green-400">
              {stats?.avg_faithfulness ? stats.avg_faithfulness.toFixed(2) : "N/A"}
            </span>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-sm font-medium">Avg Relevance</span>
              <Target className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-3xl font-bold font-mono text-amber-400">
              {stats?.avg_relevance ? stats.avg_relevance.toFixed(2) : "N/A"}
            </span>
          </div>
        </motion.div>
      )}

      {!isLoading && logs.length > 0 && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 rounded-2xl"
          >
            <h2 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[var(--color-accent)]" />
              Latency Trend (ms)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="id" stroke="#666" tick={{ fill: '#666' }} />
                  <YAxis stroke="#666" tick={{ fill: '#666' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-accent)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="latency_ms" 
                    stroke="var(--color-accent)" 
                    strokeWidth={2}
                    dot={{ fill: 'var(--color-accent)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 rounded-2xl"
          >
            <h2 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              Cost Trend ($)
            </h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={logs}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="id" stroke="#666" tick={{ fill: '#666' }} />
                  <YAxis stroke="#666" tick={{ fill: '#666' }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                    itemStyle={{ color: '#34d399' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="token_cost" 
                    stroke="#34d399" 
                    strokeWidth={2}
                    dot={{ fill: '#34d399', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}

      {!isLoading && logs.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 glass-panel p-6 rounded-2xl"
        >
          <h2 className="text-xl font-heading font-semibold mb-6 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Evaluation Scores Trend
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={logs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                <XAxis dataKey="id" stroke="#666" tick={{ fill: '#666' }} />
                <YAxis stroke="#666" tick={{ fill: '#666' }} domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="faithfulness_score" 
                  name="Faithfulness"
                  stroke="#4ade80" 
                  strokeWidth={2}
                  dot={{ fill: '#4ade80', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="relevance_score" 
                  name="Relevance"
                  stroke="#fbbf24" 
                  strokeWidth={2}
                  dot={{ fill: '#fbbf24', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Recent Queries Table */}
      {!isLoading && logs.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 glass-panel p-6 rounded-2xl overflow-hidden"
        >
          <h2 className="text-xl font-heading font-semibold mb-6">Recent Queries</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-400 uppercase bg-black/20">
                <tr>
                  <th className="px-6 py-3 rounded-tl-lg">ID</th>
                  <th className="px-6 py-3">Query</th>
                  <th className="px-6 py-3">Faithfulness</th>
                  <th className="px-6 py-3">Relevance</th>
                  <th className="px-6 py-3">Latency</th>
                  <th className="px-6 py-3 rounded-tr-lg">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {/* logs are in reverse chronological order from state, but for table we might want newest first. Wait, state `logs` is oldest-to-newest for charts. Let's reverse for the table */}
                {[...logs].reverse().map((log) => (
                  <tr key={log.id} className="border-b border-[var(--color-glass-border)] hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono">{log.id}</td>
                    <td className="px-6 py-4 font-medium max-w-xs truncate" title={log.query}>
                      {log.query}
                    </td>
                    <td className="px-6 py-4">
                      {log.faithfulness_score !== null ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-mono border ${
                          log.faithfulness_score >= 0.8 ? "text-green-400 border-green-900 bg-green-950/30" : 
                          log.faithfulness_score >= 0.5 ? "text-amber-400 border-amber-900 bg-amber-950/30" : 
                          "text-red-400 border-red-900 bg-red-950/30"
                        }`}>
                          {log.faithfulness_score.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic text-xs">Evaluating...</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.relevance_score !== null ? (
                        <span className={`px-2 py-1 rounded-full text-xs font-mono border ${
                          log.relevance_score >= 0.8 ? "text-green-400 border-green-900 bg-green-950/30" : 
                          log.relevance_score >= 0.5 ? "text-amber-400 border-amber-900 bg-amber-950/30" : 
                          "text-red-400 border-red-900 bg-red-950/30"
                        }`}>
                          {log.relevance_score.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-gray-500 italic text-xs">Evaluating...</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300">
                      {log.latency_ms.toFixed(0)} ms
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
