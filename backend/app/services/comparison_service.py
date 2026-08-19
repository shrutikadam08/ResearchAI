from ollama import chat


SYSTEM_PROMPT = """
You are ResearchAI, a research paper comparison assistant.

Compare research papers using ONLY the evidence provided.

For each paper, identify:

1. Methodology
2. Techniques or algorithms
3. Dataset or data source
4. Main findings or results
5. Limitations

Then provide:

- Similarities
- Differences
- Overall comparison

Rules:

1. Do not invent information.
2. Do not use outside knowledge.
3. If a detail is not available in the evidence, say:
   "Not specified in the retrieved evidence."
4. Clearly distinguish between papers.
5. Keep the comparison factual and concise.
"""


def compare_research_papers(
    question: str,
    papers: list
):

    if not papers:
        return {
            "comparison": (
                "No relevant research papers were found "
                "for comparison."
            )
        }

    context_parts = []

    for index, paper in enumerate(
        papers,
        start=1
    ):

        context_parts.append(
            f"""
========== PAPER {index} ==========

Document ID:
{paper["document_id"]}

Title:
{paper.get("title")}

Authors:
{paper.get("authors")}

Publication Year:
{paper.get("publication_year")}

Journal:
{paper.get("journal")}

Evidence:
"""
        )

        for item in paper["evidence"]:

            context_parts.append(
                f"""
Page {item["page_number"]}:

{item["text"]}
"""
            )

    context = "\n".join(context_parts)

    user_prompt = f"""
User Question:

{question}

Research Evidence:

{context}

Compare the papers using only the evidence above.
"""

    response = chat(
        model="qwen3:0.6b",
        messages=[
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        options={
            "temperature": 0
        }
    )

    return {
        "comparison": response.message.content
    }