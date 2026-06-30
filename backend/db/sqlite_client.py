import sqlite3
import os
from pydantic import BaseModel
from typing import Optional

# Path to the sqlite db
SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "rag_logs.db")

class LogEntry(BaseModel):
    query: str
    answer: str
    latency_ms: float
    token_cost: float = 0.0
    faithfulness_score: Optional[float] = None
    relevance_score: Optional[float] = None
    precision_score: Optional[float] = None

def init_db():
    """Initializes the SQLite database with the query_logs table."""
    conn = sqlite3.connect(SQLITE_DB_PATH)
    cursor = conn.cursor()
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
    conn.commit()
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

# Ensure DB is initialized when this module is imported
init_db()
