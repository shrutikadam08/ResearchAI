import time

from ollama import chat

from app.services.citation_service import (
    build_citations,
    format_citations,
)


# ============================================================
# SETTINGS
# ============================================================

OLLAMA_MODEL = "qwen3:0.6b"

MAX_EVIDENCE_ITEMS = 12

MAX_EVIDENCE_CHARS = 18000


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are ResearchAI, an AI research assistant.

Your task is to answer the user's question using ONLY
the research evidence provided to you.

Rules:

1. Do not invent information.
2. Do not use outside knowledge.
3. If the evidence does not contain enough information,
say that the information could not be found in the
uploaded research papers.
4. Give a clear and concise answer.
5. Do not mention that you are an AI model.
6. Do not create fake citations.
7. Keep the answer directly related to the question.
8. Prefer short, evidence-based answers.
"""


# ============================================================
# GENERATE RESEARCH ANSWER
# ============================================================

def generate_research_answer(
    question: str,
    evidence: list,
):

    total_start = time.perf_counter()

    print(
        "\n========== ANSWER SERVICE =========="
    )


    # ========================================================
    # NO EVIDENCE
    # ========================================================

    if not evidence:

        print(
            "No evidence available."
        )

        print(
            "====================================\n"
        )

        return {
            "answer": (
                "I could not find enough relevant "
                "information in the uploaded research papers."
            ),
            "sources": [],
        }


    # ========================================================
    # LIMIT EVIDENCE
    # ========================================================

    selected_evidence = []

    total_characters = 0


    for item in evidence:

        if not isinstance(
            item,
            dict
        ):
            continue


        if "text" not in item:
            continue


        text = str(
            item.get(
                "text",
                ""
            )
        ).strip()


        if not text:
            continue


        remaining_characters = (
            MAX_EVIDENCE_CHARS
            - total_characters
        )


        if remaining_characters <= 0:
            break


        if len(text) > remaining_characters:

            text = text[
                :remaining_characters
            ]


        selected_evidence.append(
            {
                **item,
                "text": text,
            }
        )


        total_characters += len(
            text
        )


        if (
            len(
                selected_evidence
            )
            >= MAX_EVIDENCE_ITEMS
        ):
            break


    print(
        f"Original evidence items: "
        f"{len(evidence)}"
    )


    print(
        f"Selected evidence items: "
        f"{len(selected_evidence)}"
    )


    # ========================================================
    # CHECK AFTER FILTERING
    # ========================================================

    if not selected_evidence:

        print(
            "No usable evidence after filtering."
        )

        print(
            "====================================\n"
        )

        return {
            "answer": (
                "I could not find enough relevant "
                "information in the uploaded research papers."
            ),
            "sources": [],
        }


    # ========================================================
    # BUILD CONTEXT
    # ========================================================

    context_start = time.perf_counter()

    context_parts = []

    sources = []


    for item in selected_evidence:

        document_id = item.get(
            "document_id"
        )

        page_number = item.get(
            "page_number"
        )

        text = item.get(
            "text",
            ""
        )


        context_parts.append(
            f"""
DOCUMENT ID: {document_id}
PAGE: {page_number}

EVIDENCE:
{text}
"""
        )


        sources.append(
            {
                "document_id":
                    document_id,

                "page_number":
                    page_number,
            }
        )


    context = "\n".join(
        context_parts
    )


    context_time = (
        time.perf_counter()
        - context_start
    )


    print(
        f"Context characters: "
        f"{len(context)}"
    )


    print(
        f"Context preparation time: "
        f"{context_time:.2f}s"
    )


    # ========================================================
    # BUILD USER PROMPT
    # ========================================================

    user_prompt = f"""
Research Evidence:

{context}

User Question:

{question}

Answer the question using only the evidence above.

Keep the answer concise and directly supported by
the research evidence.
"""


    print(
        f"Question characters: "
        f"{len(question)}"
    )


    print(
        f"Prompt characters: "
        f"{len(user_prompt)}"
    )


    # ========================================================
    # OLLAMA
    # ========================================================

    print(
        "\nStarting Ollama..."
    )


    llm_start = time.perf_counter()


    response = chat(

        model=OLLAMA_MODEL,

        messages=[
            {
                "role":
                    "system",

                "content":
                    SYSTEM_PROMPT,
            },

            {
                "role":
                    "user",

                "content":
                    user_prompt,
            },
        ],

        options={

            "temperature":
                0,

            "num_predict":
                300,

        },
    )


    llm_time = (
        time.perf_counter()
        - llm_start
    )


    print(
        f"Ollama generation time: "
        f"{llm_time:.2f}s"
    )


    # ========================================================
    # GET ANSWER
    # ========================================================

    final_answer = (
        response.message.content
        if response
        and response.message
        and response.message.content
        else ""
    )


    if not final_answer.strip():

        final_answer = (
            "I could not generate an answer "
            "from the available research evidence."
        )


    # ========================================================
    # CITATIONS
    # ========================================================

    citation_start = time.perf_counter()


    citations = build_citations(
        sources
    )


    citation_text = (
        format_citations(
            citations
        )
    )


    citation_time = (
        time.perf_counter()
        - citation_start
    )


    print(
        f"Citation processing time: "
        f"{citation_time:.2f}s"
    )


    # ========================================================
    # APPEND CITATIONS
    # ========================================================

    if citation_text:

        final_answer = (
            final_answer
            + "\n\n"
            + citation_text
        )


    # ========================================================
    # TOTAL TIME
    # ========================================================

    total_time = (
        time.perf_counter()
        - total_start
    )


    print(
        f"Total answer service time: "
        f"{total_time:.2f}s"
    )


    print(
        "====================================\n"
    )


    # ========================================================
    # RETURN
    # ========================================================

    return {

        "answer":
            final_answer,

        "sources":
            citations,

    }