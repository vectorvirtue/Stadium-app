from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ---------- Auth / Users ----------

class UserCreate(BaseModel):
    first_name: str
    last_name: str
    phone_number: str = Field(min_length=7, max_length=15)
    email: EmailStr
    password: str = Field(min_length=8)
    confirm_password: str

    def passwords_match(self) -> bool:
        return self.password == self.confirm_password


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    first_name: str
    last_name: str
    phone_number: str
    email: EmailStr
    role: str
    wallet_balance: Decimal
    created_at: datetime


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8)


class Token(BaseModel):
    """Kept for backward-compat API shape, but login/signup no longer
    populate access_token in the response body — the token now travels
    only as an httpOnly cookie (see app/cookies.py). Returning it in the
    JSON body too would defeat the point: any XSS that can read a fetch
    response could steal it exactly like it could steal localStorage."""

    user: UserOut


# ---------- Matches / Seats ----------

class SeatTypeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    key: str
    label: str
    description: Optional[str] = None
    price: Decimal
    quantity_left: int


class SeatTypeCreate(BaseModel):
    key: str
    label: str
    description: Optional[str] = None
    price: Decimal
    capacity: int = Field(gt=0)


class MatchOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    venue: str
    kickoff_at: datetime
    banner_image_url: Optional[str] = None
    is_sold_out: bool
    lowest_price: Optional[Decimal] = None


class MatchDetailOut(MatchOut):
    seat_types: list[SeatTypeOut] = []


class MatchCreate(BaseModel):
    title: str
    venue: str
    kickoff_at: datetime
    banner_image_url: Optional[str] = None
    seat_types: list[SeatTypeCreate] = []


class MatchUpdate(BaseModel):
    title: Optional[str] = None
    venue: Optional[str] = None
    kickoff_at: Optional[datetime] = None
    banner_image_url: Optional[str] = None
    is_published: Optional[bool] = None


# ---------- Orders / Checkout ----------

class OrderItemIn(BaseModel):
    seat_type_id: str
    quantity: int = Field(gt=0)


class CheckoutRequest(BaseModel):
    match_id: str
    items: list[OrderItemIn] = Field(min_length=1)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    seat_type_id: str
    label: str
    quantity: int
    unit_price: Decimal


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    match_id: str
    status: str
    tickets_subtotal: Decimal
    service_fee: Decimal
    vat_amount: Decimal
    total_amount: Decimal
    paystack_reference: str
    created_at: datetime
    paid_at: Optional[datetime] = None


class CheckoutResponse(BaseModel):
    order: OrderOut
    authorization_url: str
    access_code: str
    reference: str


# ---------- Wallet ----------

class WalletTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    type: str
    amount: Decimal
    reason: Optional[str] = None
    created_at: datetime


class WalletOut(BaseModel):
    balance: Decimal
    transactions: list[WalletTransactionOut]


# ---------- Tickets (individual, scannable) ----------

class TicketOut(BaseModel):
    id: str
    ticket_code: str
    holder_name: str
    status: str
    issued_at: datetime
    checked_in_at: Optional[datetime] = None
    seat_type_id: str
    seat_label: str
    match_id: str
    match_title: str
    match_venue: str
    kickoff_at: datetime
    reference: str


# ---------- Admin: matches / dashboard ----------

class AdminSeatTypeStat(BaseModel):
    id: str
    key: str
    label: str
    price: Decimal
    capacity: int
    quantity_sold: int
    quantity_left: int


class AdminMatchOut(BaseModel):
    id: str
    title: str
    venue: str
    kickoff_at: datetime
    is_published: bool
    capacity: int
    tickets_sold: int
    revenue: Decimal
    seat_types: list[AdminSeatTypeStat] = []


class AdminDashboardSummary(BaseModel):
    up_next: Optional[AdminMatchOut] = None
    total_sold_tickets: int
    total_capacity: int
    revenue: Decimal
    checked_in: int
    denied_entries: int


class SalesByCategoryOut(BaseModel):
    name: str
    sold: int
    capacity: int


class AdminTicketSaleOut(BaseModel):
    id: str
    ticket_code: str
    holder_name: str
    category: str
    payment: Decimal
    status: str


class GateStatOut(BaseModel):
    gate: str
    granted: int
    denied: int


class AttendanceLogOut(BaseModel):
    id: str
    ticket_code: str
    holder_name: Optional[str] = None
    category: Optional[str] = None
    gate: str
    result: str
    reason: Optional[str] = None
    created_at: datetime


class AttendanceOut(BaseModel):
    gates: list[GateStatOut]
    logs: list[AttendanceLogOut]


class GateCheckInRequest(BaseModel):
    ticket_code: str
    gate: str


class GateCheckInResponse(BaseModel):
    result: str
    reason: Optional[str] = None
    ticket: Optional[TicketOut] = None
