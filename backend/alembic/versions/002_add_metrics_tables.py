"""Add metrics tables

Revision ID: 002_add_metrics_tables
Revises: 8a9c1b2d3e4f
Create Date: 2026-07-08

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "002_add_metrics_tables"
down_revision: Union[str, None] = "8a9c1b2d3e4f"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. user_sessions
    op.create_table(
        "user_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(255), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("login_at", sa.TIMESTAMP(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_user_sessions_user_id", "user_sessions", ["user_id"])
    op.create_index("ix_user_sessions_login_at", "user_sessions", ["login_at"])

    # 2. referral_sources
    op.create_table(
        "referral_sources",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(255), nullable=False, unique=True),
        sa.Column("source", sa.String(50), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_referral_sources_user_id", "referral_sources", ["user_id"])

    # 3. activity_events
    op.create_table(
        "activity_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", sa.String(255), nullable=True),
        sa.Column("role", sa.String(20), nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("page_name", sa.String(100), nullable=True),
        sa.Column("event_metadata", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_activity_events_user_id", "activity_events", ["user_id"])
    op.create_index("ix_activity_events_event_type", "activity_events", ["event_type"])
    op.create_index("ix_activity_events_created_at", "activity_events", ["created_at"])

    # 4. platform_revenues
    op.create_table(
        "platform_revenues",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), nullable=False, unique=True),
        sa.Column("tech_id", sa.String(255), nullable=False),
        sa.Column("client_id", sa.String(255), nullable=False),
        sa.Column("service_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("commission_rate", sa.Numeric(5, 4), nullable=False, server_default="0.1500"),
        sa.Column("commission_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_platform_revenues_tech_id", "platform_revenues", ["tech_id"])
    op.create_index("ix_platform_revenues_client_id", "platform_revenues", ["client_id"])

    # 5. Agregar referral_source a users
    op.add_column("users", sa.Column("referral_source", sa.String(50), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "referral_source")
    op.drop_index("ix_platform_revenues_client_id", table_name="platform_revenues")
    op.drop_index("ix_platform_revenues_tech_id", table_name="platform_revenues")
    op.drop_table("platform_revenues")
    op.drop_index("ix_activity_events_created_at", table_name="activity_events")
    op.drop_index("ix_activity_events_event_type", table_name="activity_events")
    op.drop_index("ix_activity_events_user_id", table_name="activity_events")
    op.drop_table("activity_events")
    op.drop_index("ix_referral_sources_user_id", table_name="referral_sources")
    op.drop_table("referral_sources")
    op.drop_index("ix_user_sessions_login_at", table_name="user_sessions")
    op.drop_index("ix_user_sessions_user_id", table_name="user_sessions")
    op.drop_table("user_sessions")
