from db.chroma_client import get_chroma_client
from services.embeddings import get_embedding

def retrieve_chunks(query: str, top_k: int = 3) -> list[dict]:
    """
    Retrieves the top_k most relevant chunks for a given query.
    """
    client = get_chroma_client()
    collection = client.get_or_create_collection(name="documents")
    
    if collection.count() == 0:
        return []
        
    query_embedding = get_embedding(query, is_query=True)
    
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k
    )
    
    retrieved = []
    if results["documents"] and len(results["documents"]) > 0:
        for i in range(len(results["documents"][0])):
            retrieved.append({
                "id": results["ids"][0][i],
                "document": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "distance": results["distances"][0][i] if results["distances"] else None
            })
            
    return retrieved
