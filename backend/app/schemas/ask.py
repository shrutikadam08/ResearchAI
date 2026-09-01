from pydantic import BaseModel, Field


class AskRequest(BaseModel):

    question: str = Field(
        min_length=2,
        max_length=2000
    )

    # Optional selected papers for comparison
    paper_ids: list[int] = Field(
        default_factory=list
    )


class AskSource(BaseModel):

    id: int

    document_id: int

    page_number: int


class AskEvidence(BaseModel):

    document_id: int

    page_number: int

    text: str


class AskResponse(BaseModel):

    question: str

    answer: str

    sources: list[AskSource] = []

    evidence: list[AskEvidence] = []