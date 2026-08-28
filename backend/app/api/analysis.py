import httpx
import fitz

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from app.auth.dependencies import get_current_user
from app.models.user import User

from app.schemas.paper_analysis import (
    PaperAnalysisRequest,
    PaperAnalysisResponse,
)


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/analysis",
    tags=["Paper Analysis"],
)


# ============================================================
# OPENALEX
# ============================================================

OPENALEX_WORKS_URL = (
    "https://api.openalex.org/works"
)


# ============================================================
# AI SETTINGS
# ============================================================

OLLAMA_MODEL = "qwen3:0.6b"

# Reduced from your previous 30000 characters.
# This makes local Ollama analysis faster.
MAX_PAPER_CHARACTERS = 12000


# ============================================================
# AI SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are ResearchAI, an AI research assistant.

Your task is to analyze ONE research paper using ONLY
the paper content provided to you.

Do not use outside knowledge.

Do not invent facts.

If something cannot be determined from the paper,
clearly say that it is not available.

Your response MUST use exactly these sections:

SUMMARY:
Give a clear and concise summary of the paper.

KEY_CONTRIBUTIONS:
List the important contributions supported by the paper.

METHODOLOGY:
Explain the methodology, approach, models, techniques,
datasets, experiments, or methods described in the paper.

LIMITATIONS:
List limitations explicitly mentioned or clearly supported
by the paper.

RESEARCH_GAPS:
Identify research gaps supported by the paper.

FUTURE_DIRECTIONS:
List future research directions supported by the paper.

Keep the analysis useful for a university student or researcher.
"""


# ============================================================
# RECONSTRUCT OPENALEX ABSTRACT
# ============================================================

def reconstruct_abstract(inverted_index):

    if not inverted_index:
        return None

    words = []

    for word, positions in inverted_index.items():

        for position in positions:

            words.append(
                (
                    position,
                    word,
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
# GET FULL PAPER FROM OPENALEX
# ============================================================

async def get_openalex_paper(
    paper_id: str
):

    if not paper_id:

        raise HTTPException(
            status_code=400,
            detail="Paper ID is required.",
        )

    paper_id = paper_id.strip()

    # --------------------------------------------------------
    # Extract OpenAlex ID
    # --------------------------------------------------------

    if paper_id.startswith(
        "https://openalex.org/"
    ):

        openalex_id = (
            paper_id
            .rstrip("/")
            .split("/")[-1]
        )

    elif paper_id.startswith(
        "http://openalex.org/"
    ):

        openalex_id = (
            paper_id
            .rstrip("/")
            .split("/")[-1]
        )

    else:

        openalex_id = (
            paper_id
            .strip("/")
            .split("/")[-1]
        )

    if not openalex_id:

        raise HTTPException(
            status_code=400,
            detail="Invalid OpenAlex paper ID.",
        )

    url = (
        f"{OPENALEX_WORKS_URL}/"
        f"{openalex_id}"
    )

    headers = {
        "User-Agent": (
            "ResearchAI/1.0 "
            "(academic research project)"
        ),
        "Accept": "application/json",
    }

    async with httpx.AsyncClient(
        timeout=30.0,
        follow_redirects=True,
    ) as client:

        try:

            response = await client.get(
                url,
                headers=headers,
            )

        except httpx.RequestError as error:

            print(
                "OpenAlex connection error:",
                error,
            )

            raise HTTPException(
                status_code=502,
                detail="Could not connect to OpenAlex.",
            )

    if response.status_code != 200:

        print(
            "OpenAlex error:",
            response.status_code,
        )

        print(
            response.text[:500]
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "OpenAlex could not retrieve "
                "this research paper."
            ),
        )

    try:

        return response.json()

    except ValueError:

        print(
            "OpenAlex returned non-JSON response."
        )

        print(
            response.text[:500]
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "OpenAlex returned an invalid "
                "response."
            ),
        )


# ============================================================
# DOWNLOAD PDF
# ============================================================

async def download_pdf(
    pdf_url: str
):

    if not pdf_url:
        return None

    headers = {
        "User-Agent": (
            "ResearchAI/1.0 "
            "(academic research project)"
        )
    }

    async with httpx.AsyncClient(
        timeout=45.0,
        follow_redirects=True,
    ) as client:

        try:

            response = await client.get(
                pdf_url,
                headers=headers,
            )

        except httpx.RequestError as error:

            print(
                "PDF download error:",
                error,
            )

            return None

    if response.status_code != 200:

        print(
            "PDF download failed:",
            response.status_code,
        )

        return None

    if not response.content:

        return None

    return response.content


# ============================================================
# EXTRACT PDF TEXT
# ============================================================

def extract_pdf_text(
    pdf_bytes: bytes
):

    if not pdf_bytes:
        return None

    try:

        document = fitz.open(
            stream=pdf_bytes,
            filetype="pdf",
        )

    except Exception as error:

        print(
            "Could not open PDF:",
            error,
        )

        return None

    text_parts = []

    character_count = 0

    try:

        for page in document:

            # Stop reading once enough text has been collected.
            if character_count >= MAX_PAPER_CHARACTERS:
                break

            text = page.get_text(
                "text"
            )

            if not text:
                continue

            text = text.strip()

            if not text:
                continue

            remaining = (
                MAX_PAPER_CHARACTERS
                - character_count
            )

            if remaining <= 0:
                break

            chunk = text[:remaining]

            text_parts.append(
                chunk
            )

            character_count += len(
                chunk
            )

    finally:

        document.close()

    if not text_parts:
        return None

    full_text = "\n\n".join(
        text_parts
    )

    return full_text.strip()


# ============================================================
# LIMIT PAPER TEXT
# ============================================================

def prepare_paper_text(
    text: str,
    max_characters: int = MAX_PAPER_CHARACTERS,
):

    if not text:
        return None

    text = text.strip()

    if not text:
        return None

    if len(text) <= max_characters:
        return text

    return (
        text[:max_characters]
        + "\n\n"
        "[Paper text truncated for AI analysis.]"
    )


# ============================================================
# ANALYZE PAPER
# ============================================================

@router.post(
    "",
    response_model=PaperAnalysisResponse,
)
async def analyze_paper(

    request: PaperAnalysisRequest,

    current_user: User = Depends(
        get_current_user
    ),

):

    # ========================================================
    # VARIABLES
    # ========================================================

    paper = None

    abstract = None

    pdf_url = request.pdf_url

    title = request.title

    authors_text = request.authors

    year = request.year

    venue = request.venue


    # ========================================================
    # GET FULL PAPER FROM OPENALEX
    # ========================================================

    if request.paper_id:

        paper = await get_openalex_paper(
            request.paper_id
        )


    # ========================================================
    # EXTRACT OPENALEX DATA
    # ========================================================

    if paper:

        title = (
            paper.get("title")
            or request.title
            or "Untitled Paper"
        )

        # ----------------------------------------------------
        # Abstract
        # ----------------------------------------------------

        abstract = reconstruct_abstract(
            paper.get(
                "abstract_inverted_index"
            )
        )

        # ----------------------------------------------------
        # Authors
        # ----------------------------------------------------

        authors = []

        for authorship in paper.get(
            "authorships",
            []
        ):

            author = authorship.get(
                "author"
            )

            if not author:
                continue

            author_name = author.get(
                "display_name"
            )

            if author_name:

                authors.append(
                    author_name
                )

        if authors:

            authors_text = ", ".join(
                authors
            )

        # ----------------------------------------------------
        # Year
        # ----------------------------------------------------

        year = (
            paper.get(
                "publication_year"
            )
            or request.year
        )

        # ----------------------------------------------------
        # Venue
        # ----------------------------------------------------

        primary_location = (
            paper.get(
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
                    or venue
                )

        # ----------------------------------------------------
        # PDF URL
        # ----------------------------------------------------

        best_oa_location = (
            paper.get(
                "best_oa_location"
            )
        )

        if best_oa_location:

            pdf_url = (
                best_oa_location.get(
                    "pdf_url"
                )
                or pdf_url
            )

        # ----------------------------------------------------
        # Fallback primary location PDF
        # ----------------------------------------------------

        if (
            not pdf_url
            and primary_location
        ):

            pdf_url = (
                primary_location.get(
                    "pdf_url"
                )
            )


    # ========================================================
    # FALLBACK TO FRONTEND ABSTRACT
    # ========================================================

    if not abstract:

        abstract = request.abstract


    # ========================================================
    # PAPER CONTENT
    # ========================================================

    paper_content = None


    # ========================================================
    # OPTION 1: ABSTRACT
    #
    # This is the fastest path.
    # ========================================================

    if abstract:

        paper_content = prepare_paper_text(
            abstract
        )

        print(
            "Analysis source: abstract"
        )


    # ========================================================
    # OPTION 2: PDF
    #
    # Only used when no abstract is available.
    # ========================================================

    if (
        not paper_content
        and pdf_url
    ):

        print(
            "No abstract available."
        )

        print(
            "Trying PDF:",
            pdf_url
        )

        pdf_bytes = await download_pdf(
            pdf_url
        )

        if pdf_bytes:

            print(
                "PDF downloaded:",
                len(pdf_bytes),
                "bytes"
            )

            extracted_text = (
                extract_pdf_text(
                    pdf_bytes
                )
            )

            if extracted_text:

                paper_content = (
                    prepare_paper_text(
                        extracted_text
                    )
                )

                print(
                    "PDF text prepared:",
                    len(paper_content),
                    "characters"
                )


    # ========================================================
    # NO CONTENT AVAILABLE
    # ========================================================

    if not paper_content:

        raise HTTPException(
            status_code=422,
            detail=(
                "ResearchAI could not find "
                "an abstract or readable "
                "open-access PDF for this paper."
            ),
        )


    # ========================================================
    # BUILD PAPER INFORMATION
    # ========================================================

    paper_information = f"""
TITLE:
{title}

AUTHORS:
{authors_text or "Not available"}

YEAR:
{year or "Not available"}

VENUE:
{venue or "Not available"}

PAPER CONTENT:
{paper_content}
"""


    # ========================================================
    # AI PROMPT
    # ========================================================

    user_prompt = f"""
Analyze the following research paper.

{paper_information}

Use ONLY the paper content provided above.

Return the analysis using exactly this format:

SUMMARY:
Write the summary here.

KEY_CONTRIBUTIONS:
- Contribution 1
- Contribution 2
- Contribution 3

METHODOLOGY:
Explain the methodology here.

LIMITATIONS:
- Limitation 1
- Limitation 2

RESEARCH_GAPS:
- Research gap 1
- Research gap 2

FUTURE_DIRECTIONS:
- Future direction 1
- Future direction 2
"""


    # ========================================================
    # OLLAMA
    # ========================================================

    print(
        "Sending",
        len(paper_content),
        "characters to Ollama..."
    )

    # ========================================================
    # OLLAMA HTTP API
    # ========================================================

    try:

        async with httpx.AsyncClient(timeout=120.0) as client:

            ollama_response = await client.post(
                "http://127.0.0.1:11434/api/chat",
                json={
                    "model": OLLAMA_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": SYSTEM_PROMPT,
                        },
                        {
                            "role": "user",
                            "content": user_prompt,
                        },
                    ],
                    "stream": False,
                    "think": False,
                    "options": {
                        "temperature": 0,
                        "num_predict": 700,
                    },
                },
            )

    except httpx.RequestError as error:

        print(
            "Ollama connection error:",
            repr(error),
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "ResearchAI could not connect to Ollama. "
                "Please make sure Ollama is running."
            ),
        )

    except Exception as error:

        print(
            "Ollama request error:",
            repr(error),
        )

        raise HTTPException(
            status_code=500,
            detail="AI analysis could not be generated.",
        )

    # ========================================================
    # CHECK OLLAMA RESPONSE
    # ========================================================

    if ollama_response.status_code != 200:

        print(
            "Ollama HTTP status:",
            ollama_response.status_code,
        )

        print(
            "Ollama response:",
            ollama_response.text[:1000],
        )

        raise HTTPException(
            status_code=502,
            detail="Ollama could not generate the paper analysis.",
        )

    try:

        response_data = ollama_response.json()

    except ValueError as error:

        print(
            "Ollama returned invalid JSON:",
            repr(error),
        )

        raise HTTPException(
            status_code=502,
            detail="Ollama returned an invalid response.",
        )

    # ========================================================
    # AI RESPONSE
    # ========================================================

    message = response_data.get("message") or {}
    content = message.get("content") or ""

    if not content:

        print(
            "Ollama returned no final content."
        )

        print(
            "Ollama response keys:",
            list(response_data.keys()),
        )

        raise HTTPException(
            status_code=500,
            detail="Ollama returned an empty analysis.",
        )

    print(
        "AI analysis generated successfully."
    )


    # ========================================================
    # DEFAULT VALUES
    # ========================================================

    summary = ""

    methodology = ""

    key_contributions = []

    limitations = []

    research_gaps = []

    future_directions = []

    current_section = None


    # ========================================================
    # PARSE RESPONSE
    # ========================================================

    for raw_line in content.splitlines():

        line = raw_line.strip()

        if not line:
            continue

        upper_line = line.upper()


        # ----------------------------------------------------
        # SUMMARY
        # ----------------------------------------------------

        if upper_line.startswith(
            "SUMMARY:"
        ):

            current_section = "summary"

            summary = (
                line[
                    len("SUMMARY:")
                :]
                .strip()
            )

            continue


        # ----------------------------------------------------
        # KEY CONTRIBUTIONS
        # ----------------------------------------------------

        if upper_line.startswith(
            "KEY_CONTRIBUTIONS:"
        ):

            current_section = (
                "key_contributions"
            )

            continue


        # ----------------------------------------------------
        # METHODOLOGY
        # ----------------------------------------------------

        if upper_line.startswith(
            "METHODOLOGY:"
        ):

            current_section = "methodology"

            methodology = (
                line[
                    len("METHODOLOGY:")
                :]
                .strip()
            )

            continue


        # ----------------------------------------------------
        # LIMITATIONS
        # ----------------------------------------------------

        if upper_line.startswith(
            "LIMITATIONS:"
        ):

            current_section = "limitations"

            continue


        # ----------------------------------------------------
        # RESEARCH GAPS
        # ----------------------------------------------------

        if upper_line.startswith(
            "RESEARCH_GAPS:"
        ):

            current_section = "research_gaps"

            continue


        # ----------------------------------------------------
        # FUTURE DIRECTIONS
        # ----------------------------------------------------

        if upper_line.startswith(
            "FUTURE_DIRECTIONS:"
        ):

            current_section = (
                "future_directions"
            )

            continue


        # ====================================================
        # ADD CONTENT
        # ====================================================

        if current_section == "summary":

            if summary:

                summary += (
                    " " + line
                )

            else:

                summary = line


        elif current_section == "methodology":

            if methodology:

                methodology += (
                    " " + line
                )

            else:

                methodology = line


        elif current_section == "key_contributions":

            cleaned = line.lstrip(
                "-•* "
            )

            if cleaned:

                key_contributions.append(
                    cleaned
                )


        elif current_section == "limitations":

            cleaned = line.lstrip(
                "-•* "
            )

            if cleaned:

                limitations.append(
                    cleaned
                )


        elif current_section == "research_gaps":

            cleaned = line.lstrip(
                "-•* "
            )

            if cleaned:

                research_gaps.append(
                    cleaned
                )


        elif current_section == "future_directions":

            cleaned = line.lstrip(
                "-•* "
            )

            if cleaned:

                future_directions.append(
                    cleaned
                )


    # ========================================================
    # FALLBACK VALUES
    # ========================================================

    if not summary:

        summary = (
            "No summary could be generated."
        )


    if not methodology:

        methodology = (
            "Methodology information "
            "was not available."
        )


    if not key_contributions:

        key_contributions = [
            (
                "No specific contributions "
                "could be identified from "
                "the available paper content."
            )
        ]


    if not limitations:

        limitations = [
            (
                "No specific limitations "
                "could be identified from "
                "the available paper content."
            )
        ]


    if not research_gaps:

        research_gaps = [
            (
                "No specific research gaps "
                "could be identified from "
                "the available paper content."
            )
        ]


    if not future_directions:

        future_directions = [
            (
                "No specific future directions "
                "could be identified from "
                "the available paper content."
            )
        ]


    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "summary":
            summary,

        "key_contributions":
            key_contributions,

        "methodology":
            methodology,

        "limitations":
            limitations,

        "research_gaps":
            research_gaps,

        "future_directions":
            future_directions,

    }