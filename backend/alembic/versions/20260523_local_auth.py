"""local email/password auth

Revision ID: 20260523_local_auth
Revises: 20260519_facebook
Create Date: 2026-05-23

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260523_local_auth"
down_revision: Union[str, None] = "20260519_facebook"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("password_hash", sa.String(length=255), nullable=True))
    op.alter_column("users", "clerk_user_id", existing_type=sa.String(length=255), nullable=True)
    op.create_index(
        "ix_users_email_unique",
        "users",
        ["email"],
        unique=True,
        postgresql_where=sa.text("email IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("ix_users_email_unique", table_name="users")
    op.alter_column("users", "clerk_user_id", existing_type=sa.String(length=255), nullable=False)
    op.drop_column("users", "password_hash")
