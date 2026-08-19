from app.agent.tools.search_tool import search_papers
from app.services.literature_review_service import(
    generate_literature_review
)

query="""
research methodology, approaches, findings,
limitations and existing work
"""

print("Retrieving research evidence...")

evidence=search_papers(
    project_id=3,
    query=query,
    n_results=10
)

print(
    f"Retrieved {len(evidence)} evidence chunks."
)

papers={}

for item in evidence:
    document_id=item["document_id"]

    if document_id not in papers:
        papers[document_id]={
            "document_id":document_id,
            "title":item.get("title"),
            "authors":item.get("authors"),
            "publication_year":item.get(
                "publication_year"
            ),
            "journal":item.get("journal"),
            "evidence":[]
        }

    papers[document_id]["evidence"].append({
        "text":item["text"],
        "page_number":item["page_number"]
    })

papers=list(papers.values())

print(
    f"found {len(papers)} paper(s)."
)

print("\nGenerating literature review...")

result=generate_literature_review(
    papers=papers 
)

print(
    "\n==========LITERATURE REVIEW=================\n"
)

print(
    result["literature_review"]
)