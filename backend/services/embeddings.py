import os
from chromadb.utils import embedding_functions

# Use Chroma's incredibly lightweight ONNX model (all-MiniLM-L6-v2)
# This runs locally without PyTorch, using very little memory!
default_ef = embedding_functions.DefaultEmbeddingFunction()

def get_embedding(text: str, is_query: bool = False) -> list[float]:
    """Generates an embedding using the default lightweight ONNX model."""
    embeddings = default_ef([text])
    return embeddings[0]
