import chromadb

CHROMA_PATH="chroma_db"

client=chromadb.PersistentClient(
    path=CHROMA_PATH
)

def get_collection(project_id: int):
    return client.get_or_create_collection(
        name=f"project_{project_id}"
    )

def add_chunks(
        project_id:int,
        document_id:int,
        chunks:list[dict],
        embeddings:list[list[float]]
):
    collection=get_collection(project_id)

    ids=[
        f"{document_id}_{i}"
        for i in range(len(chunks))
    ]

    documents=[
        chunk["text"]
        for chunk in chunks 
    ]

    metadatas=[
        {
            "document_id":document_id,
            "page_number":chunk["page_number"]
        }
        for chunk in chunks 
    ]

    collection.add(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas
    )

from app.services.embedding_service import generate_embeddings

def search_chunks(
        project_id:int,
        query:str,
        n_results:int=5
):
    collection=get_collection(project_id)

    query_embedding=generate_embeddings([query])[0]

    results=collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    return results