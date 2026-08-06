from fastapi import FastAPI

app = FastAPI(
    title="ResearchAI API",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "message": "ResearchAI Backend Running Successfully"
    }