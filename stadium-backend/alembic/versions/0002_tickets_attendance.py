"""tickets and attendance logs

Revision ID: 0002_tickets_attendance
Revises: 0001_initial
Create Date: 2026-09-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0002_tickets_attendance"
down_revision = "0001_initial"
branch_labels = None
depends_on = None

ticket_status = postgresql.ENUM("issued", "checked_in", "void", name="ticketstatus", create_type=False)
attendance_result = postgresql.ENUM("granted", "denied", name="attendanceresult", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    ticket_status.create(bind, checkfirst=True)
    attendance_result.create(bind, checkfirst=True)

    op.create_table(
        "tickets",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("order_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("orders.id", ondelete="CASCADE"), nullable=False),
        sa.Column("order_item_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False),
        sa.Column("match_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("seat_type_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("seat_types.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("ticket_code", sa.String(40), nullable=False),
        sa.Column("holder_name", sa.String(200), nullable=False),
        sa.Column("status", ticket_status, nullable=False, server_default="issued"),
        sa.Column("issued_at", sa.DateTime(), nullable=False),
        sa.Column("checked_in_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("ticket_code", name="uq_tickets_ticket_code"),
    )
    op.create_index("ix_tickets_ticket_code", "tickets", ["ticket_code"])
    op.create_index("ix_tickets_user_id", "tickets", ["user_id"])
    op.create_index("ix_tickets_match_id", "tickets", ["match_id"])

    op.create_table(
        "attendance_logs",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("ticket_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("tickets.id", ondelete="CASCADE"), nullable=True),
        sa.Column("match_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("matches.id"), nullable=True),
        sa.Column("gate", sa.String(50), nullable=False),
        sa.Column("scanned_code", sa.String(40), nullable=False),
        sa.Column("result", attendance_result, nullable=False),
        sa.Column("reason", sa.String(255), nullable=True),
        sa.Column("scanned_by_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_attendance_logs_match_id", "attendance_logs", ["match_id"])


def downgrade() -> None:
    op.drop_table("attendance_logs")
    op.drop_table("tickets")

    bind = op.get_bind()
    attendance_result.drop(bind, checkfirst=True)
    ticket_status.drop(bind, checkfirst=True)
