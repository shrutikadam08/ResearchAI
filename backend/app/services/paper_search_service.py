import os

import httpx
from dotenv import load_dotenv

from app.schemas.paper import (
    PaperAuthor,
    PaperSearchResult,
    PaperSearchResponse,
)


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# OPENALEX CONFIGURATION
# ============================================================

OPENALEX_WORKS_URL = (
    "https://api.openalex.org/works"
)

OPENALEX_API_KEY = os.getenv(
    "OPENALEX_API_KEY"
)


# ============================================================
# RECONSTRUCT ABSTRACT
# ============================================================

def reconstruct_abstract(
    inverted_index
):

    if not inverted_index:
        return None

    words = []

    for word, positions in (
        inverted_index.items()
    ):

        for position in positions:

            words.append(
                (
                    position,
                    word
                )
            )

    words.sort(
        key=lambda item: item[0]
    )

    return " ".join(
        word
        for _, word in words
    )


# ============================================================
# SEARCH PAPERS FROM OPENALEX
# ============================================================

async def search_papers_from_openalex(

    query: str,

    offset: int = 0,

    limit: int = 10,

    year: str | None = None,

    open_access_only: bool = False,

) -> PaperSearchResponse:

    # --------------------------------------------------------
    # Validate query
    # --------------------------------------------------------

    query = query.strip()

    if not query:

        raise ValueError(
            "Search query cannot be empty."
        )


    # --------------------------------------------------------
    # Validate pagination
    # --------------------------------------------------------

    if offset < 0:

        raise ValueError(
            "Offset cannot be negative."
        )


    if limit < 1:

        raise ValueError(
            "Limit must be at least 1."
        )


    if limit > 25:

        limit = 25


    # --------------------------------------------------------
    # Calculate OpenAlex page
    # --------------------------------------------------------

    page = (
        offset // limit
    ) + 1


    # --------------------------------------------------------
    # Base parameters
    # --------------------------------------------------------

    params = {

        "search":
            query,

        "per_page":
            limit,

        "page":
            page,

    }


    # --------------------------------------------------------
    # OpenAlex API key
    # --------------------------------------------------------

    if OPENALEX_API_KEY:

        params["api_key"] = (
            OPENALEX_API_KEY
        )


    # --------------------------------------------------------
    # Year filter
    # --------------------------------------------------------

    if year:

        year = year.strip()


        if "-" in year:

            parts = year.split(
                "-",
                1
            )


            if len(parts) != 2:

                raise ValueError(
                    "Invalid year range. "
                    "Use YYYY-YYYY."
                )


            start_year = (
                parts[0].strip()
            )

            end_year = (
                parts[1].strip()
            )


            if (
                not start_year.isdigit()
                or not end_year.isdigit()
            ):

                raise ValueError(
                    "Invalid year range. "
                    "Use YYYY-YYYY."
                )


            params["filter"] = (

                "from_publication_date:"
                f"{start_year}-01-01,"

                "to_publication_date:"
                f"{end_year}-12-31"

            )


        else:

            if not year.isdigit():

                raise ValueError(
                    "Invalid publication year."
                )


            params["filter"] = (

                "publication_year:"
                f"{year}"

            )


    # --------------------------------------------------------
    # Open access filter
    # --------------------------------------------------------

    if open_access_only:

        if "filter" in params:

            params["filter"] += (
                ",open_access.is_oa:true"
            )

        else:

            params["filter"] = (
                "open_access.is_oa:true"
            )


    # --------------------------------------------------------
    # Headers
    # --------------------------------------------------------

    headers = {

        "User-Agent":
            (
                "ResearchAI/1.0 "
                "(academic research project)"
            ),

        "Accept":
            "application/json",

    }


    # --------------------------------------------------------
    # Call OpenAlex
    # --------------------------------------------------------

    try:

        async with httpx.AsyncClient(

            timeout=30.0,

            follow_redirects=True,

        ) as client:

            response = await client.get(

                OPENALEX_WORKS_URL,

                params=params,

                headers=headers,

            )


    except httpx.TimeoutException:

        raise RuntimeError(
            "OpenAlex request timed out. "
            "Please try again."
        )


    except httpx.RequestError as error:

        raise RuntimeError(
            "Could not connect to OpenAlex: "
            f"{error}"
        )


    # --------------------------------------------------------
    # Handle OpenAlex errors
    # --------------------------------------------------------

    if response.status_code != 200:

        print(
            "\n"
            "========================================"
        )

        print(
            "OPENALEX ERROR"
        )

        print(
            "Status:",
            response.status_code
        )

        print(
            "URL:",
            str(response.url)
        )

        print(
            "Response:",
            response.text[:2000]
        )

        print(
            "API KEY PRESENT:",
            bool(OPENALEX_API_KEY)
        )

        print(
            "========================================"
            "\n"
        )


        if response.status_code == 400:

            raise RuntimeError(
                "OpenAlex rejected the search "
                "request."
            )


        if response.status_code == 401:

            raise RuntimeError(
                "OpenAlex authentication failed. "
                "Please check the OpenAlex API "
                "configuration."
            )


        if response.status_code == 403:

            raise RuntimeError(
                "OpenAlex denied the request."
            )


        if response.status_code == 429:

            raise RuntimeError(
                "OpenAlex rate limit reached. "
                "Please try again later."
            )


        if response.status_code >= 500:

            raise RuntimeError(
                "OpenAlex is temporarily "
                "unavailable. Please try again."
            )


        raise RuntimeError(
            "OpenAlex API request failed. "
            f"Status: {response.status_code}."
        )


    # --------------------------------------------------------
    # Parse JSON
    # --------------------------------------------------------

    try:

        data = response.json()

    except ValueError:

        print(
            "OpenAlex returned invalid JSON:"
        )

        print(
            response.text[:2000]
        )

        raise RuntimeError(
            "OpenAlex returned an invalid "
            "response."
        )


    # --------------------------------------------------------
    # Build paper results
    # --------------------------------------------------------

    results = []


    for work in data.get(
        "results",
        []
    ):


        # ====================================================
        # AUTHORS
        # ====================================================

        authors = []


        for authorship in work.get(
            "authorships",
            []
        ):

            author = (
                authorship.get(
                    "author"
                )
            )


            if not author:

                continue


            authors.append(

                PaperAuthor(

                    author_id=
                        author.get(
                            "id"
                        ),

                    name=(
                        author.get(
                            "display_name"
                        )
                        or
                        "Unknown Author"
                    ),

                )

            )


        # ====================================================
        # ABSTRACT
        # ====================================================

        abstract = (
            reconstruct_abstract(
                work.get(
                    "abstract_inverted_index"
                )
            )
        )


        # ====================================================
        # BEST OPEN ACCESS LOCATION
        # ====================================================

        pdf_url = None


        best_oa_location = (
            work.get(
                "best_oa_location"
            )
        )


        if best_oa_location:

            pdf_url = (
                best_oa_location.get(
                    "pdf_url"
                )
            )


        # ====================================================
        # FALLBACK PDF LOCATION
        # ====================================================

        if not pdf_url:

            primary_location = (
                work.get(
                    "primary_location"
                )
            )


            if primary_location:

                pdf_url = (
                    primary_location.get(
                        "pdf_url"
                    )
                )


        # ====================================================
        # VENUE
        # ====================================================

        venue = None


        primary_location = (
            work.get(
                "primary_location"
            )
        )


        if primary_location:

            source = (
                primary_location.get(
                    "source"
                )
            )


            if source:

                venue = (
                    source.get(
                        "display_name"
                    )
                )


        # ====================================================
        # DOI
        # ====================================================

        doi = (
            work.get(
                "doi"
            )
        )


        # ====================================================
        # PAPER URL
        # ====================================================

        paper_url = (
            work.get(
                "id"
            )
        )


        # ====================================================
        # OPEN ACCESS
        # ====================================================

        open_access = (
            work.get(
                "open_access"
            )
            or {}
        )


        is_open_access = bool(

            open_access.get(
                "is_oa",
                False
            )

        )


        # ====================================================
        # PAPER ID
        # ====================================================

        work_id = (
            work.get(
                "id"
            )
        )


        if not work_id:

            continue


        # ====================================================
        # CREATE RESULT
        # ====================================================

        results.append(

            PaperSearchResult(

                paper_id=str(
                    work_id
                ),

                title=(
                    work.get(
                        "title"
                    )
                    or
                    work.get(
                        "display_name"
                    )
                    or
                    "Untitled Paper"
                ),

                authors=authors,

                abstract=abstract,

                year=(
                    work.get(
                        "publication_year"
                    )
                ),

                venue=venue,

                citation_count=(
                    work.get(
                        "cited_by_count"
                    )
                    or
                    0
                ),

                url=paper_url,

                pdf_url=pdf_url,

                is_open_access=
                    is_open_access,

            )

        )


    # --------------------------------------------------------
    # Metadata
    # --------------------------------------------------------

    meta = (
        data.get(
            "meta",
            {}
        )
    )


    total = (
        meta.get(
            "count"
        )
    )


    # --------------------------------------------------------
    # Return response
    # --------------------------------------------------------

    return PaperSearchResponse(

        query=query,

        total=total,

        offset=offset,

        limit=len(
            results
        ),

        results=results,

    )