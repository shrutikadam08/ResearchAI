from fastapi import FastAPI

from fastapi.middleware.cors import CORSMiddleware


# ============================================================
# API ROUTERS
# ============================================================

from app.api.auth import router as auth_router
from app.api.project import router as project_router
from app.api.document import router as document_router
from app.api.search import router as search_router
from app.api.ask import router as ask_router
from app.api.conversation import router as conversation_router
from app.api.message import router as message_router
from app.api.paper import router as paper_router
from app.api.saved_paper import router as saved_paper_router
from app.api.project_paper import router as project_paper_router
from app.api.analysis import router as analysis_router


# ============================================================
# CREATE APPLICATION
# ============================================================

app = FastAPI(
    title="ResearchAI API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(

    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],

    allow_credentials=True,

    allow_methods=[
        "*"
    ],

    allow_headers=[
        "*"
    ],

)


# ============================================================
# REGISTER ROUTERS
# ============================================================

app.include_router(
    auth_router
)

app.include_router(
    project_router
)

app.include_router(
    document_router
)

app.include_router(
    search_router
)

app.include_router(
    ask_router
)

app.include_router(
    conversation_router
)

app.include_router(
    message_router
)

app.include_router(
    paper_router
)

app.include_router(
    saved_paper_router
)

app.include_router(
    project_paper_router
)

app.include_router(
    analysis_router
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {
        "message":
            "ResearchAI Backend Running Successfully"
    }