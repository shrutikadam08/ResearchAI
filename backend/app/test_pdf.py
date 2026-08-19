from app.services.pdf_service import extract_text_from_pdf

file_path="uploads/791fb874-dbc7-437d-8b6f-4f5f0f16d06f.pdf"

pages=extract_text_from_pdf(file_path)

print("Total pages:", len(pages))

for page in pages[:2]:
    print("\n---Page", page["page_number"], "---")
    print(page["text"][:1000])