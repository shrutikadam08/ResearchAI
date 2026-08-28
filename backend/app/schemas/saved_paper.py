from datetime import datetime

from pydantic import BaseModel, Field


class SavedPaperCreate(BaseModel):
    openalex_id: str = Field(
        min_length=1,
        max_length=255
    )

    title: str = Field(
        min_length=1,
        max_length=1000
    )

    authors: str | None = None

    abstract: str | None = None

    year: int | None = None

    venue: str | None = None

    citation_count: int = 0

    paper_url: str | None = None

    pdf_url: str | None = None

    is_open_access: bool = False


class SavedPaperResponse(BaseModel):
    id: int

    openalex_id: str

    title: str

    authors: str | None

    abstract: str | None

    year: int | None

    venue: str | None

    citation_count: int

    paper_url: str | None

    pdf_url: str | None

    is_open_access: bool

    created_at: datetime

    model_config = {
        "from_attributes": True
    }