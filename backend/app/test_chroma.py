from app.services.embedding_service import generate_embeddings
from app.services.vector_service import add_chunks, search_chunks

chunks=[
    {
        "text":"Natural Language Processing is used to analyze resumes.",
        "page_number":1
    },
    {
        "text":"Machine learning algorithms can rank candidates based on job requirements.",
        "page_number":2
    },
    {
        "text":"Automated interview systems can generate questions and evaluate candidate responses.",
        "page_number":3
    }
]

texts=[chunk["text"] for chunk in chunks]

embeddings=generate_embeddings(texts)

add_chunks(
    project_id=3,
    document_id=1,
    chunks=chunks,
    embeddings=embeddings 
)

results=search_chunks(
    project_id=3,
    query="How does the system analyze candidate resumes?",
    n_results=2 
)

print("\nSearch Results:")

for i, document in enumerate(results["documents"][0], start=1):
    metadata=results["metadatas"][0][i-1]

    print(f"\n--- Result {i} ---")
    print("Text:", document)
    print("Page:", metadata["page_number"])

