from app.services.pdf_service import extract_text_from_pdf
from app.services.chunking_service import chunk_pages

file_path="uploads/791fb874-dbc7-437d-8b6f-4f5f0f16d06f.pdf"

pages=extract_text_from_pdf(file_path)

chunks=chunk_pages(pages)

print("Total pages:", len(pages))
print("Total chunks:", len(chunks))

for i, chunk in enumerate(chunks[:5],start=1):
    print(f"\n--- Chunk{i} ---")
    print("Page:", chunk["page_number"])
    print("Text:", chunk["text"][:500])