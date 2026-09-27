"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-09-21

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

user_role = postgresql.ENUM("user", "admin", name="userrole", create_type=False)
order_status = postgresql.ENUM("pending", "paid", "failed", "cancelled", name="orderstatus", create_type=False)
wallet_txn_type = postgresql.ENUM("credit", "debit", name="wallettransactiontype", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    user_role.create(bind, checkfirst=True)
    order_status.create(bind, checkfirst=True)
    wallet_txn_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("first_name", sa.String(100), nullable=False),
        sa.Column("last_name", sa.String(100), nullable=False),
        sa.Column("phone_number", sa.String(20), nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="user"),
        sa.Column("wallet_balance", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "matches",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("venue", sa.String(255), nullable=False),
        sa.Column("kickoff_at", sa.DateTime(), nullable=False),
        sa.Column("banner_image_url", sa.String(500), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

    op.create_table(
        "seat_types",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("match_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("matches.id", ondelete="CASCADE"), nullable=False),
        sa.Column("key", sa.String(50), nullable=False),
        sa.Column("label", sa.String(100), nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("price", sa.Numeric(12, 2), nullable=False),
        sa.Column("capacity", sa.Integer(), nullable=False),
        sa.Column("quantity_sold", sa.Integer(), nullable=False, server_default="0"),
        sa.UniqueConstraint("match_id", "key", name="uq_seat_type_per_match"),
    )

    op.create_table(
        "orders",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("match_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("status", order_status, nullable=False, server_default="pending"),
        sa.Column("tickets_subtotal", sa.Numeric(12, 2), nullable=False),
        sa.Column("service_fee", sa.Numeric(12, 2), nullable=False),
        sa.Column("vat_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("paystack_reference", sa.String(100), nullable=False),
        sa.Column("paystack_authorization_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("paid_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("paystack_reference", name="uq_orders_paystack_reference"),
    )
    op.create_index("ix_orders_paystack_reference", "orders", ["paystack_reference"])

    op.create_table(
        "order_items",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("seat_type_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("seat_types.id"), nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False),
    )

    op.create_table(
        "wallet_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", wallet_txn_type, nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("wallet_transactions")
    op.drop_table("order_items")
    op.drop_table("orders")
    op.drop_table("seat_types")
    op.drop_table("matches")
    op.drop_table("users")

    bind = op.get_bind()
    wallet_txn_type.drop(bind, checkfirst=True)
    order_status.drop(bind, checkfirst=True)
    user_role.drop(bind, checkfirst=True)
