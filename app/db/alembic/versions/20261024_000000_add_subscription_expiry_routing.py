"""add operator-managed subscription expiry routing

Revision ID: 20261024_000000_add_subscription_expiry_routing
Revises: 20260816_000000_add_model_source_embeddings
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "20261024_000000_add_subscription_expiry_routing"
down_revision = "20260816_000000_add_model_source_embeddings"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("accounts"):
        columns = {column["name"] for column in inspector.get_columns("accounts")}
        if "subscription_expires_at" not in columns:
            with op.batch_alter_table("accounts") as batch_op:
                batch_op.add_column(sa.Column("subscription_expires_at", sa.DateTime(), nullable=True))
    if inspector.has_table("dashboard_settings"):
        columns = {column["name"] for column in inspector.get_columns("dashboard_settings")}
        with op.batch_alter_table("dashboard_settings") as batch_op:
            if "prefer_subscription_expiry_accounts" not in columns:
                batch_op.add_column(
                    sa.Column(
                        "prefer_subscription_expiry_accounts",
                        sa.Boolean(),
                        server_default=sa.false(),
                        nullable=False,
                    )
                )
            if "subscription_expiry_window_days" not in columns:
                batch_op.add_column(
                    sa.Column(
                        "subscription_expiry_window_days",
                        sa.Integer(),
                        server_default=sa.text("7"),
                        nullable=False,
                    )
                )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if inspector.has_table("dashboard_settings"):
        columns = {column["name"] for column in inspector.get_columns("dashboard_settings")}
        with op.batch_alter_table("dashboard_settings") as batch_op:
            if "subscription_expiry_window_days" in columns:
                batch_op.drop_column("subscription_expiry_window_days")
            if "prefer_subscription_expiry_accounts" in columns:
                batch_op.drop_column("prefer_subscription_expiry_accounts")
    if inspector.has_table("accounts") and "subscription_expires_at" in {
        column["name"] for column in inspector.get_columns("accounts")
    }:
        with op.batch_alter_table("accounts") as batch_op:
            batch_op.drop_column("subscription_expires_at")
