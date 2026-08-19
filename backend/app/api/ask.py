from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.dependencies import get_db
from app.models.project import Project
from app.models.user import User
from app.schemas.ask import AskRequest, AskResponse
from app.agent.graph import research_agent

router=APIRouter(
    prefix="/projects",
    tags=["Research Agent"]
)

@router.post(
    "/{project_id}/ask",
    response_model=AskResponse
)
def ask_research_agent(
    project_id:int,
    request:AskRequest,
    current_user:User=Depends(get_current_user),
    db:Session=Depends(get_db)
):
    project=db.query(Project).filter(
        Project.id==project_id,
        Project.user_id==current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )

    result=research_agent.invoke({
        "project_id":project_id,
        "question":request.question 
    })

    tool_result=result.get(
        "tool_result",
        {}
    )

    sources=tool_result.get(
        "sources",
        []
    )

    return {
        "question": request.question,
        "answer": result.get(
            "answer",
            "No answer generated."
        ),
        "sources":sources
        
    }