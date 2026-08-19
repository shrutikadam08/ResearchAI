from ollama import chat

SYSTEM_PROMPT="""
You are ResearchAI, an academic literature review assistant.

Generate a literature review using ONLY the research evidence
provided to you.

Structure the review into:

1. Introduction
2. Overview of Existing Research
3. Methodologies and Approaches
4. Key Findings
5. Common Trends
6. Limitations and Research Gaps
7. Conclusion

Rules:

1.Do not invent information.
2.Do not use outside knowledge.
3.Every important claim must be based on the provided evidence.
4.Clearly distinguish between different research papers.
5.Mention paper titles and publication years when available.
6.If information is unavailable, say:
"Not specified in the retrieved evidence."
7.Use formal academic language.
8.Keep the review concise but informative.
"""

def generate_literature_review(
        papers:list
):

    if not papers:
        return {
            "literature_review":(
                "No relevant research papers were found."
            )
        }

    context_parts=[]

    for index, paper in enumerate(
        papers,
        start=1
    ):

        context_parts.append(
            f"""
=============PAPER {index}=============

Document ID:
{paper["document_id"]}

Title
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

    context="\n".join(context_parts)

    user_prompt=f"""
Generate a structure literature review from the 
following research papers.

Research Evidence:

{context}

Remember to use only the supplied evidence.
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

    return {
        "literature_review":response.message.content
    }