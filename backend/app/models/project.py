from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import (
    Mapped,
    mapped_column,
    relationship,
)

from app.database.base import Base


if TYPE_CHECKING:
    from app.models.user import User
    from app.models.document import Document
    from app.models.conversation import Conversation
    from app.models.project_paper import ProjectPaper


class Project(Base):

    __tablename__ = "projects"

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

    title: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # ==========================================================
    # USER
    # ==========================================================

    user: Mapped["User"] = relationship(
        "User",
        back_populates="projects"
    )

    # ==========================================================
    # DOCUMENTS
    # ==========================================================

    documents: Mapped[list["Document"]] = relationship(
        "Document",
        back_populates="project",
        cascade="all, delete-orphan"
    )

    # ==========================================================
    # CONVERSATIONS
    # ==========================================================

    conversations: Mapped[list["Conversation"]] = relationship(
        "Conversation",
        back_populates="project",
        cascade="all, delete-orphan"
    )

    # ==========================================================
    # SAVED PAPERS
    # ==========================================================

    project_papers: Mapped[list["ProjectPaper"]] = relationship(
        "ProjectPaper",
        back_populates="project",
        cascade="all, delete-orphan"
    )