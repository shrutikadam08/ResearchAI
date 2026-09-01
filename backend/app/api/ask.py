from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.database.dependencies import get_db

from app.models.project import Project
from app.models.user import User

from app.schemas.ask import (
    AskRequest,
    AskResponse,
)

from app.agent.graph import research_agent


router = APIRouter(
    prefix="/projects",
    tags=["Research Agent"]
)


# ============================================================
# ASK RESEARCH AGENT
# ============================================================

@router.post(
    "/{project_id}/ask",
    response_model=AskResponse
)
def ask_research_agent(
    project_id: int,
    request: AskRequest,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(
        get_db
    )
):

    # ========================================================
    # CHECK PROJECT OWNERSHIP
    # ========================================================

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id == current_user.id
        )
        .first()
    )


    if not project:

        raise HTTPException(
            status_code=404,
            detail="Project not found"
        )


    # ========================================================
    # RUN RESEARCH AGENT
    # ========================================================

    result = research_agent.invoke(
        {
            "project_id": project_id,
            "question": request.question,
            "paper_ids":request.paper_ids,
        }
    )


    # ========================================================
    # GET TOOL RESULT
    # ========================================================

    tool_result = result.get(
        "tool_result",
        {}
    )


    if not isinstance(
        tool_result,
        dict
    ):

        tool_result = {}


    # ========================================================
    # SOURCES
    # ========================================================

    sources = []

    raw_sources = tool_result.get(
        "sources",
        []
    )


    if isinstance(
        raw_sources,
        list
    ):

        for index, source in enumerate(
            raw_sources
        ):

            if not isinstance(
                source,
                dict
            ):
                continue


            document_id = source.get(
                "document_id"
            )

            page_number = source.get(
                "page_number"
            )


            if (
                document_id is None
                or page_number is None
            ):
                continue


            sources.append(
                {
                    "id":
                        source.get(
                            "id",
                            index + 1
                        ),

                    "document_id":
                        int(
                            document_id
                        ),

                    "page_number":
                        int(
                            page_number
                        ),
                }
            )


    # ========================================================
    # RESEARCH-GAP EVIDENCE
    #
    # Research-gap tool stores evidence differently:
    #
    # documents[
    #   {
    #     document_id,
    #     evidence: [
    #       {
    #         text,
    #         page_number
    #       }
    #     ]
    #   }
    # ]
    # ========================================================

    evidence = []


    documents = tool_result.get(
        "documents",
        []
    )


    if isinstance(
        documents,
        list
    ):

        source_counter = (
            len(sources) + 1
        )


        for document in documents:

            if not isinstance(
                document,
                dict
            ):
                continue


            document_id = document.get(
                "document_id"
            )


            if document_id is None:
                continue


            document_evidence = document.get(
                "evidence",
                []
            )


            if not isinstance(
                document_evidence,
                list
            ):
                continue


            for item in document_evidence:

                if not isinstance(
                    item,
                    dict
                ):
                    continue


                text = str(
                    item.get(
                        "text",
                        ""
                    )
                ).strip()


                page_number = item.get(
                    "page_number"
                )


                if (
                    not text
                    or page_number is None
                ):
                    continue


                evidence.append(
                    {
                        "document_id":
                            int(
                                document_id
                            ),

                        "page_number":
                            int(
                                page_number
                            ),

                        "text":
                            text,
                    }
                )


                # ------------------------------------------------
                # Also create a source entry when the research-gap
                # result did not already provide one.
                # ------------------------------------------------

                source_exists = any(
                    source["document_id"]
                    == int(document_id)
                    and
                    source["page_number"]
                    == int(page_number)

                    for source in sources
                )


                if not source_exists:

                    sources.append(
                        {
                            "id":
                                source_counter,

                            "document_id":
                                int(
                                    document_id
                                ),

                            "page_number":
                                int(
                                    page_number
                                ),
                        }
                    )


                    source_counter += 1


    # ========================================================
    # REMOVE DUPLICATE EVIDENCE
    # ========================================================

    unique_evidence = []

    seen_evidence = set()


    for item in evidence:

        key = (
            item["document_id"],
            item["page_number"],
            item["text"]
        )


        if key in seen_evidence:

            continue


        seen_evidence.add(
            key
        )


        unique_evidence.append(
            item
        )


    # ========================================================
    # RETURN
    # ========================================================

    return {

        "question":
            request.question,

        "answer":
            result.get(
                "answer",
                "No answer generated."
            ),

        "sources":
            sources,

        "evidence":
            unique_evidence,

    }