from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status
)

from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.dependencies import get_db

from app.models.user import User
from app.models.project import Project
from app.models.conversation import Conversation
from app.models.message import Message

from app.schemas.message import (
    MessageCreate,
    ChatRequest
)

from app.agent.agent import run_agent


router = APIRouter(
    prefix="/projects",
    tags=["Messages"]
)


# ============================================================
# CREATE NORMAL MESSAGE
# ============================================================

@router.post(
    "/{project_id}/conversations/{conversation_id}/messages",
    status_code=status.HTTP_201_CREATED
)
def create_message(
    project_id: int,
    conversation_id: int,
    data: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # 1. Check project ownership
    # --------------------------------------------------------

    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # --------------------------------------------------------
    # 2. Check conversation
    # --------------------------------------------------------

    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.project_id == project_id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # --------------------------------------------------------
    # 3. Create message
    # --------------------------------------------------------

    message = Message(
        conversation_id=conversation_id,
        role=data.role,
        content=data.content
    )

    db.add(message)

    # Update conversation timestamp
    conversation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(message)

    return {
        "message": "Message created successfully",
        "message_id": message.id,
        "conversation_id": message.conversation_id,
        "role": message.role,
        "content": message.content,
        "created_at": message.created_at
    }


# ============================================================
# CHAT WITH RESEARCHAI AGENT
# ============================================================

@router.post(
    "/{project_id}/conversations/{conversation_id}/chat",
    status_code=status.HTTP_200_OK
)
def chat(
    project_id: int,
    conversation_id: int,
    data: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # --------------------------------------------------------
    # 1. Check project ownership
    # --------------------------------------------------------

    project = db.query(Project).filter(
        Project.id == project_id,
        Project.user_id == current_user.id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )

    # --------------------------------------------------------
    # 2. Check conversation
    # --------------------------------------------------------

    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.project_id == project_id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )

    # --------------------------------------------------------
    # 3. Get previous conversation history
    # --------------------------------------------------------

    previous_messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(
        Message.created_at.asc()
    ).all()

    history_parts = []

    for previous_message in previous_messages:

        history_parts.append(
            f"{previous_message.role}: "
            f"{previous_message.content}"
        )

    conversation_history = "\n".join(
        history_parts
    )

    # --------------------------------------------------------
    # 4. Save USER message
    # --------------------------------------------------------

    user_message = Message(
        conversation_id=conversation_id,
        role="USER",
        content=data.content
    )

    db.add(user_message)

    conversation.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(user_message)

    # --------------------------------------------------------
    # 5. Run ResearchAI agent
    # --------------------------------------------------------

    try:

        agent_result = run_agent(
            project_id=project_id,
            query=data.content,
            conversation_history=conversation_history
        )

    except Exception as e:

        import traceback
        
        error_details=traceback.format_exc()

        print("\n=================AGENT ERROR=================\n")
        print(error_details)
        print("\n===========================================\n")


        db.rollback()


        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                f"Agent error:"
                f"{type(e).__name__}: {str(e)}"
            )
        )

    # --------------------------------------------------------
    # 6. Extract AI answer
    # --------------------------------------------------------

    if isinstance(agent_result, dict):

        answer = agent_result.get(
            "answer",
            ""
        )

    else:

        answer = str(agent_result)

    # Make sure answer is always text
    if not isinstance(answer, str):

        answer = str(answer)

    # Prevent empty assistant message
    if not answer.strip():

        answer = (
            "I could not generate an answer "
            "from the available research evidence."
        )

    # --------------------------------------------------------
    # 7. Save ASSISTANT message
    # --------------------------------------------------------

    try:

        assistant_message = Message(
            conversation_id=conversation_id,
            role="ASSISTANT",
            content=answer
        )

        db.add(assistant_message)

        conversation.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(assistant_message)

    except Exception as e:

        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to save assistant message: "
                f"{str(e)}"
            )
        )

    # --------------------------------------------------------
    # 8. Return response
    # --------------------------------------------------------

    return {
        "conversation_id": conversation_id,
        "question": data.content,
        "answer": answer,
        "message_id": assistant_message.id,
        "tool": agent_result.get("tool")
        if isinstance(agent_result, dict)
        else None,
        "evidence": agent_result.get("evidence")
        if isinstance(agent_result, dict)
        else None
    }