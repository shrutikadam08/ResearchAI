from typing import Optional

from fastapi import (
    APIRouter,
    HTTPException,
    Query,
)

from app.schemas.paper import (
    PaperSearchResponse,
)

from app.services.paper_search_service import (
    search_papers_from_openalex,
)


router = APIRouter(
    prefix="/papers",
    tags=["Papers"],
)


@router.get(
    "/search",
    response_model=PaperSearchResponse,
)
async def search_papers(

    q: str = Query(
        ...,
        min_length=2,
        max_length=300,
        description=(
            "Research topic, paper title, "
            "author, or keywords"
        ),
    ),

    offset: int = Query(
        0,
        ge=0,
    ),

    limit: int = Query(
        10,
        ge=1,
        le=25,
    ),

    year: Optional[str] = Query(
        None,
        description=(
            "Year or year range. "
            "Examples: 2024 or 2020-2025"
        ),
    ),

    open_access_only: bool = Query(
        False,
        description=(
            "Return only papers with "
            "a public PDF"
        ),
    ),

):

    try:

        results = (
            await search_papers_from_openalex(
                query=q,
                offset=offset,
                limit=limit,
                year=year,
                open_access_only=(
                    open_access_only
                ),
            )
        )

        return results


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


    except RuntimeError as error:

        raise HTTPException(
            status_code=502,
            detail=str(error),
        )


    except Exception as error:

        print(
            "Paper search error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "An unexpected error occurred "
                "while searching papers."
            ),
        )