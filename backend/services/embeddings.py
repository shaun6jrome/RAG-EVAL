import uuid
from sentence_transformers import SentenceTransformer
from db.chroma_client import get_chroma_client

# Load the local model (downloads on first run)
model = SentenceTransformer('all-MiniLM-L6-v2')

def get_embedding(text: str) -> list[float]:
    """Generates an embedding for a given text."""
    embedding = model.encode(text)
    return embedding.tolist()

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
        embedding = get_embedding(chunk)
        
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
