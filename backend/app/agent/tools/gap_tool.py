import time
from collections import defaultdict

from app.services.vector_service import search_chunks

from app.database.session import SessionLocal
from app.models.document import Document


# ============================================================
# RESEARCH GAP SEARCH SETTINGS
# ============================================================

GAP_QUERIES = [
    "research limitations future work",
    "challenges drawbacks improvements research gaps",
]

RESULTS_PER_QUERY = 4

MAX_EVIDENCE_PER_DOCUMENT = 3

MAX_TOTAL_EVIDENCE = 12


# ============================================================
# FIND RESEARCH GAPS
# ============================================================

def find_research_gaps(
    project_id: int,
    n_results: int = RESULTS_PER_QUERY,
):

    total_start = time.perf_counter()

    print("\n========== RESEARCH GAP TIMING ==========")

    grouped_evidence = defaultdict(list)

    # --------------------------------------------------------
    # VECTOR SEARCH
    # --------------------------------------------------------

    search_start = time.perf_counter()

    for query in GAP_QUERIES:

        query_start = time.perf_counter()

        results = search_chunks(
            project_id=project_id,
            query=query,
            n_results=n_results,
        )

        query_time = (
            time.perf_counter()
            - query_start
        )

        print(
            f"Vector search "
            f"'{query}' : "
            f"{query_time:.2f}s"
        )

        documents = (
            results.get(
                "documents",
                [[]]
            )[0]
        )

        metadatas = (
            results.get(
                "metadatas",
                [[]]
            )[0]
        )

        for document, metadata in zip(
            documents,
            metadatas,
        ):

            if not metadata:
                continue

            document_id_raw = metadata.get(
                "document_id"
            )

            page_number_raw = metadata.get(
                "page_number"
            )

            if (
                document_id_raw is None
                or page_number_raw is None
            ):
                continue

            try:

                document_id = int(
                    document_id_raw
                )

                page_number = int(
                    page_number_raw
                )

            except (
                TypeError,
                ValueError,
            ):

                continue

            text = str(
                document
            ).strip()

            if not text:
                continue

            duplicate = any(
                item["page_number"] == page_number
                and item["text"] == text
                for item in grouped_evidence[
                    document_id
                ]
            )

            if duplicate:
                continue

            if (
                len(
                    grouped_evidence[
                        document_id
                    ]
                )
                >= MAX_EVIDENCE_PER_DOCUMENT
            ):
                continue

            grouped_evidence[
                document_id
            ].append(
                {
                    "text":
                        text,

                    "page_number":
                        page_number,

                    "query":
                        query,
                }
            )

    search_time = (
        time.perf_counter()
        - search_start
    )

    print(
        f"Total vector search time: "
        f"{search_time:.2f}s"
    )

    # --------------------------------------------------------
    # DATABASE
    # --------------------------------------------------------

    db_start = time.perf_counter()

    gap_data = []

    db = SessionLocal()

    try:

        total_evidence = 0

        for (
            document_id,
            evidence,
        ) in grouped_evidence.items():

            if (
                total_evidence
                >= MAX_TOTAL_EVIDENCE
            ):
                break

            paper = (
                db.query(Document)
                .filter(
                    Document.id == document_id,
                    Document.project_id ==
                    project_id,
                )
                .first()
            )

            if not paper:
                continue

            remaining = (
                MAX_TOTAL_EVIDENCE
                - total_evidence
            )

            selected_evidence = (
                evidence[:remaining]
            )

            if not selected_evidence:
                continue

            gap_data.append(
                {
                    "document_id":
                        document_id,

                    "title":
                        paper.title,

                    "authors":
                        paper.authors,

                    "publication_year":
                        paper.publication_year,

                    "journal":
                        paper.journal,

                    "evidence":
                        selected_evidence,
                }
            )

            total_evidence += len(
                selected_evidence
            )

    finally:

        db.close()

    db_time = (
        time.perf_counter()
        - db_start
    )

    print(
        f"Database time: "
        f"{db_time:.2f}s"
    )

    # --------------------------------------------------------
    # TOTAL
    # --------------------------------------------------------

    total_time = (
        time.perf_counter()
        - total_start
    )

    print(
        f"Total gap tool time: "
        f"{total_time:.2f}s"
    )

    print(
        "=========================================\n"
    )

    return {
        "type":
            "research_gap",

        "documents":
            gap_data,
    }