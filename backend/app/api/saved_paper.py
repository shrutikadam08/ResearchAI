from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.dependencies import get_db

from app.models.user import User
from app.models.saved_paper import SavedPaper

from app.schemas.saved_paper import (
    SavedPaperCreate,
    SavedPaperResponse,
)


router = APIRouter(
    prefix="/saved-papers",
    tags=["Saved Papers"],
)


# ==========================================
# SAVE PAPER
# ==========================================

@router.post(
    "",
    response_model=SavedPaperResponse,
    status_code=status.HTTP_201_CREATED,
)
def save_paper(
    paper_data: SavedPaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    # Check whether this paper is already saved
    existing_paper = (
        db.query(SavedPaper)
        .filter(
            SavedPaper.user_id
            == current_user.id,

            SavedPaper.openalex_id
            == paper_data.openalex_id,
        )
        .first()
    )

    if existing_paper:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Paper is already saved.",
        )

    new_paper = SavedPaper(
        user_id=current_user.id,

        openalex_id=paper_data.openalex_id,

        title=paper_data.title,

        authors=paper_data.authors,

        abstract=paper_data.abstract,

        year=paper_data.year,

        venue=paper_data.venue,

        citation_count=(
            paper_data.citation_count
        ),

        paper_url=paper_data.paper_url,

        pdf_url=paper_data.pdf_url,

        is_open_access=(
            paper_data.is_open_access
        ),
    )

    db.add(new_paper)

    db.commit()

    db.refresh(new_paper)

    return new_paper


# ==========================================
# GET MY SAVED PAPERS
# ==========================================

@router.get(
    "",
    response_model=list[SavedPaperResponse],
)
def get_saved_papers(
    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    papers = (
        db.query(SavedPaper)
        .filter(
            SavedPaper.user_id
            == current_user.id
        )
        .order_by(
            SavedPaper.created_at.desc()
        )
        .all()
    )

    return papers


# ==========================================
# DELETE SAVED PAPER
# ==========================================

@router.delete(
    "/{paper_id}",
)
def delete_saved_paper(
    paper_id: int,

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    paper = (
        db.query(SavedPaper)
        .filter(
            SavedPaper.id == paper_id,

            SavedPaper.user_id
            == current_user.id,
        )
        .first()
    )

    if not paper:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Saved paper not found.",
        )

    db.delete(paper)

    db.commit()

    return {
        "message": "Paper removed from library."
    }