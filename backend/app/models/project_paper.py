from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class ProjectPaper(Base):
    __tablename__ = "project_papers"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    project_id: Mapped[int] = mapped_column(
        ForeignKey(
            "projects.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    saved_paper_id: Mapped[int] = mapped_column(
        ForeignKey(
            "saved_papers.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    project = relationship(
        "Project",
        back_populates="project_papers"
    )

    saved_paper = relationship(
        "SavedPaper",
        back_populates="project_papers"
    )

    __table_args__ = (
        UniqueConstraint(
            "project_id",
            "saved_paper_id",
            name="uq_project_saved_paper"
        ),
    )