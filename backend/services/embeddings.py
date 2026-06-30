import uuid
import os
import google.generativeai as genai
from db.chroma_client import get_chroma_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def get_embedding(text: str, is_query: bool = False) -> list[float]:
    """Generates an embedding for a given text using Gemini API."""
    task_type = "retrieval_query" if is_query else "retrieval_document"
    
    result = genai.embed_content(
        model="models/text-embedding-004",
        content=text,
        task_type=task_type
    )
    return result['embedding']

def generate_and_store_embeddings(chunks: list[str], source_filename: str):
    """Generates embeddings for chunks and stores them in ChromaDB."""
    client = get_chroma_client()
    collection = client.get_or_create_collection(name="documents")
    
    ids = []
    embeddings = []
    metadatas = []
    documents = []
    
    for i, chunk in enumerate(chunks):
        # Generate unique ID for each chunk
        chunk_id = f"{source_filename}_{uuid.uuid4()}_{i}"
        embedding = get_embedding(chunk, is_query=False)
        
        ids.append(chunk_id)
        embeddings.append(embedding)
        documents.append(chunk)
        metadatas.append({
            "source": source_filename,
            "chunk_index": i
        })
        
    # Insert into ChromaDB
    if ids:
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
    
    return len(ids)
