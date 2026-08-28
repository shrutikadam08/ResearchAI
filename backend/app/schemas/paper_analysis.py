from pydantic import BaseModel

class PaperAnalysisRequest(BaseModel):

    paper_id:str | None=None 
    title:str
    abstract:str|None=None
    authors:str|None=None
    year:int|None=None
    venue:str|None=None
    pdf_url:str|None=None

class PaperAnalysisResponse(BaseModel):
    summary:str
    key_contributions:list[str]
    methodology:str
    limitations:list[str]
    research_gaps:list[str]
    future_directions:list[str]