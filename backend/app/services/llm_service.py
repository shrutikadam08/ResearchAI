import ollama


MODEL_NAME = "qwen3:0.6b"


def generate_answer(
    question: str,
    evidence: str,
    conversation_history: str = ""
) -> str:

    prompt = f"""
You are ResearchAI, an academic research assistant.
Answer the user's question using ONLY the provided research evidence.

You mustcite factual claims using the citation numbers
provided in the evidence.

Citation rules:
-Use citations like [1],[2],[3].
-Place the citation immediately after the claim it supports.
-Use ONLY citation numbers that actually exist in the evidence.
-Never invent citation numbers.
-A single claim may have multiple citations, for example[1][2].
-If the evidence does not support a claim, do not make that claim.
-Do not use outside knowledge.

==================================================
CONVERSATION HISTORY
==================================================

{conversation_history}

==================================================
CURRENT USER QUESTION
==================================================

{question}

==================================================
RESEARCH EVIDENCE
==================================================

{evidence}

==================================================
ANSER REQUIREMENTS
==================================================

-Answer the current question directly.
-Use clear and simple academic language.
-Keep the answer concise but informative.
-Support factual statements with [number] citations.
-Do not create a separate "Sources" section.
-Do not explain the citation system.
"""

    response = ollama.chat(
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"]