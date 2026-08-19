import os
import uuid
import pymupdf

from fastapi import(
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status
)
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.dependencies import get_db
from app.models.document import Document
from app.models.project import Project
from app.models.user import User
from app.services.document_service import process_document
from app.services.metadata_service import extract_metadata

router=APIRouter(
    prefix="/projects",
    tags=["Documents"]
)

UPLOAD_DIR="uploads"

os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post(
    "/{project_id}/documents",
    status_code=status.HTTP_201_CREATED
)
async def upload_document(
    project_id: int,
    file: UploadFile=File(...),
    current_user: User=Depends(get_current_user),
    db:Session=Depends(get_db)
):
    #Check project ownership
    project=db.query(Project).filter(
        Project.id==project_id,
        Project.user_id==current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    if file.content_type !="application/pdf":
        raise HTTPException(
            status_code=status.HTTP_404_BAD_REQUEST,
            detail="Only PDF files are allowed"
        )

    file_extension=os.path.splitext(
        file.filename or ""
    )[1]

    stored_filename=(
        f"{uuid.uuid4()}{file_extension}"
    )

    file_path=os.path.join(
        UPLOAD_DIR,
        stored_filename
    )

    file_content=await file.read()

    with open(file_path, "wb") as buffer:
        buffer.write(file_content)

        metadata={
            "title":None,
            "authors":None,
            "publication_year":None,
            "journal":None 
        }

        try:
            pdf_document=pymupdf.open(file_path)

            if len(pdf_document)>0:
                first_page_text=pdf_document[0].get_text()

                metadata=extract_metadata(
                    first_page_text
                )

            pdf_document.close()

        except Exception:
            metadata={
                "title":None,
                "authors":None,
                "publication_year":None,
                "journal":None
            }

    document=Document(
        project_id=project_id,
        original_filename=file.filename or "unknown.pdf",
        stored_filename=stored_filename,
        file_path=file_path,
        file_size=len(file_content),
        content_type=file.content_type,
        processing_status="UPLOADED",

        title=metadata["title"],
        authors=metadata["authors"],
        publication_year=metadata["publication_year"],
        journal=metadata["journal"]
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    return {
        "message": "Document uploaded successfully",
        "document_id":document.id,
        "project_id":document.project_id,
        "filename":document.original_filename,
        "status":document.processing_status,
        "metadata":{
            "title":document.title,
            "authors":document.authors,
            "publication_year":document.publication_year,
            "journal":document.journal
        }
    }

@router.post(
    "/{project_id}/document/{document_id}/process"
)
def process_uploaded_document(
    project_id:int,
    document_id:int,
    current_user:User=Depends(get_current_user),
    db:Session=Depends(get_db)
):

    document=db.query(Document).join(
        Project,
        Document.project_id==Project.id
    ).filter(
        Document.id==document_id,
        Document.project_id==project_id,
        Project.user_id==current_user.id
    ).first()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="document not found"
        )

    pages=process_document(
        document,
        db 
    )

    return{
        "message":"Document processed successfully",
        "document_id":document.id,
        "status":document.processing_status,
        "pages":len(pages)
    }