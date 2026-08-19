from app.services.embedding_service import generate_embeddings

texts=[
    "Natural Language Processing is used for resume analysis.",
    "Machine learning helps automate recruitment."
]

embeddings=generate_embeddings(texts)

print("Number of embeddings:", len(embeddings))
print("Embedding dimensions:", len(embeddings[0]))
print("First embedding:", embeddings[0][:5])