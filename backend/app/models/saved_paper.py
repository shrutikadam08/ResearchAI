from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    Integer,
    String,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


if TYPE_CHECKING:
    from app.models.user import User
    from app.models.project_paper import ProjectPaper


class SavedPaper(Base):

    __tablename__ = "saved_papers"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    openalex_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )

    title: Mapped[str] = mapped_column(
        String(1000),
        nullable=False
    )

    authors: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    abstract: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    year: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True
    )

    venue: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    citation_count: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    paper_url: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True
    )

    pdf_url: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True
    )

    is_open_access: Mapped[bool] = mapped_column(
        Boolean,
        default=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    # ==========================================================
    # USER
    # ==========================================================

    user: Mapped["User"] = relationship(
        "User",
        back_populates="saved_papers"
    )

    # ==========================================================
    # PROJECT RELATIONSHIP
    # ==========================================================

    project_papers: Mapped[list["ProjectPaper"]] = relationship(
        "ProjectPaper",
        back_populates="saved_paper",
        cascade="all, delete-orphan"
    )