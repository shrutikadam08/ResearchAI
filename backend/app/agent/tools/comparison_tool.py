from collections import defaultdict

from app.services.vector_service import (
    search_chunks,
    search_chunks_chroma_by_documents,
)

from app.database.session import SessionLocal

from app.models.document import Document


def compare_papers(
    project_id: int,
    query: str,
    paper_ids: list[int] | None = None,
    n_results: int = 10,
):
    """
    Retrieve evidence for comparing saved research papers.

    paper_ids are SavedPaper IDs.
    They are converted to Document IDs before querying Chroma.
    """

    comparison_queries = [
        "research objective aim purpose problem addressed",
        "methodology methods approach architecture framework model",
        "algorithms techniques implementation experimental setup",
        "dataset data source participants sample experimental data",
        "results findings performance evaluation experiments",
        "limitations weaknesses challenges drawbacks future work",
    ]

    grouped_documents = defaultdict(list)

    db = SessionLocal()

    try:

        # ========================================================
        # CONVERT SAVED PAPER IDs → DOCUMENT IDs
        # ========================================================

        saved_to_document = {}

        if paper_ids:

            selected_saved_ids = list(
                dict.fromkeys(
                    int(paper_id)
                    for paper_id in paper_ids
                )
            )

            documents = (
                db.query(Document)
                .filter(
                    Document.project_id == project_id,
                    Document.saved_paper_id.in_(
                        selected_saved_ids
                    ),
                    Document.processing_status == "PROCESSED",
                )
                .all()
            )

            saved_to_document = {
                int(document.saved_paper_id):
                    int(document.id)
                for document in documents
                if document.saved_paper_id is not None
            }

            print(
                "SavedPaper → Document mapping:",
                saved_to_document
            )

        # ========================================================
        # SELECTED SAVED PAPERS
        # ========================================================

        if paper_ids:

            for saved_paper_id in selected_saved_ids:

                document_id = saved_to_document.get(
                    saved_paper_id
                )

                if document_id is None:

                    print(
                        "No processed document found for "
                        "SavedPaper:",
                        saved_paper_id
                    )

                    continue

                print(
                    "Searching SavedPaper:",
                    saved_paper_id,
                    "→ Document:",
                    document_id
                )

                for comparison_query in comparison_queries:

                    results = search_chunks_chroma_by_documents(
                        project_id=project_id,
                        query=comparison_query,
                        document_ids=[document_id],
                        n_results_per_document=3,
                    )

                    raw_documents = results.get(
                        "documents",
                        [[]],
                    )

                    raw_metadatas = results.get(
                        "metadatas",
                        [[]],
                    )

                    documents_found = (
                        raw_documents[0]
                        if raw_documents
                        else []
                    )

                    metadatas = (
                        raw_metadatas[0]
                        if raw_metadatas
                        else []
                    )

                    for document_text, metadata in zip(
                        documents_found,
                        metadatas,
                    ):

                        if not metadata:
                            continue

                        retrieved_document_id = metadata.get(
                            "document_id"
                        )

                        page_number = metadata.get(
                            "page_number"
                        )

                        if (
                            retrieved_document_id is None
                            or page_number is None
                        ):
                            continue

                        retrieved_document_id = int(
                            retrieved_document_id
                        )

                        # Safety check
                        if retrieved_document_id != document_id:
                            continue

                        grouped_documents[
                            document_id
                        ].append(
                            {
                                "text": str(
                                    document_text
                                ),

                                "page_number": int(
                                    page_number
                                ),
                            }
                        )

        # ========================================================
        # NO SPECIFIC PAPERS
        # ========================================================

        else:

            results = search_chunks(
                project_id=project_id,
                query=query,
                n_results=n_results,
            )

            raw_documents = results.get(
                "documents",
                [[]],
            )

            raw_metadatas = results.get(
                "metadatas",
                [[]],
            )

            documents_found = (
                raw_documents[0]
                if raw_documents
                else []
            )

            metadatas = (
                raw_metadatas[0]
                if raw_metadatas
                else []
            )

            for document_text, metadata in zip(
                documents_found,
                metadatas,
            ):

                if not metadata:
                    continue

                document_id = metadata.get(
                    "document_id"
                )

                page_number = metadata.get(
                    "page_number"
                )

                if (
                    document_id is None
                    or page_number is None
                ):
                    continue

                grouped_documents[
                    int(document_id)
                ].append(
                    {
                        "text": str(
                            document_text
                        ),

                        "page_number": int(
                            page_number
                        ),
                    }
                )

        # ========================================================
        # REMOVE DUPLICATES
        # ========================================================

        for document_id in grouped_documents:

            unique_chunks = []
            seen = set()

            for item in grouped_documents[
                document_id
            ]:

                key = (
                    item["page_number"],
                    item["text"],
                )

                if key in seen:
                    continue

                seen.add(key)
                unique_chunks.append(item)

            grouped_documents[
                document_id
            ] = unique_chunks

        # ========================================================
        # BUILD COMPARISON DATA
        # ========================================================

        comparison_data = []

        if paper_ids:

            document_order = [
                saved_to_document.get(
                    int(saved_id)
                )
                for saved_id in selected_saved_ids
            ]

            document_order = [
                document_id
                for document_id in document_order
                if document_id is not None
            ]

        else:

            document_order = list(
                grouped_documents.keys()
            )

        for document_id in document_order:

            evidence = grouped_documents.get(
                document_id,
                []
            )

            if not evidence:
                continue

            paper = (
                db.query(Document)
                .filter(
                    Document.id == document_id,
                    Document.project_id == project_id,
                )
                .first()
            )

            if not paper:
                continue

            comparison_data.append(
                {
                    "document_id":
                        document_id,

                    "title":
                        paper.title
                        or paper.original_filename
                        or "Untitled Paper",

                    "authors":
                        paper.authors,

                    "publication_year":
                        paper.publication_year,

                    "journal":
                        paper.journal,

                    "evidence":
                        evidence,
                }
            )

    finally:

        db.close()

    print(
        "Final comparison documents:",
        len(comparison_data)
    )

    for item in comparison_data:

        print(
            " - Document:",
            item["document_id"],
            "| Title:",
            item["title"],
            "| Evidence:",
            len(item["evidence"])
        )

    return {
        "type": "comparison",

        "documents":
            comparison_data,
    }