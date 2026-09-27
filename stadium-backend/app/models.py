import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"


class OrderStatus(str, enum.Enum):
    pending = "pending"      # order created, payment not confirmed yet
    paid = "paid"            # Paystack verified the payment
    failed = "failed"        # payment attempt failed
    cancelled = "cancelled"  # abandoned / expired before payment


class WalletTransactionType(str, enum.Enum):
    credit = "credit"
    debit = "debit"


class TicketStatus(str, enum.Enum):
    issued = "issued"        # paid for, not yet scanned at the gate
    checked_in = "checked_in"  # scanned and admitted
    void = "void"             # cancelled/refunded, no longer valid


class AttendanceResult(str, enum.Enum):
    granted = "granted"
    denied = "denied"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.user)
    wallet_balance = Column(Numeric(12, 2), nullable=False, default=0)
    # Bumped on logout and on password change. Every access token embeds
    # the token_version it was issued under; get_current_user rejects a
    # token whose version no longer matches the user's current one. This
    # is the revocation mechanism — cheaper than a growing denylist table
    # (nothing to clean up) at the cost of revoking *all* of a user's
    # sessions at once rather than just one. Fine for this app, which
    # only ever issues one token per login anyway.
    token_version = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    orders = relationship("Order", back_populates="user")
    wallet_transactions = relationship("WalletTransaction", back_populates="user")


class Match(Base):
    __tablename__ = "matches"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    title = Column(String(255), nullable=False)          # e.g. "Kano Pillars vs Warri Wolves"
    venue = Column(String(255), nullable=False)           # e.g. "Abuja National Stadium"
    kickoff_at = Column(DateTime, nullable=False)
    banner_image_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    seat_types = relationship(
        "SeatType",
        back_populates="match",
        cascade="all, delete-orphan",
        order_by="SeatType.price.desc()",  # VIP (highest price) first, matching the original UI order
    )
    orders = relationship("Order", back_populates="match")

    @property
    def is_sold_out(self) -> bool:
        return len(self.seat_types) > 0 and all(s.quantity_left <= 0 for s in self.seat_types)

    @property
    def lowest_price(self):
        prices = [s.price for s in self.seat_types]
        return min(prices) if prices else None


class SeatType(Base):
    """
    A ticket tier for a specific match, e.g. VIP / Premium / Regular.
    """

    __tablename__ = "seat_types"
    __table_args__ = (UniqueConstraint("match_id", "key", name="uq_seat_type_per_match"),)

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    match_id = Column(UUID(as_uuid=False), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False)
    key = Column(String(50), nullable=False)       # "vip" | "premium" | "regular" | custom
    label = Column(String(100), nullable=False)    # "VIP SEATS"
    description = Column(String(255), nullable=True)  # "Covered stand"
    price = Column(Numeric(12, 2), nullable=False)
    capacity = Column(Integer, nullable=False)
    quantity_sold = Column(Integer, nullable=False, default=0)

    match = relationship("Match", back_populates="seat_types")
    order_items = relationship("OrderItem", back_populates="seat_type")

    @property
    def quantity_left(self) -> int:
        return max(self.capacity - self.quantity_sold, 0)


class Order(Base):
    """
    One checkout = one order, holding one or more seat-type line items.
    Money fields are snapshotted at creation time so historical orders
    never change even if match prices are edited later.
    """

    __tablename__ = "orders"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    match_id = Column(UUID(as_uuid=False), ForeignKey("matches.id"), nullable=False)

    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.pending)

    tickets_subtotal = Column(Numeric(12, 2), nullable=False)
    service_fee = Column(Numeric(12, 2), nullable=False)
    vat_amount = Column(Numeric(12, 2), nullable=False)
    total_amount = Column(Numeric(12, 2), nullable=False)

    paystack_reference = Column(String(100), nullable=False, unique=True, index=True)
    paystack_authorization_url = Column(String(500), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="orders")
    match = relationship("Match", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    order_id = Column(UUID(as_uuid=False), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    seat_type_id = Column(UUID(as_uuid=False), ForeignKey("seat_types.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(12, 2), nullable=False)  # snapshot of SeatType.price at purchase time

    order = relationship("Order", back_populates="items")
    seat_type = relationship("SeatType", back_populates="order_items")
    tickets = relationship("Ticket", back_populates="order_item", cascade="all, delete-orphan")


class Ticket(Base):
    """
    One individual, scannable ticket. Issued per-seat once an order's
    payment is confirmed (one Ticket row per unit of OrderItem.quantity).
    This is what the Wallet tab shows and what the gate scanner checks in.
    """

    __tablename__ = "tickets"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    order_id = Column(UUID(as_uuid=False), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    order_item_id = Column(UUID(as_uuid=False), ForeignKey("order_items.id", ondelete="CASCADE"), nullable=False)
    match_id = Column(UUID(as_uuid=False), ForeignKey("matches.id"), nullable=False)
    seat_type_id = Column(UUID(as_uuid=False), ForeignKey("seat_types.id"), nullable=False)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)

    ticket_code = Column(String(40), nullable=False, unique=True, index=True)
    holder_name = Column(String(200), nullable=False)
    status = Column(Enum(TicketStatus), nullable=False, default=TicketStatus.issued)

    issued_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    checked_in_at = Column(DateTime, nullable=True)

    order = relationship("Order", back_populates="tickets")
    order_item = relationship("OrderItem", back_populates="tickets")
    match = relationship("Match")
    seat_type = relationship("SeatType")
    user = relationship("User")
    attendance_logs = relationship("AttendanceLog", back_populates="ticket", cascade="all, delete-orphan")


class AttendanceLog(Base):
    """
    One gate-scan attempt. Kept even for denied/unrecognised codes so the
    admin Attendance/Gate screen has a full audit trail.
    """

    __tablename__ = "attendance_logs"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    ticket_id = Column(UUID(as_uuid=False), ForeignKey("tickets.id", ondelete="CASCADE"), nullable=True)
    match_id = Column(UUID(as_uuid=False), ForeignKey("matches.id"), nullable=True)
    gate = Column(String(50), nullable=False)
    scanned_code = Column(String(40), nullable=False)
    result = Column(Enum(AttendanceResult), nullable=False)
    reason = Column(String(255), nullable=True)
    scanned_by_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    ticket = relationship("Ticket", back_populates="attendance_logs")
    match = relationship("Match")
    scanned_by = relationship("User")


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    user_id = Column(UUID(as_uuid=False), ForeignKey("users.id"), nullable=False)
    type = Column(Enum(WalletTransactionType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="wallet_transactions")
