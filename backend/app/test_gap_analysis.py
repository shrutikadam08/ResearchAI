from app.agent.tools.gap_tool import find_research_gaps
from app.services.gap_service import analyze_research_gaps


print("Searching for research-gap evidence...")

result = find_research_gaps(
    project_id=3,
    n_results=5
)


papers = result["documents"]

print(
    f"Found evidence from {len(papers)} paper(s)."
)


print("\nAnalyzing research gaps...")

gap_result = analyze_research_gaps(
    papers=papers
)


print(
    "\n========== RESEARCH GAPS ==========\n"
)

print(
    gap_result["research_gaps"]
)