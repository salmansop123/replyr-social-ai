"""Facebook integration fields

Revision ID: 20260519_facebook
Revises: 20260518_knowledge
Create Date: 2026-05-19

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260519_facebook"
down_revision: Union[str, None] = "20260518_knowledge"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "social_accounts",
        sa.Column("last_webhook_received_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "conversations",
        sa.Column("facebook_thread_type", sa.String(length=16), nullable=True),
    )
    op.add_column(
        "conversations",
        sa.Column("facebook_post_id", sa.String(length=255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("conversations", "facebook_post_id")
    op.drop_column("conversations", "facebook_thread_type")
    op.drop_column("social_accounts", "last_webhook_received_at")
