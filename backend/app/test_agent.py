from app.agent.router import select_tool
from app.agent.tools.search_tool import search_papers
from app.agent.tools.summary_tool import summarize_paper
from app.agent.tools.comparison_tool import compare_papers
from app.agent.tools.gap_tool import find_research_gaps
from app.agent.agent import run_agent

questions=[
    "What is the methodology used in the paper?",
    "Summarize the research paper",
    "Compare the methodologies of the papers",
    "What research gaps are identified?"
]

print("===========AGENT ROUTER TEST=============")

for question in questions:
    tool=select_tool(question)

    print("\nQuestion:",question)
    print("Selected tool:",tool)

print("\n\n===========SEARCH TOOL TEST===========")
project_id=3

search_question="How does the system perform resume screening?"

results=search_papers(
    project_id=project_id,
    query=search_question,
    n_results=3
)

print("\nQuestion:",search_question)
print("Number of results:", len(results))

for i, result in enumerate(results, start=1):
    print(f"\n--- Evidence {i} ---")
    print("Document ID:", result["document_id"])
    print("Page:", result["page_number"])
    print("Text:")
    print(result["text"][:500])

print("\n\n=========SUMMARY TOOL TEST=========")

summary_result=summarize_paper(
    project_id=3
)

print(
    "Evidence retrieved:",
    len(summary_result["evidence"])
)

for i, item in enumerate(
    summary_result["evidence"][:5],
    start=1
):
    print(f"\n---Summary Evidence {i} ---")
    print("Document ID:", item["document_id"])
    print("Page:", item["page_number"])
    print("Text:")
    print(item["text"][:500])

print("\n\n=========COMPARISON TOOL TEST=======")

comparison_result=compare_papers(
    project_id=3,
    query="methodology used for resume screening",
    n_results=10
)

print(
    "Documents found:",
    len(comparison_result["documents"])
)

for document in comparison_result["documents"]:
    print(
        f"\n--- Document {document['document_id']} ---"
    )

    for evidence in document["evidence"][:3]:
        print(
            f"Page: {evidence['page_number']}"
        )
        print(
            evidence["text"][:400]
        )

print("\n\n==========RESEARCH GAP TOOL TEST===========")

gap_result=find_research_gaps(
    project_id=3,
    n_results=5
)

print(
    "Documents found:",
    len(gap_result["documents"])
)

for document in gap_result["documents"]:
    print(
        f"\n--- Document {document['document_id']}---"
    )

    for evidence in document["evidence"][:5]:
        print(
            f"\nPage: {evidence['page_number']}"
        )

        print(
            f"Search topic: {evidence['query']}"
        )
        print(
            evidence["text"][:400]
        )

result=run_agent(
    project_id=3,
    query="How does the system perform resume screening?"
)

print("\n===============ANSWER===============\n")
print(result["answer"])