import os
from dotenv import load_dotenv

load_dotenv()

LOCAL_MODEL_NAME = "all-MiniLM-L6-v2"
GEMINI_EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIMENSION = 768

_local_model = None


def get_local_model():
    global _local_model

    if _local_model is None:
        from sentence_transformers import SentenceTransformer

        _local_model = SentenceTransformer(LOCAL_MODEL_NAME)

    return _local_model


def generate_local_embeddings(texts: list[str]):
    return get_local_model().encode(
        texts,
        normalize_embeddings=True
    ).tolist()


def generate_gemini_embeddings(
    texts: list[str],
    task_type: str
):
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY is not configured."
        )

    client = genai.Client(api_key=api_key)

    all_embeddings = []

    batch_size = 100

    for start in range(0, len(texts), batch_size):
        batch = texts[start:start + batch_size]

        response = client.models.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            contents=batch,
            config=types.EmbedContentConfig(
                task_type=task_type,
                output_dimensionality=EMBEDDING_DIMENSION
            )
        )

        batch_embeddings = [
            embedding.values
            for embedding in response.embeddings
        ]

        all_embeddings.extend(batch_embeddings)

    return all_embeddings


def generate_embeddings(
    texts: list[str],
    task_type: str = "RETRIEVAL_DOCUMENT"
):
    ai_provider = os.getenv(
        "AI_PROVIDER",
        "gemini"
    ).lower()

    try:
        if ai_provider == "gemini":
            return generate_gemini_embeddings(
                texts,
                task_type
            )

        return generate_local_embeddings(texts)

    except Exception as error:
        print(
            "Embedding generation failed:",
            repr(error)
        )
        raise