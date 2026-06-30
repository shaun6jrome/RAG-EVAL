import os
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Groq Client
client = openai.OpenAI(
    api_key=os.getenv("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1"
)

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

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0
    )
    
    return response.choices[0].message.content
