def build_citations(sources: list[dict]):
    citations = []
    citation_map = {}

    for source in sources:

        key = (
            source["document_id"],
            source["page_number"]
        )

        # Avoid duplicate document + page citations
        if key in citation_map:
            continue

        citation_number = len(citations) + 1

        citation = {
            "id": citation_number,
            "document_id": source["document_id"],
            "page_number": source["page_number"],
            "title": source.get("title"),
            "authors": source.get("authors"),
            "publication_year": source.get(
                "publication_year"
            ),
            "journal": source.get("journal")
        }

        citations.append(citation)

        citation_map[key] = citation_number

    return citations


def format_citations(citations: list[dict]):
    if not citations:
        return ""

    lines = ["Sources:"]

    for citation in citations:

        title = citation.get("title")

        if title:
            source_name = title
        else:
            source_name = (
                f"Document {citation['document_id']}"
            )

        lines.append(
            f"[{citation['id']}] "
            f"{source_name} "
            f"-- Page {citation['page_number']}"
        )

    return "\n".join(lines)