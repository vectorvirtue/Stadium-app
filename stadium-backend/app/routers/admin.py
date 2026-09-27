from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_admin
from app.models import (
    AttendanceLog,
    AttendanceResult,
    Match,
    Order,
    OrderStatus,
    SeatType,
    Ticket,
    TicketStatus,
    User,
    WalletTransaction,
    WalletTransactionType,
)
from app.schemas import (
    AdminDashboardSummary,
    AdminMatchOut,
    AdminSeatTypeStat,
    AdminTicketSaleOut,
    AttendanceLogOut,
    AttendanceOut,
    GateCheckInRequest,
    GateCheckInResponse,
    GateStatOut,
    MatchCreate,
    MatchDetailOut,
    MatchUpdate,
    OrderOut,
    SalesByCategoryOut,
    TicketOut,
    UserOut,
)

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(get_current_admin)])


def _match_stats(db: Session, match: Match) -> AdminMatchOut:
    capacity = sum(s.capacity for s in match.seat_types)
    sold = sum(s.quantity_sold for s in match.seat_types)
    revenue = (
        db.query(func.coalesce(func.sum(Order.total_amount), 0))
        .filter(Order.match_id == match.id, Order.status == OrderStatus.paid)
        .scalar()
        or Decimal("0")
    )
    return AdminMatchOut(
        id=match.id,
        title=match.title,
        venue=match.venue,
        kickoff_at=match.kickoff_at,
        is_published=match.is_published,
        capacity=capacity,
        tickets_sold=sold,
        revenue=Decimal(revenue),
        seat_types=[
            AdminSeatTypeStat(
                id=s.id,
                key=s.key,
                label=s.label,
                price=s.price,
                capacity=s.capacity,
                quantity_sold=s.quantity_sold,
                quantity_left=s.quantity_left,
            )
            for s in match.seat_types
        ],
    )


# ---------- Matches ----------

@router.post("/matches", response_model=MatchDetailOut, status_code=201)
def create_match(payload: MatchCreate, db: Session = Depends(get_db)):
    match = Match(
        title=payload.title,
        venue=payload.venue,
        kickoff_at=payload.kickoff_at,
        banner_image_url=payload.banner_image_url,
    )
    match.seat_types = [
        SeatType(
            key=s.key,
            label=s.label,
            description=s.description,
            price=s.price,
            capacity=s.capacity,
        )
        for s in payload.seat_types
    ]
    db.add(match)
    db.commit()
    db.refresh(match)
    return match


@router.patch("/matches/{match_id}", response_model=MatchDetailOut)
def update_match(match_id: str, payload: MatchUpdate, db: Session = Depends(get_db)):
    match = db.query(Match).options(joinedload(Match.seat_types)).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(match, field, value)

    db.commit()
    db.refresh(match)
    return match


@router.delete("/matches/{match_id}", status_code=204)
def delete_match(match_id: str, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    db.delete(match)
    db.commit()


@router.get("/matches", response_model=list[AdminMatchOut])
def list_matches_admin(db: Session = Depends(get_db)):
    """Every match (published or not), with live sales/revenue stats — feeds Event Management."""
    matches = (
        db.query(Match)
        .options(joinedload(Match.seat_types))
        .order_by(Match.kickoff_at.asc())
        .all()
    )
    return [_match_stats(db, m) for m in matches]


def _resolve_focus_match(db: Session, match_id: str | None) -> Match | None:
    """The match a dashboard/analytics view should focus on: the one asked
    for, else the soonest upcoming published match, else the most recent."""
    query = db.query(Match).options(joinedload(Match.seat_types))
    if match_id:
        return query.filter(Match.id == match_id).first()

    upcoming = query.filter(Match.kickoff_at >= datetime.utcnow()).order_by(Match.kickoff_at.asc()).first()
    if upcoming:
        return upcoming
    return query.order_by(Match.kickoff_at.desc()).first()


@router.get("/dashboard/summary", response_model=AdminDashboardSummary)
def dashboard_summary(match_id: str | None = Query(default=None), db: Session = Depends(get_db)):
    match = _resolve_focus_match(db, match_id)
    if not match:
        return AdminDashboardSummary(
            up_next=None, total_sold_tickets=0, total_capacity=0, revenue=Decimal("0"), checked_in=0, denied_entries=0
        )

    stats = _match_stats(db, match)
    checked_in = (
        db.query(func.count(Ticket.id))
        .filter(Ticket.match_id == match.id, Ticket.status == TicketStatus.checked_in)
        .scalar()
        or 0
    )
    denied_entries = (
        db.query(func.count(AttendanceLog.id))
        .filter(AttendanceLog.match_id == match.id, AttendanceLog.result == AttendanceResult.denied)
        .scalar()
        or 0
    )
    return AdminDashboardSummary(
        up_next=stats,
        total_sold_tickets=stats.tickets_sold,
        total_capacity=stats.capacity,
        revenue=stats.revenue,
        checked_in=checked_in,
        denied_entries=denied_entries,
    )


@router.get("/matches/{match_id}/sales-by-category", response_model=list[SalesByCategoryOut])
def sales_by_category(match_id: str, db: Session = Depends(get_db)):
    match = db.query(Match).options(joinedload(Match.seat_types)).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return [SalesByCategoryOut(name=s.label, sold=s.quantity_sold, capacity=s.capacity) for s in match.seat_types]


# ---------- Ticket sales ----------

@router.get("/tickets", response_model=list[AdminTicketSaleOut])
def list_ticket_sales(match_id: str | None = Query(default=None), db: Session = Depends(get_db)):
    query = db.query(Ticket).options(joinedload(Ticket.seat_type), joinedload(Ticket.order))
    if match_id:
        query = query.filter(Ticket.match_id == match_id)
    tickets = query.order_by(Ticket.issued_at.desc()).all()
    return [
        AdminTicketSaleOut(
            id=t.id,
            ticket_code=t.ticket_code,
            holder_name=t.holder_name,
            category=t.seat_type.label if t.seat_type else "",
            payment=t.seat_type.price if t.seat_type else Decimal("0"),
            status=t.status.value,
        )
        for t in tickets
    ]


# ---------- Attendance / Gate ----------

@router.get("/attendance", response_model=AttendanceOut)
def attendance_overview(match_id: str | None = Query(default=None), db: Session = Depends(get_db)):
    log_query = db.query(AttendanceLog).options(joinedload(AttendanceLog.ticket).joinedload(Ticket.seat_type))
    if match_id:
        log_query = log_query.filter(AttendanceLog.match_id == match_id)
    logs = log_query.order_by(AttendanceLog.created_at.desc()).limit(200).all()

    gate_names = [g for (g,) in db.query(AttendanceLog.gate).filter(
        *([AttendanceLog.match_id == match_id] if match_id else [])
    ).distinct().all()]

    gates: list[GateStatOut] = []
    for gate in gate_names:
        base = db.query(AttendanceLog).filter(AttendanceLog.gate == gate)
        if match_id:
            base = base.filter(AttendanceLog.match_id == match_id)
        granted = base.filter(AttendanceLog.result == AttendanceResult.granted).count()
        denied = base.filter(AttendanceLog.result == AttendanceResult.denied).count()
        gates.append(GateStatOut(gate=gate, granted=granted, denied=denied))

    return AttendanceOut(
        gates=gates,
        logs=[
            AttendanceLogOut(
                id=log.id,
                ticket_code=log.scanned_code,
                holder_name=log.ticket.holder_name if log.ticket else None,
                category=log.ticket.seat_type.label if log.ticket and log.ticket.seat_type else None,
                gate=log.gate,
                result=log.result.value,
                reason=log.reason,
                created_at=log.created_at,
            )
            for log in logs
        ],
    )


@router.post("/gate/check-in", response_model=GateCheckInResponse)
def gate_check_in(payload: GateCheckInRequest, db: Session = Depends(get_db), admin: User = Depends(get_current_admin)):
    code = payload.ticket_code.strip().upper()
    ticket = (
        db.query(Ticket)
        .options(joinedload(Ticket.seat_type), joinedload(Ticket.match))
        .filter(Ticket.ticket_code == code)
        .with_for_update()
        .first()
    )

    if not ticket:
        db.add(AttendanceLog(gate=payload.gate, scanned_code=code, result=AttendanceResult.denied, reason="Ticket not found", scanned_by_id=admin.id))
        db.commit()
        return GateCheckInResponse(result="denied", reason="Ticket not found")

    if ticket.status == TicketStatus.checked_in:
        db.add(AttendanceLog(ticket_id=ticket.id, match_id=ticket.match_id, gate=payload.gate, scanned_code=code, result=AttendanceResult.denied, reason="Ticket already used", scanned_by_id=admin.id))
        db.commit()
        return GateCheckInResponse(result="denied", reason="Ticket already used")

    if ticket.status == TicketStatus.void:
        db.add(AttendanceLog(ticket_id=ticket.id, match_id=ticket.match_id, gate=payload.gate, scanned_code=code, result=AttendanceResult.denied, reason="Ticket void/cancelled", scanned_by_id=admin.id))
        db.commit()
        return GateCheckInResponse(result="denied", reason="Ticket void/cancelled")

    ticket.status = TicketStatus.checked_in
    ticket.checked_in_at = datetime.utcnow()
    db.add(AttendanceLog(ticket_id=ticket.id, match_id=ticket.match_id, gate=payload.gate, scanned_code=code, result=AttendanceResult.granted, scanned_by_id=admin.id))
    db.commit()
    db.refresh(ticket)

    return GateCheckInResponse(
        result="granted",
        ticket=TicketOut(
            id=ticket.id,
            ticket_code=ticket.ticket_code,
            holder_name=ticket.holder_name,
            status=ticket.status.value,
            issued_at=ticket.issued_at,
            checked_in_at=ticket.checked_in_at,
            seat_type_id=ticket.seat_type_id,
            seat_label=ticket.seat_type.label if ticket.seat_type else "Ticket",
            match_id=ticket.match_id,
            match_title=ticket.match.title if ticket.match else "",
            match_venue=ticket.match.venue if ticket.match else "",
            kickoff_at=ticket.match.kickoff_at if ticket.match else ticket.issued_at,
            reference=ticket.order.paystack_reference if ticket.order else "",
        ),
    )


# ---------- Users ----------

@router.get("/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).order_by(User.created_at.desc()).all()


# ---------- Orders ----------

@router.get("/orders", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return db.query(Order).order_by(Order.created_at.desc()).all()


# ---------- Wallet adjustments (e.g. manual refunds) ----------

class WalletAdjustment(BaseModel):
    user_id: str
    amount: Decimal = Field(gt=0)
    type: WalletTransactionType
    reason: str | None = None


@router.post("/wallet/adjust", response_model=UserOut)
def adjust_wallet(payload: WalletAdjustment, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == payload.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.type == WalletTransactionType.credit:
        user.wallet_balance += payload.amount
    else:
        if payload.amount > user.wallet_balance:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")
        user.wallet_balance -= payload.amount

    db.add(WalletTransaction(user_id=user.id, type=payload.type, amount=payload.amount, reason=payload.reason))
    db.commit()
    db.refresh(user)
    return user
