from pydantic import BaseModel, Field

class SearchRequest(BaseModel):
    query: str=Field(
        min_length=2,
        max_length=1000
    )

    n_results:int=Field(
        default=5,
        ge=1,
        le=20
    )

class SearchResult(BaseModel):
    text:str
    document_id:int
    page_number:int

class SearchResponse(BaseModel):
    query:str
    results:list[SearchResult]