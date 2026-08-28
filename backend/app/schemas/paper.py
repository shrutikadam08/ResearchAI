from pydantic import BaseModel
from typing import Optional


class PaperAuthor(BaseModel):
    author_id: Optional[str] = None
    name: str


class PaperSearchResult(BaseModel):
    paper_id: str
    title: str

    authors: list[PaperAuthor] = []

    abstract: Optional[str] = None

    year: Optional[int] = None

    venue: Optional[str] = None

    citation_count: int = 0

    url: Optional[str] = None

    pdf_url: Optional[str] = None

    is_open_access: bool = False


class PaperSearchResponse(BaseModel):
    query: str

    total: Optional[int] = None

    offset: int

    limit: int

    results: list[PaperSearchResult]