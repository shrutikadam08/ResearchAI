"""add saved paper relationship to documents

Revision ID: b0c9cd40c675
Revises: c84d21e7f936
Create Date: 2026-08-31 15:07:34.957986

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b0c9cd40c675"
down_revision: Union[str, Sequence[str], None] = "c84d21e7f936"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add saved_paper_id to documents."""

    op.add_column(
        "documents",
        sa.Column(
            "saved_paper_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_documents_saved_paper_id",
        "documents",
        ["saved_paper_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_documents_saved_paper_id",
        "documents",
        "saved_papers",
        ["saved_paper_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    """Remove saved_paper_id from documents if it exists."""

    op.execute(
        """
        ALTER TABLE documents
        DROP CONSTRAINT IF EXISTS fk_documents_saved_paper_id
        """
    )

    op.execute(
        """
        DROP INDEX IF EXISTS ix_documents_saved_paper_id
        """
    )

    op.execute(
        """
        ALTER TABLE documents
        DROP COLUMN IF EXISTS saved_paper_id
        """
    )