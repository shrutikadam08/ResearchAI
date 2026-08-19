from pathlib import Path
import fitz

from app.services.metadata_service import extract_metadata

PDF_PATH=Path(
    r"C:\Users\shrut\OneDrive\Desktop\MRI_57_F.pdf"
)

document=fitz.open(PDF_PATH)

first_page_text=document[0].get_text()

document.close()

metadata=extract_metadata(
    first_page_text
)

print("\n==============EXTRACTED METADATA=============")

print("Title:")
print(metadata["title"])

print("\nAuthors:")
print(metadata["authors"])

print("\nPublication Year:")
print(metadata["publication_year"])

print("\nJournal:")
print(metadata["journal"])