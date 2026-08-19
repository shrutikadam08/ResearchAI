from app.services.vector_service import search_chunks
from app.models.document import Document
from app.database.session import SessionLocal
from app.models.user import User
from app.models.project import Project


def search_papers(
        project_id: int,
        query:str,
        n_results:int=5
):
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

    evidence=[]

    db=SessionLocal()

    try:
        for document, metadata in zip(
            documents,
            metadatas 
        ):
            document_id=int(
                metadata["document_id"]
            )

            paper=db.query(Document).filter(
                Document.id==document_id,
                Document.project_id==project_id
            ).first()

            if not paper:
                continue

            evidence.append({
                "text":document,
                "document_id":document_id,
                "page_number":int(
                    metadata["page_number"]
                ),
                "title":paper.title,
                "authors":paper.authors,
                "publication_year":paper.publication_year,
                "journal":paper.journal
            })

    finally:
        db.close()

    return evidence