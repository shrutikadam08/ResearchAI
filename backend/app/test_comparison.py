from app.agent.tools.comparison_tool import compare_papers

result=compare_papers(
    project_id=3,
    query="methodology and approach used in the research",
    n_results=10
)

print("\n=================PAPER COMPARISON DATA================")

print(
    "Papers found:",
    len(result["documents"])
)

for paper in result["documents"]:

    print("\n======================================")

    print("Document ID:")
    print(paper["document_id"])

    print("Title:")
    print(paper["title"])

    print("Authors:")
    print(paper["authors"])

    print("Publication Year:")
    print(paper["publication_year"])

    print("Journal:")
    print(paper["journal"])

    print("\nEvidence:")

    for item in paper["evidence"]:
        print(
            f"\nPage {item['page_number']}:"
        )

        print(
            item["text"][:300]
        )