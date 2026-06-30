import sqlite3
import os
from pydantic import BaseModel
from typing import Optional

# Path to the sqlite db
SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "rag_logs.db")

class LogEntry(BaseModel):
    query: str
    answer: str
    latency_ms: float
    token_cost: float = 0.0
    faithfulness_score: Optional[float] = None
    relevance_score: Optional[float] = None
    precision_score: Optional[float] = None

def init_db():
    """Initializes the SQLite database with the query_logs table and handles migrations."""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("PRAGMA user_version")
    version = cursor.fetchone()[0]
    
    if version == 0:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS query_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                answer TEXT NOT NULL,
                latency_ms REAL NOT NULL,
                token_cost REAL DEFAULT 0.0,
                faithfulness_score REAL,
                relevance_score REAL,
                precision_score REAL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        cursor.execute("PRAGMA user_version = 1")
        conn.commit()
    
    # Future migrations can be added here:
    # if version == 1:
    #     cursor.execute("ALTER TABLE query_logs ADD COLUMN new_col TEXT")
    #     cursor.execute("PRAGMA user_version = 2")
    #     conn.commit()
        
    conn.close()

def log_query(entry: LogEntry):
    """Inserts a new query log entry."""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO query_logs 
        (query, answer, latency_ms, token_cost, faithfulness_score, relevance_score, precision_score)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        entry.query, 
        entry.answer, 
        entry.latency_ms, 
        entry.token_cost, 
        entry.faithfulness_score, 
        entry.relevance_score, 
        entry.precision_score
    ))
    log_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return log_id

def update_log_evals(log_id: int, faithfulness: float, relevance: float):
    """Updates an existing log with eval scores."""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE query_logs 
        SET faithfulness_score = ?, relevance_score = ?
        WHERE id = ?
    """, (faithfulness, relevance, log_id))
    conn.commit()
    conn.close()

def get_log(log_id: int):
    """Retrieves a single log by ID."""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM query_logs WHERE id = ?", (log_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_dashboard_stats():
    """Retrieves aggregate statistics for the dashboard."""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            COUNT(*) as total_queries,
            AVG(latency_ms) as avg_latency,
            SUM(token_cost) as total_cost,
            AVG(faithfulness_score) as avg_faithfulness,
            AVG(relevance_score) as avg_relevance,
            AVG(precision_score) as avg_precision
        FROM query_logs
    """)
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else {}

def get_recent_logs(limit: int = 50):
    """Retrieves the most recent query logs."""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM query_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_unique_recent_queries(limit: int = 10):
    """Retrieves the most recent unique queries for realistic evaluation."""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("""
        SELECT query FROM query_logs 
        GROUP BY query
        ORDER BY MAX(id) DESC 
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [row["query"] for row in rows]

# Ensure DB is initialized when this module is imported
init_db()
