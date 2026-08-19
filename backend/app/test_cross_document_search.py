from app.agent.tools.search_tool import search_papers

results=search_papers(
    project_id=3,
    query="How does the system perform resume screening?",
    n_results=5
)

print("\n==========CROSS DOCUMENT SEARCH==========")

for result in results:
    print("\n------------------------------------")

    print("Document ID:")
    print(result["document_id"])

    print("Title:")
    print(result["title"])

    print("Authors:")
    print(result["authors"])

    print("Publication Year:")
    print(result["publication_year"])

    print("Journal:")
    print(result["journal"])

    print("Page:")
    print(result["page_number"])

    print("Text:")
    print(result["text"][:300])