import os
from typing import Optional

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
# HTTP CONFIGURATION
# ============================================================

REQUEST_TIMEOUT = 30.0

HTTP_HEADERS = {
    "User-Agent": (
        "ResearchAI/1.0 "
        "(academic research project)"
    ),
    "Accept": "application/json",
}


PDF_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 "
        "(Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 "
        "(KHTML, like Gecko) "
        "Chrome/151.0 Safari/537.36"
    ),
    "Accept": (
        "application/pdf,"
        "application/octet-stream,"
        "text/html;q=0.9,*/*;q=0.8"
    ),
}


# ============================================================
# RECONSTRUCT ABSTRACT
# ============================================================

def reconstruct_abstract(
    inverted_index
):
    """
    Convert OpenAlex abstract_inverted_index
    into normal readable text.
    """

    if not inverted_index:
        return None

    words = []

    for word, positions in (
        inverted_index.items()
    ):
        if not positions:
            continue

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
# CHECK WHETHER URL LOOKS LIKE A REAL PDF
# ============================================================

def is_pdf_url(
    url: Optional[str]
) -> bool:
    """
    Check whether a URL appears to point to
    an actual PDF.

    Important:
    A URL ending with .pdf does NOT guarantee
    that the server actually returns a PDF.
    """

    if not url:
        return False

    try:

        with httpx.Client(
            timeout=15.0,
            follow_redirects=True,
            headers=PDF_HEADERS,
        ) as client:

            response = client.get(
                url
            )

        if response.status_code != 200:
            print(
                "PDF check failed:",
                response.status_code,
                url,
            )
            return False

        content_type = (
            response.headers
            .get(
                "content-type",
                ""
            )
            .lower()
        )

        first_bytes = (
            response.content[:5]
            if response.content
            else b""
        )

        # Real PDF normally starts with %PDF-
        if first_bytes == b"%PDF-":
            return True

        if (
            "application/pdf"
            in content_type
        ):
            return True

        print(
            "URL did not return a PDF:",
            url,
            "Content-Type:",
            content_type,
        )

        return False

    except Exception as error:

        print(
            "PDF validation error:",
            url,
            error,
        )

        return False


# ============================================================
# FIND PMC / NCBI PDF
# ============================================================

def find_repository_pdf(
    locations
):
    """
    Prefer repository PDFs.

    Priority:
    1. PMC
    2. NCBI
    3. Other repositories
    """

    repository_candidates = []

    for location in locations:

        if not location:
            continue

        pdf_url = (
            location.get(
                "pdf_url"
            )
        )

        if not pdf_url:
            continue

        landing_page = (
            location.get(
                "landing_page_url"
            )
            or ""
        ).lower()

        source = (
            location.get(
                "source"
            )
            or {}
        )

        source_name = (
            source.get(
                "display_name"
            )
            or ""
        ).lower()

        raw_source_name = (
            location.get(
                "raw_source_name"
            )
            or ""
        ).lower()

        combined = (
            landing_page
            + " "
            + source_name
            + " "
            + raw_source_name
            + " "
            + pdf_url.lower()
        )

        # ----------------------------------------------------
        # PMC / NCBI gets highest priority
        # ----------------------------------------------------

        if (
            "pmc.ncbi.nlm.nih.gov"
            in combined
            or "ncbi.nlm.nih.gov/pmc"
            in combined
            or "pubmed central"
            in combined
        ):
            repository_candidates.insert(
                0,
                pdf_url
            )

        # ----------------------------------------------------
        # Other repository
        # ----------------------------------------------------

        elif (
            location.get(
                "source"
            )
            and location.get(
                "source"
            ).get(
                "type"
            ) == "repository"
        ):
            repository_candidates.append(
                pdf_url
            )

    # --------------------------------------------------------
    # Validate candidates
    # --------------------------------------------------------

    for candidate in repository_candidates:

        print(
            "Checking repository PDF:",
            candidate
        )

        if is_pdf_url(
            candidate
        ):
            print(
                "Using repository PDF:",
                candidate
            )

            return candidate

    return None


# ============================================================
# FIND BEST PDF URL
# ============================================================

def find_pdf_url(
    work
):
    """
    Find the most useful downloadable PDF.

    Priority:

    1. PMC / NCBI repository
    2. Other repository
    3. Best OA PDF
    4. Primary location PDF
    5. Any remaining PDF

    IMPORTANT:
    OpenAlex may report a URL as a PDF even when
    the publisher actually returns an HTML page.
    Therefore every candidate is validated.
    """

    locations = (
        work.get(
            "locations"
        )
        or []
    )

    print(
        "\nFinding PDF for:",
        work.get(
            "title"
        )
    )

    # ========================================================
    # 1. REPOSITORY
    # ========================================================

    repository_pdf = find_repository_pdf(
        locations
    )

    if repository_pdf:

        return repository_pdf


    # ========================================================
    # 2. OTHER REPOSITORY LOCATIONS
    # ========================================================

    for location in locations:

        if not location:
            continue

        candidate_pdf = (
            location.get(
                "pdf_url"
            )
        )

        if not candidate_pdf:
            continue

        source = (
            location.get(
                "source"
            )
            or {}
        )

        source_type = (
            source.get(
                "type"
            )
            or ""
        ).lower()

        if source_type != "repository":
            continue

        print(
            "Checking repository:",
            candidate_pdf
        )

        if is_pdf_url(
            candidate_pdf
        ):
            return candidate_pdf


    # ========================================================
    # 3. BEST OA LOCATION
    # ========================================================

    best_oa_location = (
        work.get(
            "best_oa_location"
        )
        or {}
    )

    best_pdf = (
        best_oa_location.get(
            "pdf_url"
        )
    )

    if best_pdf:

        print(
            "Checking best OA PDF:",
            best_pdf
        )

        if is_pdf_url(
            best_pdf
        ):
            return best_pdf

        print(
            "Best OA URL was not a real PDF."
        )


    # ========================================================
    # 4. PRIMARY LOCATION
    # ========================================================

    primary_location = (
        work.get(
            "primary_location"
        )
        or {}
    )

    primary_pdf = (
        primary_location.get(
            "pdf_url"
        )
    )

    if primary_pdf:

        print(
            "Checking primary PDF:",
            primary_pdf
        )

        if is_pdf_url(
            primary_pdf
        ):
            return primary_pdf


    # ========================================================
    # 5. ANY REMAINING PDF
    # ========================================================

    checked = set()

    for location in locations:

        if not location:
            continue

        candidate_pdf = (
            location.get(
                "pdf_url"
            )
        )

        if not candidate_pdf:
            continue

        if candidate_pdf in checked:
            continue

        checked.add(
            candidate_pdf
        )

        print(
            "Checking remaining PDF:",
            candidate_pdf
        )

        if is_pdf_url(
            candidate_pdf
        ):
            return candidate_pdf


    # ========================================================
    # NO PDF
    # ========================================================

    print(
        "No verified downloadable PDF found for:",
        work.get(
            "title"
        )
    )

    return None


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

    # ========================================================
    # VALIDATE QUERY
    # ========================================================

    query = (
        query
        .strip()
    )

    if not query:

        raise ValueError(
            "Search query cannot be empty."
        )


    # ========================================================
    # VALIDATE PAGINATION
    # ========================================================

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


    # ========================================================
    # CALCULATE PAGE
    # ========================================================

    page = (
        offset // limit
    ) + 1


    # ========================================================
    # BASE PARAMETERS
    # ========================================================

    params = {

        "search":
            query,

        "per_page":
            limit,

        "page":
            page,
    }


    # ========================================================
    # OPENALEX API KEY
    # ========================================================

    if OPENALEX_API_KEY:

        params[
            "api_key"
        ] = OPENALEX_API_KEY


    # ========================================================
    # YEAR FILTER
    # ========================================================

    if year:

        year = (
            year.strip()
        )

        if "-" in year:

            parts = (
                year.split(
                    "-",
                    1
                )
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

            params[
                "filter"
            ] = (
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

            params[
                "filter"
            ] = (
                "publication_year:"
                f"{year}"
            )


    # ========================================================
    # OPEN ACCESS FILTER
    # ========================================================

    if open_access_only:

        if "filter" in params:

            params[
                "filter"
            ] += (
                ",open_access.is_oa:true"
            )

        else:

            params[
                "filter"
            ] = (
                "open_access.is_oa:true"
            )


    # ========================================================
    # DEBUG
    # ========================================================

    print(
        "\n========================================"
    )

    print(
        "OPENALEX SEARCH"
    )

    print(
        "Query:",
        query
    )

    print(
        "Offset:",
        offset
    )

    print(
        "Limit:",
        limit
    )

    print(
        "Year:",
        year
    )

    print(
        "Open access only:",
        open_access_only
    )

    print(
        "========================================\n"
    )


    # ========================================================
    # CALL OPENALEX
    # ========================================================

    try:

        async with httpx.AsyncClient(
            timeout=REQUEST_TIMEOUT,
            follow_redirects=True,
        ) as client:

            response = await client.get(
                OPENALEX_WORKS_URL,
                params=params,
                headers=HTTP_HEADERS,
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


    # ========================================================
    # HANDLE OPENALEX ERRORS
    # ========================================================

    if response.status_code != 200:

        print(
            "\n========================================"
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
            "========================================\n"
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


    # ========================================================
    # PARSE JSON
    # ========================================================

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


    # ========================================================
    # BUILD PAPER RESULTS
    # ========================================================

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

                    author_id=(
                        author.get(
                            "id"
                        )
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
        # PDF URL
        # ====================================================

        pdf_url = find_pdf_url(
            work
        )


        # ====================================================
        # DEBUG
        # ====================================================

        print(
            "\n----------------------------------------"
        )

        print(
            "Paper:",
            work.get(
                "title"
            )
        )

        print(
            "OpenAlex ID:",
            work.get(
                "id"
            )
        )

        print(
            "PDF URL:",
            pdf_url
        )

        print(
            "Open Access:",
            (
                work.get(
                    "open_access"
                )
                or {}
            ).get(
                "is_oa",
                False
            )
        )

        print(
            "----------------------------------------"
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

                is_open_access=(
                    is_open_access
                ),
            )
        )


    # ========================================================
    # METADATA
    # ========================================================

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


    # ========================================================
    # RETURN RESPONSE
    # ========================================================

    return PaperSearchResponse(

        query=query,

        total=total,

        offset=offset,

        limit=len(
            results
        ),

        results=results,
    )