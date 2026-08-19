from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.models.project import Project

class Document(Base):
    __tablename__="documents"

    id: Mapped[int]=mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    project_id: Mapped[int]=mapped_column(
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    original_filename:Mapped[str]=mapped_column(
        String(255),
        nullable=False
    )

    stored_filename: Mapped[str]=mapped_column(
        String(255),
        nullable=False,
        unique=True
    )

    file_path: Mapped[str]=mapped_column(
        Text,
        nullable=False
    )

    file_size: Mapped[int]=mapped_column(
        Integer,
        nullable=False
    )

    content_type: Mapped[str]=mapped_column(
        String(100),
        nullable=False
    )

    processing_status: Mapped[str]=mapped_column(
        String(50),
        nullable=False,
        default="UPLOADED"
    )

    title:Mapped[str | None]=mapped_column(
        Text,
        nullable=True
    )

    publication_year:Mapped[int | None]=mapped_column(
        Integer,
        nullable=True
    )

    journal:Mapped[str|None]=mapped_column(
        String(500),
        nullable=True
    )

    authors:Mapped[str | None]=mapped_column(
        Text,
        nullable=True
    )

    created_at:Mapped[datetime]=mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at:Mapped[datetime]=mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    project:Mapped["Project"]=relationship(
        "Project",
        back_populates="documents"
    )