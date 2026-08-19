from app.agent.tools.search_tool import search_papers
from app.services.answer_service import generate_research_answer

question="How does the system perform resume screening?"

print("Searching research papers...")

evidence=search_papers(
    project_id=3,
    query=question,
    n_results=5
)

print("Evidence found:", len(evidence))

result=generate_research_answer(
    question=question,
    evidence=evidence
)

print("\n=============ANSWER==========")

print(result["answer"])

print("\n============SOURCES===========")

for source in result["sources"]:
    print(
        f"Document {source['document_id']}"
        f" - Page {source['page_number']}"
    )