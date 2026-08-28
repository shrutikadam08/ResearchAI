from datetime import datetime

from pydantic import BaseModel


# ============================================================
# ADD PAPER TO PROJECT
# ============================================================

class ProjectPaperCreate(BaseModel):

    saved_paper_id: int


# ============================================================
# PROJECT PAPER RESPONSE
# ============================================================

class ProjectPaperResponse(BaseModel):

    id: int

    project_id: int

    saved_paper_id: int

    created_at: datetime

    model_config = {
        "from_attributes": True
    }