from sqlalchemy.orm import Session

from app.models.document import Document
from app.services.pdf_service import extract_text_from_pdf
from app.services.chunking_service import chunk_pages
from app.services.embedding_service import generate_embeddings
from app.services.vector_service import add_chunks

def process_document(
        document: Document,
        db:Session
):
    try:
        document.processing_status="PROCESSING"
        db.commit()

        pages=extract_text_from_pdf(
            document.file_path
        )

        chunks=chunk_pages(pages)

        if not chunks:
            raise ValueError(
                "No text could be extracted from the PDF"
            )

        texts=[
            chunk["text"]
            for chunk in chunks
        ]

        embeddings=generate_embeddings(texts)

        add_chunks(
            project_id=document.project_id,
            document_id=document.id,
            chunks=chunks,
            embeddings=embeddings 
        )



        document.processing_status="PROCESSED"
        db.commit()
        db.refresh(document)

        return {
            "pages": pages,
            "chunks": chunks 
        }

    except Exception as error:
        document.processing_status = "FAILED"
        db.commit()
        print("DOCUMENT PROCESSING ERROR:", repr(error))

        raise