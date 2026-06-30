import os
import re
import openai

def get_client():
    return openai.OpenAI(
        api_key=os.getenv("GROQ_API_KEY"),
        base_url="https://api.groq.com/openai/v1"
    )

def extract_float(text: str) -> float:
    match = re.search(r'(0\.\d+|1\.0|0|1)', text)
    if match:
        return float(match.group(1))
    return 0.0

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
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        response_text = response.choices[0].message.content
        if response_text:
            return extract_float(response_text.strip())
        else:
            print("Faithfulness Eval Error: response text is None")
            return 0.0
    except Exception as e:
        print(f"Faithfulness Eval Error: {e}")
        return 0.0

def evaluate_relevance(query: str, answer: str) -> float:
    """
    Evaluates if the answer is relevant to the question (0.0 to 1.0).
    A relevant answer actually addresses the core of the user's question.
    """
    if not answer or not query:
        return 0.0
        
    client = get_client()
    
    prompt = f"""You are an expert evaluator. Your task is to evaluate the relevance of an answer to a given question.
An answer is relevant if it directly addresses the question being asked. 
Output ONLY a float value between 0.0 and 1.0 representing the relevance score.
Do not output any explanation, just the number.

Question:
{query}

Answer:
{answer}

Relevance Score (0.0 to 1.0):"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        response_text = response.choices[0].message.content
        if response_text:
            return extract_float(response_text.strip())
        else:
            print("Relevance Eval Error: response text is None")
            return 0.0
    except Exception as e:
        print(f"Relevance Eval Error: {e}")
        return 0.0

def evaluate_precision_recall(retrieved_ids: list[str], ground_truth_ids: list[str]) -> dict:
    """
    Evaluates precision and recall based on chunk IDs.
    - Precision: % of retrieved chunks that are relevant.
    - Recall: % of relevant chunks that were retrieved.
    """
    if not retrieved_ids and not ground_truth_ids:
        return {"precision": 1.0, "recall": 1.0}
    if not retrieved_ids:
        return {"precision": 0.0, "recall": 0.0}
    if not ground_truth_ids:
        return {"precision": 0.0, "recall": 1.0}
        
    retrieved_set = set(retrieved_ids)
    ground_truth_set = set(ground_truth_ids)
    
    true_positives = len(retrieved_set.intersection(ground_truth_set))
    
    precision = true_positives / len(retrieved_set) if retrieved_set else 0.0
    recall = true_positives / len(ground_truth_set) if ground_truth_set else 0.0
    
    return {
        "precision": precision,
        "recall": recall
    }
