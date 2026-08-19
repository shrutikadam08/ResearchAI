from ollama import chat
from app.services.citation_service import(
    build_citations,
    format_citations
)

SYSTEM_PROMPT="""
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
"""

def generate_research_answer(
        question:str,
        evidence:list
):
    if not evidence:
        return {
            "answer":(
                "I could not find enough relevant"
                "information in the uplaoded research papers."
            ),
            "sources":[]
        }

    context_parts=[]

    sources=[]

    for item in evidence:

        if "text" in item:
            document_id=item["document_id"]
            page_number=item["page_number"]
            text=item["text"]

            context_parts.append(
                f"""
DOCUMENT ID: {document_id}
Page: {page_number}

Context:
{text}
"""
            )

            sources.append({
                "document_id":document_id,
                "page_number":page_number
            })

    context="\n".join(context_parts)

    user_prompt=f"""
Research Evidence:

{context}

User Question:

{question}

Answer the question using only the evidence above.
"""

    response=chat(
        model="qwen3:0.6b",
        messages=[
            {
                "role":"system",
                "content":SYSTEM_PROMPT
            },
            {
                "role":"user",
                "content":user_prompt
            }
        ],
        options={
            "temperature":0
        }
    )

    citations=build_citations(sources)
    citation_text=format_citations(citations)

    final_answer=response.message.content

    if citation_text:
        final_answer=(
            final_answer
            + "\n\n"
            + citation_text
        )

    return {
        "answer": final_answer,
        "sources":citations 
    }
