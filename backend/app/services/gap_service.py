from ollama import chat

SYSTEM_PROMPT="""
You are ResearchAI, an academic research-gap analysis assistant.

Identify potential research gaps using ONLY the evidence provided
from the research papers.

Analyze:

1.Explicitly stated limitations
2.Unaddressed problems
3.Missing features or approaches
4.Areas suggested for future work
5.Differences between existing approaches
6.Opportunities for further research

For each potential research gap, provide:

-Gap
-Evidence
-Supporting paper
-Page number
-Why it may represent a research opportunity

Rules:
1.Do not invent information.
2.Do not claim that something is a research gap unless supported 
by the supplied evidence.
3.Clearly distinguish explicit limitations from inferred opportunities.
4.Use cautious academic language.
5.If evidence is insufficient, say so.
"""

def analyze_research_gaps(
        papers:list
):

    if not papers:
        return{
            "research_gaps":(
                "No relevant evidence was found."
            )
        }

    context_parts=[]

    for index, paper in enumerate(
        papers,
        start=1
    ):

        context_parts.append(
            f"""
===========PAPER {index}=================

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
Page {item["page_number"]}
Query used: {item["query"]}

{item["text"]}
"""
            )

    context = "\n".join(context_parts)

    user_prompt = f"""
Analyze the following research papers and identify
potential research gaps.

Research Evidence:

{context}

Identify gaps only when they are supported by the evidence.
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
        "research_gaps": response.message.content
    }
        