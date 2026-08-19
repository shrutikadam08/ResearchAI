from app.agent.tools.comparison_tool import compare_papers
from app.services.comparison_service import(
    compare_research_papers
)

question=(
    "Compare the methodologies and approaches"
    "used in these research papers."
)

print("Retrieving research evidence...")

result=compare_papers(
    project_id=3,
    query=question,
    n_results=10
)

papers=result["documents"]

print(
    f"Retrieved {len(papers)} paper(s)."
)

print("\nGenerating comparison...")

comparison=compare_research_papers(
    question=question,
    papers=papers 
)

print("\n=============COMPARISON===============")

print(
    comparison["comparison"]
)