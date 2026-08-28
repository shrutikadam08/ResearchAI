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
from app.models.project import Project
from app.models.saved_paper import SavedPaper
from app.models.project_paper import ProjectPaper

from app.schemas.project_paper import (
    ProjectPaperCreate,
    ProjectPaperResponse,
)

from app.schemas.saved_paper import (
    SavedPaperResponse,
)


router = APIRouter(
    prefix="/projects",
    tags=["Project Papers"],
)


# ============================================================
# ADD SAVED PAPER TO PROJECT
# ============================================================

@router.post(
    "/{project_id}/papers",
    response_model=ProjectPaperResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_paper_to_project(
    project_id: int,
    paper_data: ProjectPaperCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    print(
        "Adding paper to project:",
        project_id,
        "saved paper:",
        paper_data.saved_paper_id,
        "user:",
        current_user.id,
    )

    # ========================================================
    # FIND PROJECT BELONGING TO CURRENT USER
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
            detail=(
                f"Project {project_id} was not found "
                f"for the current user."
            ),
        )


    # ========================================================
    # FIND SAVED PAPER BELONGING TO CURRENT USER
    # ========================================================

    saved_paper = (
        db.query(SavedPaper)
        .filter(
            SavedPaper.id ==
                paper_data.saved_paper_id,

            SavedPaper.user_id ==
                current_user.id,
        )
        .first()
    )

    if not saved_paper:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Saved paper "
                f"{paper_data.saved_paper_id} "
                f"was not found for the current user."
            ),
        )


    # ========================================================
    # CHECK DUPLICATE
    # ========================================================

    existing = (
        db.query(ProjectPaper)
        .filter(
            ProjectPaper.project_id ==
                project_id,

            ProjectPaper.saved_paper_id ==
                paper_data.saved_paper_id,
        )
        .first()
    )

    if existing:

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Paper is already added "
                "to this project."
            ),
        )


    # ========================================================
    # CREATE RELATIONSHIP
    # ========================================================

    project_paper = ProjectPaper(
        project_id=project_id,
        saved_paper_id=
            paper_data.saved_paper_id,
    )


    db.add(
        project_paper
    )


    try:

        db.commit()

        db.refresh(
            project_paper
        )

    except Exception as error:

        db.rollback()

        print(
            "Project paper creation failed:",
            error
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Unable to add the paper "
                "to the project."
            ),
        )


    return project_paper


# ============================================================
# GET PAPERS IN PROJECT
# ============================================================

@router.get(
    "/{project_id}/papers",
    response_model=list[SavedPaperResponse],
)
def get_project_papers(
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
            detail=(
                f"Project {project_id} "
                "was not found for the current user."
            ),
        )


    papers = (
        db.query(SavedPaper)
        .join(
            ProjectPaper,
            ProjectPaper.saved_paper_id ==
                SavedPaper.id,
        )
        .filter(
            ProjectPaper.project_id ==
                project_id,

            SavedPaper.user_id ==
                current_user.id,
        )
        .order_by(
            SavedPaper.created_at.desc()
        )
        .all()
    )


    return papers


# ============================================================
# REMOVE PAPER FROM PROJECT
# ============================================================

@router.delete(
    "/{project_id}/papers/{saved_paper_id}",
)
def remove_paper_from_project(
    project_id: int,
    saved_paper_id: int,
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
            detail=(
                f"Project {project_id} "
                "was not found for the current user."
            ),
        )


    project_paper = (
        db.query(ProjectPaper)
        .join(
            SavedPaper,
            SavedPaper.id ==
                ProjectPaper.saved_paper_id,
        )
        .filter(
            ProjectPaper.project_id ==
                project_id,

            ProjectPaper.saved_paper_id ==
                saved_paper_id,

            SavedPaper.user_id ==
                current_user.id,
        )
        .first()
    )


    if not project_paper:

        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                f"Saved paper "
                f"{saved_paper_id} "
                "is not in this project."
            ),
        )


    db.delete(
        project_paper
    )

    db.commit()


    return {
        "message":
            "Paper removed from project."
    }