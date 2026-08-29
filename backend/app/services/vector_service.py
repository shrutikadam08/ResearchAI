import os

import chromadb

from dotenv import load_dotenv
from sqlalchemy import text

from app.database.connection import engine
from app.services.embedding_service import generate_embeddings


load_dotenv()


# ============================================================
# VECTOR STORE CONFIGURATION
# ============================================================

VECTOR_STORE = os.getenv(
    "VECTOR_STORE",
    "chroma"
).lower()


CHROMA_PATH = os.getenv(
    "CHROMA_PATH",
    "chroma_db"
)


# ============================================================
# LOCAL CHROMADB
# ============================================================

chroma_client = chromadb.PersistentClient(
    path=CHROMA_PATH
)


def get_collection(project_id: int):

    return chroma_client.get_or_create_collection(
        name=f"project_{project_id}"
    )


def add_chunks_chroma(
    project_id: int,
    document_id: int,
    chunks: list[dict],
    embeddings: list[list[float]]
):

    collection = get_collection(
        project_id
    )

    ids = [
        f"{document_id}_{i}"
        for i in range(
            len(chunks)
        )
    ]

    documents = [
        chunk["text"]
        for chunk in chunks
    ]

    metadatas = [
        {
            "document_id": document_id,
            "page_number": chunk["page_number"],
        }
        for chunk in chunks
    ]

    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas,
    )


def search_chunks_chroma(
    project_id: int,
    query: str,
    n_results: int = 5
):

    collection = get_collection(
        project_id
    )

    query_embedding = generate_embeddings(
        [query]
    )[0]

    results = collection.query(
        query_embeddings=[
            query_embedding
        ],
        n_results=n_results,
    )

    return results


# ============================================================
# POSTGRESQL + PGVECTOR
# ============================================================

def add_chunks_pgvector(
    project_id: int,
    document_id: int,
    chunks: list[dict],
    embeddings: list[list[float]]
):

    rows = []

    for chunk, embedding in zip(
        chunks,
        embeddings
    ):
        rows.append(
            {
                "project_id": project_id,
                "document_id": document_id,
                "page_number": int(
                    chunk["page_number"]
                ),
                "content": chunk["text"],
                "embedding": str(
                    embedding
                ),
            }
        )


    if not rows:
        return


    insert_sql = text(
        """
        INSERT INTO document_chunks (
            project_id,
            document_id,
            page_number,
            content,
            embedding
        )
        VALUES (
            :project_id,
            :document_id,
            :page_number,
            :content,
            CAST(:embedding AS vector)
        )
        """
    )


    with engine.begin() as connection:

        connection.execute(
            insert_sql,
            rows
        )


def search_chunks_pgvector(
    project_id: int,
    query: str,
    n_results: int = 5
):

    query_embedding = generate_embeddings(
        [query]
    )[0]

    query_vector = str(
        query_embedding
    )


    search_sql = text(
        """
        SELECT
            document_id,
            page_number,
            content,
            1 - (
                embedding <=> CAST(
                    :query_embedding AS vector
                )
            ) AS similarity
        FROM document_chunks
        WHERE project_id = :project_id
        ORDER BY
            embedding <=> CAST(
                :query_embedding AS vector
            )
        LIMIT :n_results
        """
    )


    with engine.connect() as connection:

        result = connection.execute(
            search_sql,
            {
                "project_id": project_id,
                "query_embedding": query_vector,
                "n_results": n_results,
            }
        )

        rows = result.mappings().all()


    documents = [
        row["content"]
        for row in rows
    ]

    metadatas = [
        {
            "document_id": int(
                row["document_id"]
            ),
            "page_number": int(
                row["page_number"]
            ),
        }
        for row in rows
    ]


    return {
        "documents": [
            documents
        ],
        "metadatas": [
            metadatas
        ],
    }


# ============================================================
# PUBLIC API
# ============================================================

def add_chunks(
    project_id: int,
    document_id: int,
    chunks: list[dict],
    embeddings: list[list[float]]
):

    if VECTOR_STORE == "pgvector":

        return add_chunks_pgvector(
            project_id=project_id,
            document_id=document_id,
            chunks=chunks,
            embeddings=embeddings,
        )


    return add_chunks_chroma(
        project_id=project_id,
        document_id=document_id,
        chunks=chunks,
        embeddings=embeddings,
    )


def search_chunks(
    project_id: int,
    query: str,
    n_results: int = 5
):

    if VECTOR_STORE == "pgvector":

        return search_chunks_pgvector(
            project_id=project_id,
            query=query,
            n_results=n_results,
        )


    return search_chunks_chroma(
        project_id=project_id,
        query=query,
        n_results=n_results,
    )