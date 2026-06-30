import os
from google import genai
from google.genai import types

def get_client():
    return genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

def evaluate_faithfulness(answer: str, retrieved_chunks: list[str]) -> float:
    """
    Evaluates if the answer is faithful to the retrieved chunks (0.0 to 1.0).
    A faithful answer contains only information supported by the chunks.
    """
    if not retrieved_chunks:
        return 0.0
        
    client = get_client()
    context = "\n\n---\n\n".join(retrieved_chunks)
    
    prompt = f"""You are an expert evaluator. Your task is to evaluate the faithfulness of an answer given a context.
An answer is faithful if all its claims can be directly inferred from the provided context.
Output ONLY a float value between 0.0 and 1.0 representing the faithfulness score.
Do not output any explanation, just the number.

Context:
{context}

Answer:
{answer}

Faithfulness Score (0.0 to 1.0):"""

    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.0,
                max_output_tokens=10
            )
        )
        score_text = response.text.strip()
        return float(score_text)
    except Exception as e:
        print(f"Faithfulness Eval Error: {e}")
        return 0.0
