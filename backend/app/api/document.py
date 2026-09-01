from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.dependencies import get_db

from app.models.user import User
from app.models.project import Project
from app.models.document import Document

from app.services.document_service import process_document


router = APIRouter(
    prefix="/projects",
    tags=["Documents"],
)


# ============================================================
# UPLOAD DOCUMENT
# ============================================================

@router.post(
    "/{project_id}/documents",
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # ========================================================
    # CHECK PROJECT
    # ========================================================

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # ========================================================
    # VALIDATE FILE
    # ========================================================

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file selected",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported",
        )

    # ========================================================
    # SAVE FILE
    # ========================================================

    import os
    import uuid

    upload_directory = "uploads"

    os.makedirs(
        upload_directory,
        exist_ok=True,
    )

    stored_filename = (
        f"{uuid.uuid4()}.pdf"
    )

    file_path = os.path.join(
        upload_directory,
        stored_filename,
    )

    contents = await file.read()

    with open(
        file_path,
        "wb",
    ) as output_file:

        output_file.write(
            contents
        )

    # ========================================================
    # CREATE DOCUMENT
    # ========================================================

    document = Document(
        project_id=project_id,
        original_filename=file.filename,
        stored_filename=stored_filename,
        file_path=file_path,
        file_size=len(contents),
        content_type=file.content_type or "application/pdf",
        processing_status="UPLOADED",
    )

    db.add(document)
    db.commit()
    db.refresh(document)

    # ========================================================
    # PROCESS DOCUMENT
    # ========================================================

    try:

        process_document(
            document=document,
            db=db,
        )

    except Exception as error:

        print(
            "Document processing failed:",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Document uploaded but processing failed",
        )

    return {
        "id": document.id,
        "project_id": document.project_id,
        "original_filename": document.original_filename,
        "processing_status": document.processing_status,
        "message": "Document uploaded and processed successfully",
    }


# ============================================================
# GET PROJECT DOCUMENTS
# ============================================================

@router.get(
    "/{project_id}/documents",
)
def get_project_documents(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    documents = (
        db.query(Document)
        .filter(
            Document.project_id == project_id,
        )
        .order_by(
            Document.created_at.desc()
        )
        .all()
    )

    return documents