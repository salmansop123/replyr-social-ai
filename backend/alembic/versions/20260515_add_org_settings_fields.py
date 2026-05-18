"""add_org_settings_fields

Revision ID: 20260515_org_settings
Revises: 20260513_0001
Create Date: 2026-05-15

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260515_org_settings"
down_revision: Union[str, None] = "20260513_0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "organizations",
        sa.Column("auto_reply_enabled", sa.Boolean(), nullable=False, server_default="true"),
    )
    op.add_column(
        "organizations",
        sa.Column(
            "escalation_keywords",
            postgresql.ARRAY(sa.String(length=80)),
            nullable=False,
            server_default=sa.text("ARRAY[]::varchar[]"),
        ),
    )
    op.add_column(
        "organizations",
        sa.Column("business_hours_enabled", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "organizations",
        sa.Column("business_hours_start", sa.String(length=8), nullable=False, server_default="09:00"),
    )
    op.add_column(
        "organizations",
        sa.Column("business_hours_end", sa.String(length=8), nullable=False, server_default="18:00"),
    )
    op.add_column(
        "organizations",
        sa.Column("business_hours_timezone", sa.String(length=64), nullable=False, server_default="UTC"),
    )
    op.add_column(
        "organizations",
        sa.Column("outside_hours_message", sa.Text(), nullable=True),
    )
    op.alter_column("organizations", "auto_reply_enabled", server_default=None)
    op.alter_column("organizations", "business_hours_enabled", server_default=None)
    op.alter_column("organizations", "business_hours_start", server_default=None)
    op.alter_column("organizations", "business_hours_end", server_default=None)
    op.alter_column("organizations", "business_hours_timezone", server_default=None)
    op.alter_column("organizations", "escalation_keywords", server_default=None)


def downgrade() -> None:
    op.drop_column("organizations", "outside_hours_message")
    op.drop_column("organizations", "business_hours_timezone")
    op.drop_column("organizations", "business_hours_end")
    op.drop_column("organizations", "business_hours_start")
    op.drop_column("organizations", "business_hours_enabled")
    op.drop_column("organizations", "escalation_keywords")
    op.drop_column("organizations", "auto_reply_enabled")
