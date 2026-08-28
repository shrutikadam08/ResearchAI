from logging.config import fileConfig
import os

from dotenv import load_dotenv

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.database.base import Base

# ============================================================
# IMPORT ALL SQLALCHEMY MODELS
# ============================================================
#
# These imports make sure Alembic knows about every table/model
# that belongs to the application's metadata.
#
# IMPORTANT:
# ProjectPaper is the new association model that connects
# Projects with Saved Papers.
# ============================================================

from app.models.user import User
from app.models.project import Project
from app.models.document import Document
from app.models.saved_paper import SavedPaper
from app.models.project_paper import ProjectPaper


# ============================================================
# LOAD ENVIRONMENT VARIABLES
# ============================================================

load_dotenv()


# ============================================================
# DATABASE URL
# ============================================================

DATABASE_URL = os.getenv(
    "DATABASE_URL"
)


if not DATABASE_URL:

    raise ValueError(
        "DATABASE_URL not found in .env file"
    )


# ============================================================
# ALEMBIC CONFIGURATION
# ============================================================

config = context.config


if (
    config.config_file_name
    is not None
):

    fileConfig(
        config.config_file_name
    )


# ============================================================
# ALEMBIC METADATA
# ============================================================

target_metadata = Base.metadata


# ============================================================
# OFFLINE MIGRATIONS
# ============================================================

def run_migrations_offline() -> None:

    url = DATABASE_URL


    context.configure(

        url=url,

        target_metadata=
            target_metadata,

        literal_binds=True,

        dialect_opts={
            "paramstyle":
                "named"
        },

    )


    with context.begin_transaction():

        context.run_migrations()


# ============================================================
# ONLINE MIGRATIONS
# ============================================================

def run_migrations_online() -> None:

    configuration = (
        config.get_section(
            config.config_ini_section
        )
    )


    if configuration is None:

        configuration = {}


    configuration[
        "sqlalchemy.url"
    ] = DATABASE_URL


    connectable = (
        engine_from_config(

            configuration,

            prefix="sqlalchemy.",

            poolclass=
                pool.NullPool,

        )
    )


    with connectable.connect() as connection:

        context.configure(

            connection=connection,

            target_metadata=
                target_metadata,

        )


        with context.begin_transaction():

            context.run_migrations()


# ============================================================
# RUN
# ============================================================

if context.is_offline_mode():

    run_migrations_offline()

else:

    run_migrations_online()