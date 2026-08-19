from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.dependencies import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.search import SearchRequest, SearchResponse
from app.services.vector_service import search_chunks

router=APIRouter(
    prefix="/projects",
    tags=["Search"]
)

@router.post(
    "/{project_id}/search",
    response_model=SearchResponse
)
def search_project(
    project_id:int,
    search_data:SearchRequest,
    current_user:User=Depends(get_current_user),
    db:Session=Depends(get_db)
):
    project=db.query(Project).filter(
        Project.id==project_id,
        Project.user_id==current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_Code=404,
            detail="Project not found"
        )

    results=search_chunks(
        project_id=project_id,
        query=search_data.query,
        n_results=search_data.n_results
    )

    search_results=[]

    documents=results.get("documents",[[]])[0]
    metadatas=results.get("metadatas",[[]])[0]

    for document, metadata in zip(
        documents,
        metadatas 
    ):

        search_results.append({
            "text":document,
            "document_id":int(metadata["document_id"]),
            "page_number":int(metadata["page_number"])
        })


    return {
        "query":search_data.query,
        "results":search_results
    }