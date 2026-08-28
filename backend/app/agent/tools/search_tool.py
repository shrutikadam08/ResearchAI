from app.services.vector_service import search_chunks
from app.models.document import Document
from app.database.session import SessionLocal


def _paper_evidence_from_results(project_id: int, results):
    documents = results.get("documents", [[]])[0] or []
    metadatas = results.get("metadatas", [[]])[0] or []

    evidence = []
    db = SessionLocal()

    try:
        for document_text, metadata in zip(documents, metadatas):
            if not metadata:
                continue

            try:
                document_id = int(metadata["document_id"])
                page_number = int(metadata["page_number"])
            except (KeyError, TypeError, ValueError):
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

            evidence.append(
                {
                    "text": document_text,
                    "document_id": document_id,
                    "page_number": page_number,
                    "title": paper.title,
                    "authors": paper.authors,
                    "publication_year": paper.publication_year,
                    "journal": paper.journal,
                    "original_filename": paper.original_filename,
                }
            )
    finally:
        db.close()

    return evidence


def search_papers(project_id: int, query: str, n_results: int = 5):
    """Semantic search used by normal ResearchAI questions."""
    results = search_chunks(
        project_id=project_id,
        query=query,
        n_results=n_results,
    )
    return _paper_evidence_from_results(project_id, results)


def search_papers_for_literature_review(
    project_id: int,
    n_results_per_paper: int = 4,
    max_total: int = 12,
):
    """
    Retrieve evidence for a literature review with paper coverage as the
    primary goal. Normal semantic search can repeatedly return the same
    document, so this function explicitly searches around every paper in
    the project and then fills remaining slots with broad research queries.
    """

    db = SessionLocal()

    try:
        papers = (
            db.query(Document)
            .filter(Document.project_id == project_id)
            .order_by(Document.id.asc())
            .all()
        )
    finally:
        db.close()

    all_evidence = []
    seen = set()

    # ------------------------------------------------------------
    # 1. Give every paper a chance to contribute evidence.
    # ------------------------------------------------------------
    for paper in papers:
        paper_name = (
            (paper.title or "").strip()
            or (paper.original_filename or "").strip()
        )

        if not paper_name:
            continue

        query = (
            f'"{paper_name}" methodology findings results '
            f'limitations contributions research'
        )

        try:
            results = search_chunks(
                project_id=project_id,
                query=query,
                n_results=n_results_per_paper,
            )
        except Exception as error:
            print(
                "Literature review paper search failed:",
                paper.id,
                error,
            )
            continue

        paper_evidence = _paper_evidence_from_results(
            project_id,
            results,
        )

        # Prefer evidence that actually belongs to this paper.
        matching = [
            item
            for item in paper_evidence
            if item["document_id"] == paper.id
        ]

        for item in matching:
            key = (
                item["document_id"],
                item["page_number"],
            )

            if key in seen:
                continue

            seen.add(key)
            all_evidence.append(item)

            if len(all_evidence) >= max_total:
                break

        if len(all_evidence) >= max_total:
            break

    # ------------------------------------------------------------
    # 2. Fill missing coverage with broad literature queries.
    # ------------------------------------------------------------
    if len(all_evidence) < max_total:
        broad_queries = [
            "research methodology methods approach dataset experiments",
            "research findings results contributions key outcomes",
            "research limitations challenges gaps future work",
        ]

        for query in broad_queries:
            try:
                results = search_chunks(
                    project_id=project_id,
                    query=query,
                    n_results=5,
                )
            except Exception as error:
                print(
                    "Literature review broad search failed:",
                    error,
                )
                continue

            for item in _paper_evidence_from_results(
                project_id,
                results,
            ):
                key = (
                    item["document_id"],
                    item["page_number"],
                )

                if key in seen:
                    continue

                seen.add(key)
                all_evidence.append(item)

                if len(all_evidence) >= max_total:
                    break

            if len(all_evidence) >= max_total:
                break

    return all_evidence