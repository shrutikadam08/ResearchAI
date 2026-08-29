import os

from dotenv import load_dotenv

load_dotenv()

# ============================================================
# AI CONFIGURATION
# ============================================================

AI_PROVIDER = os.getenv(
    "AI_PROVIDER",
    "ollama"
).lower()

OLLAMA_MODEL = os.getenv(
    "OLLAMA_MODEL",
    "qwen3:0.6b"
)

GEMINI_MODEL = os.getenv(
    "GEMINI_MODEL",
    "gemini-2.5-flash"
)


# ============================================================
# PROMPT
# ============================================================

def build_prompt(
    question: str,
    evidence: str,
    conversation_history: str = ""
) -> str:

    return f"""
You are ResearchAI, an academic research assistant.

Answer the user's question using ONLY the provided
research evidence.

You must cite factual claims using the citation numbers
provided in the evidence.

Citation rules:
- Use citations like [1], [2], [3].
- Place citations immediately after the claim they support.
- Use ONLY citation numbers that actually exist.
- Never invent citation numbers.
- A claim may have multiple citations, for example [1][2].
- If the evidence does not support a claim, do not make it.
- Do not use outside knowledge.

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
ANSWER REQUIREMENTS
==================================================

- Answer the current question directly.
- Use clear and simple academic language.
- Keep the answer concise but informative.
- Support factual statements with [number] citations.
- Do not create a separate "Sources" section.
- Do not explain the citation system.
"""


# ============================================================
# OLLAMA
# ============================================================

def generate_with_ollama(
    prompt: str
) -> str:

    import ollama

    response = ollama.chat(
        model=OLLAMA_MODEL,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    return response["message"]["content"]


# ============================================================
# GEMINI
# ============================================================

def generate_with_gemini(
    prompt: str
) -> str:

    from google import genai

    api_key = os.getenv(
        "GEMINI_API_KEY"
    )

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured."
        )

    client = genai.Client(
        api_key=api_key
    )

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    text = response.text

    if not text:
        raise ValueError(
            "Gemini returned an empty response."
        )

    return text


# ============================================================
# MAIN GENERATION FUNCTION
# ============================================================

def generate_answer(
    question: str,
    evidence: str,
    conversation_history: str = ""
) -> str:

    prompt = build_prompt(
        question=question,
        evidence=evidence,
        conversation_history=conversation_history,
    )

    if AI_PROVIDER == "gemini":
        return generate_with_gemini(
            prompt
        )

    return generate_with_ollama(
        prompt
    )