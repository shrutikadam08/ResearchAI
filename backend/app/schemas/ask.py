from  pydantic import BaseModel, Field

class AskRequest(BaseModel):
    question:str=Field(
        min_length=2,
        max_length=2000
    )

class AskSource(BaseModel):
    id:int
    document_id:int
    page_number:int 

class AskResponse(BaseModel):
    question:str
    answer:str
    sources:list[AskSource]
    