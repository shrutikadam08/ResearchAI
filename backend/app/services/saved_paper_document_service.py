import os
import uuid

import httpx

from sqlalchemy.orm import Session

from app.models.saved_paper import SavedPaper
from app.models.document import Document

from app.services.document_service import process_document


UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)


async def create_document_from_saved_paper(
    saved_paper: SavedPaper,
    project_id: int,
    db: Session,
):
    """
    Download the saved paper PDF, create a Document,
    and process it into Chroma.
    """

    if not saved_paper.pdf_url:

        raise ValueError(
            "This saved paper does not have "
            "an accessible PDF."
        )


    # --------------------------------------------------------
    # Download PDF
    # --------------------------------------------------------

    try:

        async with httpx.AsyncClient(
            timeout=60.0,
            follow_redirects=True,
        ) as client:

            response = await client.get(
                saved_paper.pdf_url,
                headers={
                    "User-Agent":
                        "ResearchAI/1.0 "
                        "(academic research project)"
                },
            )

    except httpx.RequestError as error:

        raise RuntimeError(
            f"Could not download paper PDF: {error}"
        )


    if response.status_code != 200:

        raise RuntimeError(
            "Could not download paper PDF. "
            f"HTTP status: {response.status_code}"
        )


    content_type = (
        response.headers
        .get("content-type", "")
        .lower()
    )


    pdf_content = response.content


    # --------------------------------------------------------
    # Basic PDF validation
    # --------------------------------------------------------

    if not pdf_content:

        raise ValueError(
            "Downloaded PDF is empty."
        )


    if not (
        pdf_content.startswith(b"%PDF")
        or "pdf" in content_type
    ):

        raise ValueError(
            "The provided URL did not return a valid PDF."
        )


    # --------------------------------------------------------
    # Create local filename
    # --------------------------------------------------------

    stored_filename = (
        f"{uuid.uuid4()}.pdf"
    )


    file_path = os.path.join(
        UPLOAD_DIR,
        stored_filename
    )


    with open(
        file_path,
        "wb"
    ) as file:

        file.write(
            pdf_content
        )


    # --------------------------------------------------------
    # Check whether this saved paper is already indexed
    # --------------------------------------------------------

    existing_document = (
        db.query(Document)
        .filter(
            Document.project_id == project_id,
            Document.file_path == file_path,
        )
        .first()
    )


    if existing_document:

        return existing_document


    # --------------------------------------------------------
    # Create Document
    # --------------------------------------------------------

    document = Document(

        project_id=project_id,

        original_filename=(
            f"{saved_paper.title[:200]}.pdf"
        ),

        stored_filename=stored_filename,

        file_path=file_path,

        file_size=len(pdf_content),

        content_type="application/pdf",

        processing_status="UPLOADED",

        title=saved_paper.title,

        authors=saved_paper.authors,

        publication_year=saved_paper.year,

        journal=saved_paper.venue,
    )


    db.add(
        document
    )

    db.commit()

    db.refresh(
        document
    )


    # --------------------------------------------------------
    # Process PDF
    # --------------------------------------------------------

    process_document(
        document,
        db
    )


    return document