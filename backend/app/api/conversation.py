from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session
from app.auth.dependencies import get_current_user
from app.database.dependencies import get_db

from app.models.project import Project
from app.models.conversation import Conversation
from app.models.user import User

from app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse
)

router=APIRouter(
    prefix="/projects",
    tags=["Conversations"]
)

@router.post(
    "/{project_id}/conversations",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_conversation(
    project_id:int,
    data:ConversationCreate,
    current_user:User=Depends(get_current_user),
    db:Session=Depends(get_db)
):

    project=db.query(Project).filter(
        Project.id==project_id,
        Project.user_id==current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    conversation=Conversation(
        project_id=project_id,
        title=data.title
    )

    db.add(conversation)
    db.commit()
    db.refresh(conversation)

    return conversation 

@router.get(
    "/{project_id}/conversations",
    response_model=list[ConversationResponse]
)
def get_conversations(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    return db.query(Conversation).filter(
        Conversation.project_id == project_id
    ).order_by(
        Conversation.updated_at.desc()
    ).all()

@router.get(
    "/{project_id}/conversations/{conversation_id}",
    response_model=ConversationResponse
)
def get_conversation(
    project_id: int,
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    conversation = db.query(
        Conversation
    ).join(
        Project,
        Conversation.project_id == Project.id
    ).filter(
        Conversation.id == conversation_id,
        Conversation.project_id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    return conversation

@router.delete(
    "/{project_id}/conversations/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_conversation(
    project_id: int,
    conversation_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    conversation = db.query(
        Conversation
    ).join(
        Project,
        Conversation.project_id == Project.id
    ).filter(
        Conversation.id == conversation_id,
        Conversation.project_id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    db.delete(conversation)
    db.commit()

    return None