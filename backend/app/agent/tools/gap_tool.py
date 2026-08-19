from collections import defaultdict

from app.services.vector_service import search_chunks

from app.database.session import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.document import Document

def find_research_gaps(
        project_id:int,
        n_results:int=10
):
    queries=[
        "limitations  of the research study",
        "future work and future research",
        "challenges limitations and drawbacks",
        "conclusion and possible improvements"
    ]

    grouped_evidence=defaultdict(list)

    for query in queries:
        results=search_chunks(
            project_id=project_id,
            query=query,
            n_results=n_results
        )

        documents=results.get(
            "documents",
            [[]]
        )[0]

        metadatas=results.get(
            "metadatas",
            [[]]
        )[0]

        for document, metadata in zip(
            documents,
            metadatas 
        ):
            document_id=int(
                metadata["document_id"]
            )

            grouped_evidence[document_id].append({
                "text":document,
                "page_number":int(
                    metadata["page_number"]
                ),
                "query":query
            })

    gap_data=[]

    db=SessionLocal()

    try:

        for document_id, evidence in(
            grouped_evidence.items()
        ):
            paper=db.query(Document).filter(
                Document.id==document_id,
                Document.project_id==project_id 
            ).first()

            if not paper:
                continue

            gap_data.append({
                "document_id":document_id,
                "title":paper.title,
                "authors":paper.authors,
                "publication_year":(
                    paper.publication_year
                ),
                "journal":paper.journal,
                "evidence":evidence 
            })

    finally:
        db.close()

    return {
        "type":"research_gap",
        "documents":gap_data 
    }
