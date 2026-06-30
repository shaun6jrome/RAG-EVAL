import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Gemini Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def generate_answer(query: str, retrieved_chunks: list[dict]) -> str:
    """
    Generates an answer using Gemini, grounded in the retrieved chunks.
    """
    if not retrieved_chunks:
        return "I could not find any relevant information to answer your question."
        
    context = "\n\n---\n\n".join([chunk["document"] for chunk in retrieved_chunks])
    
    prompt = f"""You are a helpful AI assistant. Use the following retrieved context to answer the user's question.
If the answer is not contained within the context, say "I don't know based on the provided context."

Context:
{context}

Question: {query}
Answer:"""

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
        config=types.GenerateContentConfig(
            temperature=0.0
        )
    )
    
    return response.text
