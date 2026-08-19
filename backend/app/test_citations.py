from app.services.citation_service import(
    build_citations,
    format_citations
)

sources=[
    {
        "document_id":1,
        "page_number":5,
        "title":"AI Powered Recruitment System",
        "authors":(
            "Dr. Ankita Karale, Shruti Jagzap, "
            "Shruti Kadam"
        ),
        "publication_year":2026,
        "journal":(
            "International Journal on Advanced "
            "Computer Engineering and Communication Technology"
        )
    },
    {
        "document_id":1,
        "page_number":5,
        "title":"AI Powered Recruitment System",
        "authors":(
            "Dr. Ankita Karale, Shruti Jagzap,"
            "Shruti Kadam"
        ),
        "publication_year":2026,
        "journal":(
            "International Journal on Advanced"
            "Computer Engineering and Communication Technology"
        )
    },
    {
        "document_id":2,
        "page_number":7,
        "title":"Application of LLM Agents in Recruitment",
        "authors":"Chengguang Gan et al.",
        "publication_year":2024,
        "journal":"arXiv"
    }
]

citations=build_citations(sources)

print("\n===============CITATIONS================\n")

print(citations)

print("\n====================FORMATTED CITATIONS=================\n")

print(
    format_citations(citations )
)