import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Match, Order, OrderItem, OrderStatus, SeatType, Ticket, TicketStatus, User
from app.pricing import compute_totals
from app.schemas import CheckoutRequest, CheckoutResponse, OrderOut, TicketOut
from app.services import paystack
from app.services.orders import release_order_seats as _release_order_seats

router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post("/checkout", response_model=CheckoutResponse)
def checkout(
    payload: CheckoutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    match = db.query(Match).filter(Match.id == payload.match_id, Match.is_published.is_(True)).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    tickets_subtotal = 0
    order_items: list[OrderItem] = []

    # Lock the relevant seat_type rows for update so two simultaneous
    # checkouts can't both oversell the same seats.
    for item in payload.items:
        seat_type = (
            db.query(SeatType)
            .filter(SeatType.id == item.seat_type_id, SeatType.match_id == match.id)
            .with_for_update()
            .first()
        )
        if not seat_type:
            raise HTTPException(status_code=404, detail=f"Seat type {item.seat_type_id} not found for this match")

        if item.quantity > seat_type.quantity_left:
            raise HTTPException(
                status_code=409,
                detail=f"Only {seat_type.quantity_left} left for {seat_type.label}",
            )

        seat_type.quantity_sold += item.quantity  # reserve seats immediately
        tickets_subtotal += seat_type.price * item.quantity

        order_items.append(
            OrderItem(seat_type_id=seat_type.id, quantity=item.quantity, unit_price=seat_type.price)
        )

    totals = compute_totals(tickets_subtotal)
    reference = f"STD-{uuid.uuid4().hex[:16].upper()}"

    order = Order(
        user_id=current_user.id,
        match_id=match.id,
        status=OrderStatus.pending,
        paystack_reference=reference,
        items=order_items,
        **totals,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    try:
        paystack_data = paystack.initialize_transaction(
            email=current_user.email,
            amount_naira=order.total_amount,
            reference=order.paystack_reference,
            callback_url=f"{settings.frontend_url.rstrip('/')}/dashboard",
        )
    except paystack.PaystackError as exc:
        # Release the reserved seats since payment couldn't even be started.
        _release_order_seats(db, order)
        order.status = OrderStatus.failed
        db.commit()
        raise HTTPException(status_code=502, detail=f"Could not start payment: {exc}") from exc

    order.paystack_authorization_url = paystack_data["authorization_url"]
    db.commit()
    db.refresh(order)

    return CheckoutResponse(
        order=OrderOut.model_validate(order),
        authorization_url=paystack_data["authorization_url"],
        access_code=paystack_data["access_code"],
        reference=order.paystack_reference,
    )


@router.get("/wallet", response_model=list[TicketOut])
def my_wallet_tickets(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Every scannable ticket the current user holds (issued or already
    checked in), newest match first — this is what the Wallet tab shows.
    """
    tickets = (
        db.query(Ticket)
        .options(joinedload(Ticket.match), joinedload(Ticket.seat_type), joinedload(Ticket.order))
        .filter(Ticket.user_id == current_user.id, Ticket.status != TicketStatus.void)
        .join(Match, Ticket.match_id == Match.id)
        .order_by(Match.kickoff_at.asc())
        .all()
    )
    return [
        TicketOut(
            id=t.id,
            ticket_code=t.ticket_code,
            holder_name=t.holder_name,
            status=t.status.value,
            issued_at=t.issued_at,
            checked_in_at=t.checked_in_at,
            seat_type_id=t.seat_type_id,
            seat_label=t.seat_type.label if t.seat_type else "Ticket",
            match_id=t.match_id,
            match_title=t.match.title if t.match else "",
            match_venue=t.match.venue if t.match else "",
            kickoff_at=t.match.kickoff_at if t.match else t.issued_at,
            reference=t.order.paystack_reference if t.order else "",
        )
        for t in tickets
    ]


@router.get("", response_model=list[OrderOut])
def my_orders(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.post("/{order_id}/cancel", response_model=OrderOut)
def cancel_order(order_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status != OrderStatus.pending:
        raise HTTPException(status_code=400, detail="Only pending orders can be cancelled")

    _release_order_seats(db, order)
    order.status = OrderStatus.cancelled
    db.commit()
    db.refresh(order)
    return order


