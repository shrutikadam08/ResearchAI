from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "7a91c4e2d613"
down_revision: Union[str, Sequence[str], None] = "1bf68a745102"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:

    op.create_table(
        "document_chunks",

        sa.Column(
            "id",
            sa.BigInteger(),
            autoincrement=True,
            nullable=False
        ),

        sa.Column(
            "project_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "document_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "page_number",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "content",
            sa.Text(),
            nullable=False
        ),

        sa.Column(
            "embedding",
            sa.Text(),
            nullable=False
        ),

        sa.PrimaryKeyConstraint("id")
    )

    op.execute(
        """
        ALTER TABLE document_chunks
        ALTER COLUMN embedding
        TYPE vector(768)
        USING embedding::vector
        """
    )

    op.create_index(
        "document_chunks_project_id_idx",
        "document_chunks",
        ["project_id"],
        unique=False
    )

    op.create_index(
        "document_chunks_document_id_idx",
        "document_chunks",
        ["document_id"],
        unique=False
    )

    op.execute(
        """
        CREATE INDEX document_chunks_embedding_idx
        ON document_chunks
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100)
        """
    )


def downgrade() -> None:

    op.drop_index(
        "document_chunks_embedding_idx",
        table_name="document_chunks"
    )

    op.drop_index(
        "document_chunks_document_id_idx",
        table_name="document_chunks"
    )

    op.drop_index(
        "document_chunks_project_id_idx",
        table_name="document_chunks"
    )

    op.drop_table("document_chunks")