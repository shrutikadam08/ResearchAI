import pymupdf

from app.database.session import SessionLocal
from app.models.document import Document
from app.services.metadata_service import extract_metadata

db=SessionLocal()

try:
    document=db.query(Document).filter(
        Document.id==1
    ).first()

    if not document:
        print("Document not found.")
    else:
        print("Processing:", document.original_filename)

        pdf=pymupdf.open(
            document.file_path
        )

        if len(pdf)==0:
            print("PDF has no pages.")
        else:

            first_page_text=pdf[0].get_text()

            metadata=extract_metadata(
                first_page_text 
            )

            document.title=metadata["title"]
            document.authors=metadata["authors"]
            document.publication_year=metadata["publication_year"]
            document.journal=metadata["journal"]

            db.commit()
            db.refresh(document)

            print("\n================UPDATED METADATA===============")

            print("Title:")
            print(document.title)

            print("\nAuthors:")
            print(document.authors)

            print("\nPublication Year:")
            print(document.publication_year)

            print("\nJournal:")
            print(document.journal)

        pdf.close()
        
finally:
    db.close()