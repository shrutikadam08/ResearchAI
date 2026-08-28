from collections import OrderedDict

from app.database.session import SessionLocal
from app.models.document import Document


def _clean(value):
    if value is None:
        return None

    if isinstance(value, str):
        value = value.strip()
        return value or None

    return value


def build_citations(sources):
    """
    Build stable citation records from research evidence.

    Each citation contains:
      - id
      - document_id
      - title
      - authors
      - publication_year
      - journal
      - page_number

    Metadata already present in the evidence is preserved.
    Missing paper metadata is loaded from the Document table so
    the UI can identify the actual paper instead of showing only
    an internal document number.
    """

    if not sources:
        return []

    # ------------------------------------------------------------
    # Normalize and deduplicate by document + page
    # ------------------------------------------------------------

    unique = OrderedDict()

    for source in sources:
        if not isinstance(source, dict):
            continue

        document_id = source.get("document_id")
        page_number = source.get("page_number")

        if document_id is None:
            continue

        key = (
            int(document_id),
            int(page_number) if page_number is not None else None,
        )

        if key not in unique:
            unique[key] = {
                "document_id": int(document_id),
                "page_number": (
                    int(page_number)
                    if page_number is not None
                    else None
                ),
                "title": _clean(source.get("title")),
                "authors": _clean(source.get("authors")),
                "publication_year": source.get(
                    "publication_year"
                ),
                "journal": _clean(source.get("journal")),
            }

    citations = list(unique.values())

    if not citations:
        return []

    # ------------------------------------------------------------
    # Fill missing metadata from database
    # ------------------------------------------------------------

    missing_document_ids = {
        item["document_id"]
        for item in citations
        if not item.get("title")
        or not item.get("authors")
        or item.get("publication_year") is None
        or not item.get("journal")
    }

    if missing_document_ids:
        db = SessionLocal()

        try:
            documents = (
                db.query(Document)
                .filter(
                    Document.id.in_(
                        list(missing_document_ids)
                    )
                )
                .all()
            )

            document_map = {
                document.id: document
                for document in documents
            }

            for citation in citations:
                document = document_map.get(
                    citation["document_id"]
                )

                if not document:
                    continue

                if not citation.get("title"):
                    citation["title"] = _clean(
                        document.title
                    )

                if not citation.get("authors"):
                    citation["authors"] = _clean(
                        document.authors
                    )

                if (
                    citation.get(
                        "publication_year"
                    )
                    is None
                ):
                    citation["publication_year"] = (
                        document.publication_year
                    )

                if not citation.get("journal"):
                    citation["journal"] = _clean(
                        document.journal
                    )

        finally:
            db.close()

    # ------------------------------------------------------------
    # Assign citation numbers
    # ------------------------------------------------------------

    for index, citation in enumerate(
        citations,
        start=1,
    ):
        citation["id"] = index

        # UI-friendly fallback only when a title genuinely
        # cannot be found.
        if not citation.get("title"):
            citation["title"] = (
                f"Document {citation['document_id']}"
            )

    return citations


def format_citations(citations):
    """
    Format citations for inclusion beneath AI answers.

    Example:

    [1] Intelligent Resume Screening Using NLP — Page 2
    [2] AI-Based Recruitment Systems — Page 12
    """

    if not citations:
        return ""

    lines = []

    for citation in citations:
        citation_id = citation.get("id")
        title = (
            citation.get("title")
            or f"Document {citation.get('document_id', 'Unknown')}"
        )
        page_number = citation.get("page_number")

        authors = _clean(
            citation.get("authors")
        )
        year = citation.get(
            "publication_year"
        )

        metadata = []

        if authors:
            metadata.append(authors)

        if year:
            metadata.append(str(year))

        metadata_text = ""

        if metadata:
            metadata_text = (
                f" — {' • '.join(metadata)}"
            )

        page_text = ""

        if page_number is not None:
            page_text = f" — Page {page_number}"

        lines.append(
            f"[{citation_id}] {title}"
            f"{metadata_text}"
            f"{page_text}"
        )

    return "Sources:\n" + "\n".join(lines)
