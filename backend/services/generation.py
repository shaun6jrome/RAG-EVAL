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

def generate_answer(query: str, retrieved_chunks: list[dict]) -> dict:
    """
    Generates an answer using Gemini, grounded in the retrieved chunks.
    """
    if not retrieved_chunks:
        return {
            "answer": "I could not find any relevant information to answer your question.",
            "prompt_tokens": 0,
            "completion_tokens": 0
        }
        
    context = "\n\n---\n\n".join([chunk["document"] for chunk in retrieved_chunks])
    
    prompt = f"""You are a friendly, conversational AI assistant interacting with a user about a specific document.
Use the following retrieved context to answer the user's question clearly and politely. If the context contains lists or complex information, summarize it in a readable, conversational tone.

If the answer is not contained within the context, politely say "I'm sorry, but I don't see that information in the provided document."

Context:
{context}

Question: {query}
Answer:"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0
    )
    
    return {
        "answer": response.choices[0].message.content,
        "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
        "completion_tokens": response.usage.completion_tokens if response.usage else 0
    }
