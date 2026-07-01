import os
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

# Point ChromaDB to look for the model files directly inside our git repository!
# This bypasses the need for Render to download 80MB over the internet at startup,
# which prevents the httpx timeout from crashing the deployment.
repo_root = os.path.dirname(os.path.dirname(__file__))
ONNXMiniLM_L6_V2.DOWNLOAD_PATH = os.path.join(repo_root, "onnx_models", "all-MiniLM-L6-v2")

# Initialize the ONNX model (it will find the local files instantly)
onnx_ef = ONNXMiniLM_L6_V2(preferred_providers=["CPUExecutionProvider"])

def get_embedding(text: str, is_query: bool = False) -> list[float]:
    """Generates an embedding using the self-contained ONNX model."""
    embeddings = onnx_ef([text])
    return embeddings[0]
