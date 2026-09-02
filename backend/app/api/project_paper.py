import os
import uuid
import re

import httpx
import pymupdf

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
from app.models.saved_paper import SavedPaper
from app.models.project_paper import ProjectPaper
from app.models.document import Document

from app.schemas.project_paper import (
    ProjectPaperCreate,
    ProjectPaperResponse,
)

from app.schemas.saved_paper import (
    SavedPaperResponse,
)

from app.services.document_service import process_document


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/projects",
    tags=["Project Papers"],
)


# ============================================================
# UPLOAD DIRECTORY
# ============================================================

UPLOAD_DIR = "uploads"

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True,
)


# ============================================================
# HTTP SETTINGS
# ============================================================

HTTP_HEADERS = {
    "User-Agent": (
        "ResearchAI/1.0 "
        "(academic research project)"
    ),
    "Accept": (
        "application/pdf,"
        "application/octet-stream,"
        "text/html,"
        "*/*"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


# ============================================================
# CHECK IF RESPONSE IS REALLY A PDF
# ============================================================

def is_valid_pdf(
    content: bytes,
) -> bool:

    if not content:
        return False

    return content.startswith(
        b"%PDF"
    )


# ============================================================
# DOWNLOAD ONE PDF URL
# ============================================================

async def download_paper_pdf(
    pdf_url: str,
    file_path: str,
):
    """
    Download a URL and verify that it is an actual PDF.

    Some publishers return HTML even when the URL ends
    in .pdf. We reject those responses.
    """

    print(
        "\nTrying PDF URL:",
        pdf_url,
    )

    try:

        async with httpx.AsyncClient(
            timeout=60.0,
            follow_redirects=True,
        ) as client:

            response = await client.get(
                pdf_url,
                headers=HTTP_HEADERS,
            )

    except httpx.TimeoutException as error:

        print(
            "PDF timeout:",
            error,
        )

        raise RuntimeError(
            "PDF download timed out."
        )

    except httpx.RequestError as error:

        print(
            "PDF request error:",
            error,
        )

        raise RuntimeError(
            f"PDF request failed: {error}"
        )

    print(
        "HTTP status:",
        response.status_code,
    )

    print(
        "Final URL:",
        response.url,
    )

    content_type = (
        response.headers.get(
            "content-type",
        )
        or ""
    ).lower()

    print(
        "Content-Type:",
        content_type,
    )

    print(
        "Bytes:",
        len(response.content),
    )

    if response.status_code != 200:

        raise RuntimeError(
            f"HTTP {response.status_code}"
        )

    if not response.content:

        raise RuntimeError(
            "Downloaded response is empty."
        )

    # --------------------------------------------------------
    # REAL PDF CHECK
    # --------------------------------------------------------

    if not is_valid_pdf(
        response.content
    ):

        print(
            "NOT A PDF."
        )

        print(
            "First bytes:",
            response.content[:100],
        )

        raise RuntimeError(
            "The URL returned HTML or another "
            "non-PDF response."
        )

    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    with open(
        file_path,
        "wb",
    ) as file:

        file.write(
            response.content
        )

    file_size = os.path.getsize(
        file_path
    )

    if file_size <= 0:

        raise RuntimeError(
            "Saved PDF is empty."
        )

    print(
        "PDF downloaded successfully:",
        file_size,
        "bytes",
    )

    return file_size


# ============================================================
# GET OPENALEX WORK ID
# ============================================================

def get_openalex_work_id(
    openalex_id: str | None,
):
    """
    Convert values such as:

        https://openalex.org/W4384071683

    into:

        W4384071683
    """

    if not openalex_id:

        return None

    value = str(
        openalex_id
    ).strip()

    if not value:

        return None

    match = re.search(
        r"(W\d+)",
        value,
        re.IGNORECASE,
    )

    if not match:

        return None

    return match.group(1)

def build_pmc_pdf_url(url: str) -> str | None:
    """
    Normalize a PMC URL to the accessible PMC article page.

    We deliberately do not guess a /pdf/ URL because PMC may return
    HTML from that endpoint. The landing-page downloader below can
    inspect the article page and discover the real PDF link.
    """

    if not url:
        return None

    url = str(url).strip()

    match = re.search(
        r"(?:https?://)?(?:www\.)?pmc\.ncbi\.nlm\.nih\.gov/articles/(PMC\d+)",
        url,
        re.IGNORECASE,
    )

    if not match:
        match = re.search(
            r"(?:https?://)?(?:www\.)?ncbi\.nlm\.nih\.gov/pmc/articles/(PMC\d+)",
            url,
            re.IGNORECASE,
        )

    if not match:
        return None

    pmc_id = match.group(1).upper()

    return f"https://pmc.ncbi.nlm.nih.gov/articles/{pmc_id}/"


# ============================================================
# GET PDF CANDIDATES FROM OPENALEX
# ============================================================

async def get_openalex_pdf_candidates(
    openalex_id: str | None,
):
    """
    Ask OpenAlex for all known locations of the paper.

    Repository copies are preferred over publisher copies.
    """

    work_id = get_openalex_work_id(
        openalex_id
    )

    if not work_id:

        return []

    api_url = (
        "https://api.openalex.org/works/"
        + work_id
    )

    print(
        "\nChecking OpenAlex:",
        api_url,
    )

    candidates = []

    try:

        async with httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
        ) as client:

            response = await client.get(
                api_url,
                headers={
                    "User-Agent":
                        "ResearchAI/1.0"
                },
            )

        if response.status_code != 200:

            print(
                "OpenAlex returned:",
                response.status_code,
            )

            return []

        data = response.json()

    except Exception as error:

        print(
            "OpenAlex lookup failed:",
            error,
        )

        return []

    # --------------------------------------------------------
    # BEST OA LOCATION
    # --------------------------------------------------------

    best = data.get(
        "best_oa_location"
    )

    if best:

        pdf_url = best.get(
            "pdf_url"
        )

        landing_url = best.get(
            "landing_page_url"
        )

        source = best.get(
            "source"
        ) or {}

        source_name = (
            source.get(
                "display_name"
            )
            or ""
        ).lower()

        # Repository/PMC first
        if pdf_url:

            if (
                "pmc" in source_name
                or "pubmed" in source_name
            ):

                candidates.insert(
                    0,
                    pdf_url
                )

            else:

                candidates.append(
                    pdf_url
                )

        if landing_url:

            candidates.append(
                landing_url
            )

    # --------------------------------------------------------
    # ALL LOCATIONS
    # --------------------------------------------------------

    locations = (
        data.get(
            "locations"
        )
        or []
    )

    repository_candidates = []
    other_candidates = []

    for location in locations:

        if not location:

            continue

        pdf_url = location.get(
            "pdf_url"
        )

        landing_url = location.get(
            "landing_page_url"
        )

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

        is_repository = (
            "pmc" in source_name
            or "pubmed" in source_name
            or "repository" in source_name
            or "archive" in source_name
        )

        if pdf_url:

            if is_repository:

                repository_candidates.append(
                    pdf_url
                )

            else:

                other_candidates.append(
                    pdf_url
                )

        if landing_url:

            if (
                "pmc.ncbi.nlm.nih.gov"
                in landing_url
                or "ncbi.nlm.nih.gov/pmc"
                in landing_url
            ):

                repository_candidates.append(
                    landing_url
                )

    # --------------------------------------------------------
    # PMC / REPOSITORY FIRST
    # --------------------------------------------------------

    candidates = (
        repository_candidates
        + candidates
        + other_candidates
    )

    # --------------------------------------------------------
    # REMOVE DUPLICATES
    # --------------------------------------------------------

    unique_candidates = []

    seen = set()

    for url in candidates:

        if not url:

            continue

        url = str(
            url
        ).strip()

        if not url:

            continue

        if url in seen:

            continue

        seen.add(
            url
        )

        unique_candidates.append(
            url
        )

    print(
        "OpenAlex PDF candidates:"
    )

    for url in unique_candidates:

        print(
            "  -",
            url,
        )

    return unique_candidates


# ============================================================
# EXTRACT PDF LINK FROM PMC/HTML PAGE
# ============================================================

def extract_pdf_links_from_html(
    html: str,
    base_url: str,
):
    """
    Extract likely PDF URLs from an HTML landing page.
    """

    from urllib.parse import urljoin

    links = []

    hrefs = re.findall(
        r"""href=["']([^"']+)["']""",
        html,
        flags=re.IGNORECASE,
    
    )

    for href in hrefs:
        href = href.strip()

        if not href:
            continue

        href_lower = href.lower()

        # Common direct-PDF patterns.
        if (
            "pdf" in href_lower
            or ".pdf" in href_lower
            or "/pdf/" in href_lower
            or "download" in href_lower
            or "fulltext" in href_lower
            or "full-text" in href_lower
        ):
            links.append(
                urljoin(base_url, href)
            )

    # Standard academic meta tag.
    meta_matches = re.findall(
        r"<meta[^>]+(?:name|property)=[\"']citation_pdf_url[\"'][^>]+content=[\"']([^\"']+)[\"']",
        html,
        flags=re.IGNORECASE,
    )

    for link in meta_matches:
        links.append(
            urljoin(base_url, link.strip())
        )

    result = []
    seen = set()

    for link in links:
        link = link.strip()

        if not link or link in seen:
            continue

        seen.add(link)
        result.append(link)

    return result


# ============================================================
# DOWNLOAD FROM HTML LANDING PAGE
# ============================================================

async def download_from_landing_page(
    landing_url: str,
    file_path: str,
):
    """
    Open a landing page, find PDF links, and try them.
    """

    print(
        "\nTrying landing page:",
        landing_url,
    )

    try:

        async with httpx.AsyncClient(
            timeout=45.0,
            follow_redirects=True,
        ) as client:

            response = await client.get(
                landing_url,
                headers=HTTP_HEADERS,
            )

    except Exception as error:

        print(
            "Landing page request failed:",
            error,
        )

        return None

    if response.status_code != 200:

        print(
            "Landing page HTTP status:",
            response.status_code,
        )

        return None

    content_type = (
        response.headers.get(
            "content-type"
        )
        or ""
    ).lower()

    # --------------------------------------------------------
    # Sometimes landing URL itself returns PDF
    # --------------------------------------------------------

    if is_valid_pdf(
        response.content
    ):

        with open(
            file_path,
            "wb",
        ) as file:

            file.write(
                response.content
            )

        return os.path.getsize(
            file_path
        )

    # --------------------------------------------------------
    # Otherwise parse HTML
    # --------------------------------------------------------

    if (
        "html" not in content_type
        and not response.text
    ):

        return None

    pdf_links = (
        extract_pdf_links_from_html(
            response.text,
            str(response.url),
        )
    )

    print(
        "PDF links found:",
        len(pdf_links),
    )

    for pdf_url in pdf_links:

        try:

            return await download_paper_pdf(
                pdf_url=pdf_url,
                file_path=file_path,
            )

        except Exception as error:

            print(
                "PDF link failed:",
                pdf_url,
                error,
            )

            if os.path.exists(
                file_path
            ):

                try:

                    os.remove(
                        file_path
                    )

                except Exception:

                    pass

    return None


# ============================================================
# DOWNLOAD PAPER WITH FALLBACKS
# ============================================================

async def download_paper_with_fallbacks(
    saved_paper: SavedPaper,
    file_path: str,
):
    """
    Try the saved PDF first.

    If it fails, ask OpenAlex for additional locations.

    If a location is an HTML landing page, inspect it for
    a real PDF link.
    """

    candidates = []

    # --------------------------------------------------------
    # 1. SAVED PDF URL
    # --------------------------------------------------------

    if saved_paper.pdf_url:
        candidates.append(saved_paper.pdf_url)

    # --------------------------------------------------------
    # 2. SAVED PAPER / ARTICLE URL
    # --------------------------------------------------------

    if saved_paper.paper_url:
        candidates.append(saved_paper.paper_url)

    # --------------------------------------------------------
    # 3. DOI URL
    #
    # Some SavedPaper records do not have a dedicated DOI field,
    # so DOI discovery is handled through OpenAlex locations below.
    # --------------------------------------------------------

    # --------------------------------------------------------
    # 4. OPENALEX LOCATIONS
    # --------------------------------------------------------

    openalex_candidates = (
        await get_openalex_pdf_candidates(
            saved_paper.openalex_id
        )
    )

    candidates.extend(
        openalex_candidates
    )

    # --------------------------------------------------------
    # DEDUPLICATE
    # --------------------------------------------------------

    unique_candidates = []

    seen = set()

    for url in candidates:

        if not url:

            continue

        url = str(
            url
        ).strip()

        if not url:

            continue

        if url in seen:

            continue

        seen.add(
            url
        )

        unique_candidates.append(
            url
        )

    if not unique_candidates:

        raise RuntimeError(
            "No PDF URL was found for this paper."
        )

    print(
        "\n========== PAPER DOWNLOAD =========="
    )

    print(
        "Paper:",
        saved_paper.title,
    )

    print(
        "SavedPaper ID:",
        saved_paper.id,
    )

    print(
        "Candidates:",
        len(unique_candidates),
    )

    # --------------------------------------------------------
    # TRY EVERY CANDIDATE
    # --------------------------------------------------------

    errors = []

    for url in unique_candidates:

        # ----------------------------------------------------
        # FIRST: DIRECT PDF
        # ----------------------------------------------------

        try:

            size = await download_paper_pdf(
                pdf_url=url,
                file_path=file_path,
            )

            print(
                "SUCCESS:",
                url,
            )

            print(
                "====================================\n"
            )

            return size

        except Exception as error:

            message = str(
                error
            )

            errors.append(
                f"{url}: {message}"
            )

            print(
                "Direct PDF failed:",
                message,
            )

        # ----------------------------------------------------
        # SECOND: TRY AS LANDING PAGE
        # ----------------------------------------------------

        try:

            size = await download_from_landing_page(
                landing_url=url,
                file_path=file_path,
            )

            if size:

                print(
                    "SUCCESS THROUGH LANDING PAGE:",
                    url,
                )

                print(
                    "====================================\n"
                )

                return size

        except Exception as error:

            errors.append(
                f"Landing {url}: {error}"
            )

            print(
                "Landing page failed:",
                error,
            )

        # ----------------------------------------------------
        # CLEAN FAILED FILE
        # ----------------------------------------------------

        if os.path.exists(
            file_path
        ):

            try:

                os.remove(
                    file_path
                )

            except Exception:

                pass

    print(
        "ALL PDF DOWNLOAD METHODS FAILED."
    )

    for error in errors:

        print(
            " -",
            error,
        )

    print(
        "====================================\n"
    )

    raise RuntimeError(
        "Unable to obtain a valid PDF from "
        "the available paper sources."
    )


# ============================================================
# EXTRACT PDF METADATA
# ============================================================

def extract_pdf_metadata(
    file_path: str,
    saved_paper: SavedPaper,
):

    metadata = {
        "title":
            saved_paper.title,

        "authors":
            saved_paper.authors,

        "publication_year":
            saved_paper.year,

        "journal":
            saved_paper.venue,
    }

    pdf_document = None

    try:

        pdf_document = pymupdf.open(
            file_path
        )

        pdf_metadata = (
            pdf_document.metadata
            or {}
        )

        if not metadata["title"]:

            metadata["title"] = (
                pdf_metadata.get(
                    "title"
                )
            )

        if not metadata["authors"]:

            metadata["authors"] = (
                pdf_metadata.get(
                    "author"
                )
            )

    except Exception as error:

        print(
            "PDF metadata extraction failed:",
            error,
        )

    finally:

        if pdf_document:

            try:

                pdf_document.close()

            except Exception:

                pass

    return metadata


# ============================================================
# ADD SAVED PAPER TO PROJECT
# ============================================================

@router.post(
    "/{project_id}/papers",
    response_model=ProjectPaperResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_paper_to_project(

    project_id: int,

    paper_data: ProjectPaperCreate,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):

    print(
        "\n========== ADD PAPER TO PROJECT =========="
    )

    print(
        "Project:",
        project_id,
    )

    print(
        "SavedPaper:",
        paper_data.saved_paper_id,
    )

    print(
        "User:",
        current_user.id,
    )

    # ========================================================
    # FIND PROJECT
    # ========================================================

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id ==
                current_user.id,
        )
        .first()
    )

    if not project:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=(
                f"Project {project_id} "
                "was not found for the current user."
            ),
        )

    # ========================================================
    # FIND SAVED PAPER
    # ========================================================

    saved_paper = (
        db.query(SavedPaper)
        .filter(
            SavedPaper.id ==
                paper_data.saved_paper_id,

            SavedPaper.user_id ==
                current_user.id,
        )
        .first()
    )

    if not saved_paper:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=(
                f"Saved paper "
                f"{paper_data.saved_paper_id} "
                "was not found for the current user."
            ),
        )

    # ========================================================
    # CHECK DUPLICATE PROJECT PAPER
    # ========================================================

    existing_project_paper = (
        db.query(ProjectPaper)
        .filter(
            ProjectPaper.project_id ==
                project_id,

            ProjectPaper.saved_paper_id ==
                saved_paper.id,
        )
        .first()
    )

    if existing_project_paper:

        raise HTTPException(
            status_code=
                status.HTTP_409_CONFLICT,

            detail=(
                "Paper is already added "
                "to this project."
            ),
        )

    # ========================================================
    # CHECK EXISTING PROCESSED DOCUMENT
    # ========================================================

    existing_document = (
        db.query(Document)
        .filter(
            Document.project_id ==
                project_id,

            Document.saved_paper_id ==
                saved_paper.id,

            Document.processing_status ==
                "PROCESSED",
        )
        .first()
    )

    if existing_document:

        print(
            "Processed document already exists:",
            existing_document.id,
        )

        project_paper = ProjectPaper(
            project_id=project_id,
            saved_paper_id=saved_paper.id,
        )

        db.add(
            project_paper
        )

        db.commit()

        db.refresh(
            project_paper
        )

        return project_paper

    # ========================================================
    # DOWNLOAD PAPER
    # ========================================================

    stored_filename = (
        f"{uuid.uuid4()}.pdf"
    )

    file_path = os.path.join(
        UPLOAD_DIR,
        stored_filename,
    )

    try:

        file_size = (
            await download_paper_with_fallbacks(
                saved_paper=saved_paper,
                file_path=file_path,
            )
        )

    except Exception as error:

        print(
            "Paper PDF download failed:",
            error,
        )

        if os.path.exists(
            file_path
        ):

            try:

                os.remove(
                    file_path
                )

            except Exception:

                pass

        raise HTTPException(
            status_code=
                status.HTTP_502_BAD_GATEWAY,

            detail=(
                "Unable to download a valid PDF "
                "for this paper. The publisher or "
                "repository did not provide an "
                "accessible PDF."
            ),
        )

    # ========================================================
    # EXTRACT METADATA
    # ========================================================

    metadata = extract_pdf_metadata(
        file_path=file_path,
        saved_paper=saved_paper,
    )

    # ========================================================
    # CREATE DOCUMENT
    # ========================================================

    original_filename = (
        (saved_paper.title or "research_paper")
        [:240]
        + ".pdf"
    )

    document = Document(

        project_id=project_id,

        # IMPORTANT:
        # This connects the document to the SavedPaper.
        saved_paper_id=saved_paper.id,

        original_filename=
            original_filename,

        stored_filename=
            stored_filename,

        file_path=
            file_path,

        file_size=
            file_size,

        content_type=
            "application/pdf",

        processing_status=
            "UPLOADED",

        title=
            metadata["title"],

        authors=
            metadata["authors"],

        publication_year=
            metadata["publication_year"],

        journal=
            metadata["journal"],
    )

    db.add(
        document
    )

    try:

        db.commit()

        db.refresh(
            document
        )

    except Exception as error:

        db.rollback()

        print(
            "Document creation failed:",
            error,
        )

        if os.path.exists(
            file_path
        ):

            try:

                os.remove(
                    file_path
                )

            except Exception:

                pass

        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=(
                "Unable to create the document "
                "for this paper."
            ),
        )

    # ========================================================
    # PROCESS DOCUMENT
    #
    # PDF
    # ↓
    # TEXT
    # ↓
    # CHUNKS
    # ↓
    # EMBEDDINGS
    # ↓
    # CHROMA
    # ========================================================

    try:

        print(
            "\nProcessing document:",
            document.id,
        )

        process_document(
            document=document,
            db=db,
        )

        # Refresh after processing in case
        # process_document changed the status.

        db.refresh(
            document
        )

        print(
            "Processing status:",
            document.processing_status,
        )

    except Exception as error:

        print(
            "Paper processing failed:",
            error,
        )

        # ----------------------------------------------------
        # Mark document as failed
        # ----------------------------------------------------

        try:

            document.processing_status = (
                "FAILED"
            )

            db.commit()

        except Exception:

            db.rollback()

        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=(
                "The paper PDF was downloaded, "
                "but it could not be processed "
                "for research comparison."
            ),
        )

    # ========================================================
    # VERIFY PROCESSING
    # ========================================================

    if (
        document.processing_status
        != "PROCESSED"
    ):

        print(
            "WARNING: Document is not PROCESSED."
        )

        print(
            "Status:",
            document.processing_status,
        )

        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=(
                "The paper was downloaded but "
                "was not successfully processed "
                "for research comparison."
            ),
        )

    # ========================================================
    # CREATE PROJECT PAPER RELATIONSHIP
    # ========================================================

    project_paper = ProjectPaper(
        project_id=project_id,

        saved_paper_id=
            saved_paper.id,
    )

    db.add(
        project_paper
    )

    try:

        db.commit()

        db.refresh(
            project_paper
        )

    except Exception as error:

        db.rollback()

        print(
            "Project paper creation failed:",
            error,
        )

        raise HTTPException(
            status_code=
                status.HTTP_500_INTERNAL_SERVER_ERROR,

            detail=(
                "Paper was processed but could "
                "not be added to the project."
            ),
        )

    print(
        "\n========== SUCCESS =========="
    )

    print(
        "Project:",
        project_id,
    )

    print(
        "SavedPaper:",
        saved_paper.id,
    )

    print(
        "Document:",
        document.id,
    )

    print(
        "Processing:",
        document.processing_status,
    )

    print(
        "====================================\n"
    )

    return project_paper


# ============================================================
# GET PAPERS IN PROJECT
# ============================================================

@router.get(
    "/{project_id}/papers",
    response_model=list[SavedPaperResponse],
)
def get_project_papers(

    project_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id ==
                current_user.id,
        )
        .first()
    )

    if not project:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=(
                f"Project {project_id} "
                "was not found for the current user."
            ),
        )

    papers = (
        db.query(SavedPaper)
        .join(
            ProjectPaper,
            ProjectPaper.saved_paper_id ==
                SavedPaper.id,
        )
        .filter(
            ProjectPaper.project_id ==
                project_id,

            SavedPaper.user_id ==
                current_user.id,
        )
        .order_by(
            SavedPaper.created_at.desc()
        )
        .all()
    )

    return papers


# ============================================================
# REMOVE PAPER FROM PROJECT
# ============================================================

@router.delete(
    "/{project_id}/papers/{saved_paper_id}",
)
def remove_paper_from_project(

    project_id: int,

    saved_paper_id: int,

    db: Session = Depends(
        get_db
    ),

    current_user: User = Depends(
        get_current_user
    ),
):

    project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.user_id ==
                current_user.id,
        )
        .first()
    )

    if not project:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=(
                f"Project {project_id} "
                "was not found for the current user."
            ),
        )

    project_paper = (
        db.query(ProjectPaper)
        .join(
            SavedPaper,
            SavedPaper.id ==
                ProjectPaper.saved_paper_id,
        )
        .filter(
            ProjectPaper.project_id ==
                project_id,

            ProjectPaper.saved_paper_id ==
                saved_paper_id,

            SavedPaper.user_id ==
                current_user.id,
        )
        .first()
    )

    if not project_paper:

        raise HTTPException(
            status_code=
                status.HTTP_404_NOT_FOUND,

            detail=(
                f"Saved paper "
                f"{saved_paper_id} "
                "is not in this project."
            ),
        )

    db.delete(
        project_paper
    )

    db.commit()

    return {
        "message":
            "Paper removed from project."
    }
