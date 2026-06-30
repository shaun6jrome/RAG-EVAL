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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          fetch("http://localhost:8000/dashboard/stats"),
          fetch("http://localhost:8000/dashboard/logs?limit=20")
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

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-8 glass-panel p-4 px-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[var(--color-accent)] tracking-tight">
            Observability Dashboard
          </h1>
          <p className="text-sm text-gray-400 font-sans">RAG System Performance & Evals</p>
        </div>
        
        <Link href="/" className="glass-panel px-4 py-2 flex items-center gap-2 hover:bg-white/10 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </Link>
      </header>

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
    </div>
  );
}
