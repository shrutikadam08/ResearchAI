from datetime import datetime
from pydantic import BaseModel, Field

class ProjectCreate(BaseModel):
    title: str=Field(
        min_length=2,
        max_length=200
    )

    description: str | None= Field(
        default=None,
        max_length=2000
    )

class ProjectUpdate(BaseModel):
    title: str | None=Field(
        default=None,
        min_length=2,
        max_length=200
    )

    description: str | None=Field(
        default=None,
        max_length=2000
    )

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: str | None
    created_at: datetime
    updated_at: datetime

    model_config={
        "from_attributes": True
    } 