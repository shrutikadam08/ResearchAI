from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.project import router as project_router
from app.api.document import router as document_router
from app.api.search import router as search_router
from app.api.ask import router as ask_router
from app.api.conversation import router as conversation_router
from app.api.message import router as message_router

app = FastAPI(
    title="ResearchAI API",
    version="1.0.0"
)

app.include_router(auth_router)
app.include_router(project_router)
app.include_router(document_router)
app.include_router(search_router)
app.include_router(ask_router)
app.include_router(conversation_router)
app.include_router(message_router)

@app.get("/")
def root():
    return {
        "message": "ResearchAI Backend Running Successfully"
    }