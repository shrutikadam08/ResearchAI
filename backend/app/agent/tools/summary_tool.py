from app.services.vector_service import search_chunks


def summarize_paper(
    project_id: int,
    query: str = "What is this research paper about?",
    n_results: int = 15
):

    summary_query = """
    paper topic purpose objective research problem
    main idea contribution approach methodology
    abstract introduction findings
    """

    results = search_chunks(
        project_id=project_id,
        query=summary_query,
        n_results=n_results
    )

    documents = results.get(
        "documents",
        [[]]
    )[0]

    metadatas = results.get(
        "metadatas",
        [[]]
    )[0]

    evidence = []

    for document, metadata in zip(
        documents,
        metadatas
    ):

        evidence.append({
            "text": document,
            "document_id": int(
                metadata["document_id"]
            ),
            "page_number": int(
                metadata["page_number"]
            )
        })

    return {
        "type": "summary",
        "evidence": evidence
    }