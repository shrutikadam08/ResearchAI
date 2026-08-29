from typing import Sequence, Union

from alembic import op


revision: str = "7a91c4e2d613"

down_revision: Union[
    str,
    Sequence[str],
    None
] = "1bf68a745102"

branch_labels: Union[
    str,
    Sequence[str],
    None
] = None

depends_on: Union[
    str,
    Sequence[str],
    None
] = None


def upgrade() -> None:

    op.execute(
        """
        CREATE TABLE IF NOT EXISTS document_chunks (
            id BIGSERIAL PRIMARY KEY,
            project_id INTEGER NOT NULL,
            document_id INTEGER NOT NULL,
            page_number INTEGER NOT NULL,
            content TEXT NOT NULL,
            embedding vector(768) NOT NULL
        )
        """
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS
        document_chunks_project_id_idx
        ON document_chunks (project_id)
        """
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS
        document_chunks_document_id_idx
        ON document_chunks (document_id)
        """
    )

    op.execute(
        """
        CREATE INDEX IF NOT EXISTS
        document_chunks_embedding_idx
        ON document_chunks
        USING ivfflat
        (embedding vector_cosine_ops)
        WITH (lists = 100)
        """
    )


def downgrade() -> None:

    op.execute(
        """
        DROP INDEX IF EXISTS
        document_chunks_embedding_idx
        """
    )

    op.execute(
        """
        DROP INDEX IF EXISTS
        document_chunks_document_id_idx
        """
    )

    op.execute(
        """
        DROP INDEX IF EXISTS
        document_chunks_project_id_idx
        """
    )

    op.execute(
        """
        DROP TABLE IF EXISTS document_chunks
        """
    )
