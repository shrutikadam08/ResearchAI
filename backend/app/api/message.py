from datetime import datetime

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
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
    ChatRequest,
)

from app.agent.agent import run_agent


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/projects",
    tags=["Messages"],
)


# ============================================================
# CREATE NORMAL MESSAGE
# ============================================================

@router.post(
    "/{project_id}/conversations/{conversation_id}/messages",
    status_code=status.HTTP_201_CREATED,
)
def create_message(
    project_id: int,
    conversation_id: int,
    data: MessageCreate,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    # ========================================================
    # CHECK PROJECT OWNERSHIP
    # ========================================================

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )


    # ========================================================
    # CHECK CONVERSATION
    # ========================================================

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.project_id == project_id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )


    # ========================================================
    # CREATE MESSAGE
    # ========================================================

    message = Message(
        conversation_id=conversation_id,
        role=data.role,
        content=data.content,
    )

    db.add(message)

    conversation.updated_at = datetime.utcnow()

    db.commit()

    db.refresh(message)


    return {
        "message":
            "Message created successfully",

        "message_id":
            message.id,

        "conversation_id":
            message.conversation_id,

        "role":
            message.role,

        "content":
            message.content,

        "created_at":
            message.created_at,
    }


# ============================================================
# GET CONVERSATION MESSAGES
# ============================================================

@router.get(
    "/{project_id}/conversations/{conversation_id}/messages",
)
def get_conversation_messages(
    project_id: int,
    conversation_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    # ========================================================
    # CHECK PROJECT
    # ========================================================

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )


    # ========================================================
    # CHECK CONVERSATION
    # ========================================================

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.project_id == project_id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )


    # ========================================================
    # GET MESSAGES
    # ========================================================

    messages = (
        db.query(Message)
        .filter(
            Message.conversation_id ==
            conversation_id
        )
        .order_by(
            Message.created_at.asc(),
            Message.id.asc(),
        )
        .all()
    )


    return [
        {
            "id":
                message.id,

            "conversation_id":
                message.conversation_id,

            "role":
                message.role,

            "content":
                message.content,

            "created_at":
                message.created_at,

        }

        for message in messages
    ]


# ============================================================
# CHAT WITH RESEARCHAI
# ============================================================

@router.post(
    "/{project_id}/conversations/{conversation_id}/chat",
    status_code=status.HTTP_200_OK,
)
def chat(
    project_id: int,
    conversation_id: int,
    data: ChatRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    ),
):

    # ========================================================
    # CHECK PROJECT OWNERSHIP
    # ========================================================

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id,
        )
        .first()
    )

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )


    # ========================================================
    # CHECK CONVERSATION
    # ========================================================

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.project_id == project_id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )


    # ========================================================
    # PREVENT IMMEDIATE DUPLICATE MESSAGE
    # ========================================================

    last_message = (
        db.query(Message)
        .filter(
            Message.conversation_id ==
            conversation_id
        )
        .order_by(
            Message.created_at.desc(),
            Message.id.desc(),
        )
        .first()
    )


    if (
        last_message
        and str(
            last_message.role
        ).upper() == "USER"
        and (
            last_message.content or ""
        ).strip()
        == data.content.strip()
    ):

        # ----------------------------------------------------
        # See whether an assistant answer already exists.
        # ----------------------------------------------------

        assistant_message = (
            db.query(Message)
            .filter(
                Message.conversation_id ==
                conversation_id,

                Message.role ==
                "ASSISTANT",

                Message.created_at >
                last_message.created_at,
            )
            .order_by(
                Message.created_at.asc(),
                Message.id.asc(),
            )
            .first()
        )


        if assistant_message:

            return {
                "conversation_id":
                    conversation_id,

                "question":
                    data.content,

                "answer":
                    assistant_message.content,

                "message_id":
                    assistant_message.id,

                "tool":
                    None,

                "evidence":
                    None,

                "citations":
                    [],
            }


        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This message has already been submitted "
                "and is currently being processed."
            ),
        )


    # ========================================================
    # GET PREVIOUS HISTORY
    # ========================================================

    previous_messages = (
        db.query(Message)
        .filter(
            Message.conversation_id ==
            conversation_id
        )
        .order_by(
            Message.created_at.asc(),
            Message.id.asc(),
        )
        .all()
    )


    history_parts = []


    for previous_message in previous_messages:

        history_parts.append(
            f"{previous_message.role}: "
            f"{previous_message.content}"
        )


    conversation_history = "\n".join(
        history_parts
    )


    # ========================================================
    # SAVE USER MESSAGE
    # ========================================================

    user_message = Message(
        conversation_id=
            conversation_id,

        role="USER",

        content=
            data.content.strip(),
    )

    db.add(
        user_message
    )

    conversation.updated_at = (
        datetime.utcnow()
    )

    db.commit()

    db.refresh(
        user_message
    )


    # ========================================================
    # RUN RESEARCH AGENT
    # ========================================================

    try:

        agent_result = run_agent(
            project_id=project_id,
            query=data.content.strip(),
            conversation_history=
                conversation_history,
        )

    except Exception as error:

        import traceback

        print(
            "\n"
            "================ AGENT ERROR ================\n"
        )

        print(
            traceback.format_exc()
        )

        print(
            "\n"
            "=============================================\n"
        )

        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Agent error: "
                f"{type(error).__name__}: "
                f"{str(error)}"
            ),
        )


    # ========================================================
    # EXTRACT ANSWER
    # ========================================================

    if isinstance(
        agent_result,
        dict,
    ):

        answer = agent_result.get(
            "answer",
            "",
        )

    else:

        answer = str(
            agent_result
        )


    if not isinstance(
        answer,
        str,
    ):

        answer = str(
            answer
        )


    if not answer.strip():

        answer = (
            "I could not generate an answer "
            "from the available research evidence."
        )


    # ========================================================
    # GET CITATIONS
    # ========================================================

    citations = []

    if isinstance(
        agent_result,
        dict,
    ):

        raw_citations = (
            agent_result.get(
                "citations",
                []
            )
        )

        if isinstance(
            raw_citations,
            list
        ):

            citations = raw_citations


    # ========================================================
    # GET EVIDENCE
    # ========================================================

    evidence = None

    if isinstance(
        agent_result,
        dict,
    ):

        evidence = (
            agent_result.get(
                "evidence"
            )
        )


    # ========================================================
    # SAVE ASSISTANT MESSAGE
    # ========================================================

    try:

        assistant_message = Message(
            conversation_id=
                conversation_id,

            role="ASSISTANT",

            content=
                answer.strip(),
        )


        db.add(
            assistant_message
        )


        conversation.updated_at = (
            datetime.utcnow()
        )


        db.commit()

        db.refresh(
            assistant_message
        )

    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Failed to save assistant message: "
                f"{str(error)}"
            ),
        )


    # ========================================================
    # RETURN FULL RESEARCH RESPONSE
    # ========================================================

    return {

        "conversation_id":
            conversation_id,

        "question":
            data.content,

        "answer":
            answer,

        "message_id":
            assistant_message.id,

        "tool":
            agent_result.get(
                "tool"
            )
            if isinstance(
                agent_result,
                dict
            )
            else None,

        "evidence":
            evidence,

        "citations":
            citations,

    }