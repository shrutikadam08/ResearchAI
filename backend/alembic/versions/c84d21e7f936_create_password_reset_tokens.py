from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c84d21e7f936"

down_revision: Union[
    str,
    Sequence[str],
    None
] = "7a91c4e2d613"

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

    op.create_table(
        "password_reset_tokens",

        sa.Column(
            "id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "user_id",
            sa.Integer(),
            nullable=False
        ),

        sa.Column(
            "token",
            sa.String(length=255),
            nullable=False
        ),

        sa.Column(
            "expires_at",
            sa.DateTime(),
            nullable=False
        ),

        sa.Column(
            "used",
            sa.Boolean(),
            nullable=False
        ),

        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False
        ),

        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE"
        ),

        sa.PrimaryKeyConstraint("id"),

        sa.UniqueConstraint("token")
    )

    op.create_index(
        "ix_password_reset_tokens_id",
        "password_reset_tokens",
        ["id"],
        unique=False
    )

    op.create_index(
        "ix_password_reset_tokens_user_id",
        "password_reset_tokens",
        ["user_id"],
        unique=False
    )

    op.create_index(
        "ix_password_reset_tokens_token",
        "password_reset_tokens",
        ["token"],
        unique=False
    )


def downgrade() -> None:

    op.drop_index(
        "ix_password_reset_tokens_token",
        table_name="password_reset_tokens"
    )

    op.drop_index(
        "ix_password_reset_tokens_user_id",
        table_name="password_reset_tokens"
    )

    op.drop_index(
        "ix_password_reset_tokens_id",
        table_name="password_reset_tokens"
    )

    op.drop_table(
        "password_reset_tokens"
    )