import chromadb
import os

# Directory for local ChromaDB
CHROMA_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "chroma_db")

def get_chroma_client():
    """
    Returns a persistent ChromaDB client pointing to the local chroma_db directory.
    """
    client = chromadb.PersistentClient(path=CHROMA_DATA_PATH)
    return client

def test_chroma_connection():
    """
    Tests if we can connect to Chroma and perform a simple operation.
    """
    client = get_chroma_client()
    # Create or get a test collection
    collection = client.get_or_create_collection(name="test_collection")
    return {"status": "ok", "collections_count": len(client.list_collections())}
