from collections import defaultdict

from app.services.vector_service import search_chunks
from app.database.session import SessionLocal

from app.models.user import User
from app.models.project import Project
from app.models.document import Document

def compare_papers(
        project_id:int,
        query:str,
        n_results:int=10
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

    grouped_documents=defaultdict(list)

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

            grouped_documents[document_id].append({
                "text":document,
                "page_number":int(
                    metadata["page_number"]
                )
            })

    finally:
        db.close()

    comparison_data=[]

    for document_id, evidence in grouped_documents.items():

        db=SessionLocal()

        try:
            paper=db.query(Document).filter(
                Document.id==document_id,
                Document.project_id==project_id
            ).first()

            if not paper:
                continue

            comparison_data.append({
                "document_id":document_id,
                "title":paper.title,
                "authors":paper.authors,
                "publication_year":paper.publication_year,
                "journal":paper.journal,
                "evidence":evidence
            })

        finally:
            db.close()

    return{
        "type":"comparison",
        "documents":comparison_data 
    }