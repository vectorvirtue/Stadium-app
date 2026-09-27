import hashlib
import hmac
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import Order, OrderStatus, Ticket, User
from app.schemas import OrderOut
from app.services import paystack
from app.services.orders import release_order_seats

router = APIRouter(prefix="/payments", tags=["payments"])


def _issue_tickets_for_order(db: Session, order: Order) -> None:
    """
    One Ticket row per seat purchased (OrderItem.quantity each). Safe to
    call more than once for the same order — it's only ever invoked right
    after the order flips from pending -> paid, and that transition only
    happens once (see the guard in _mark_order_from_paystack_status).
    """
    holder_name = f"{order.user.first_name} {order.user.last_name}".strip() if order.user else "Ticket holder"

    for item in order.items:
        for _ in range(item.quantity):
            db.add(
                Ticket(
                    order_id=order.id,
                    order_item_id=item.id,
                    match_id=order.match_id,
                    seat_type_id=item.seat_type_id,
                    user_id=order.user_id,
                    ticket_code=f"TCKT-{uuid.uuid4().hex[:10].upper()}",
                    holder_name=holder_name,
                )
            )


def _mark_order_from_paystack_status(db: Session, order: Order, paystack_status: str) -> None:
    if order.status != OrderStatus.pending:
        return  # already resolved (avoid double-processing)

    if paystack_status == "success":
        order.status = OrderStatus.paid
        order.paid_at = datetime.utcnow()
        _issue_tickets_for_order(db, order)
    else:
        order.status = OrderStatus.failed
        release_order_seats(db, order)

    db.commit()


@router.get("/verify/{reference}", response_model=OrderOut)
def verify_payment(
    reference: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Call this after the user returns from the Paystack checkout page
    (or is redirected back) to confirm the payment and update the order.
    """
    order = (
        db.query(Order)
        .options(joinedload(Order.items))
        .filter(Order.paystack_reference == reference, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status == OrderStatus.pending:
        try:
            data = paystack.verify_transaction(reference)
        except paystack.PaystackError as exc:
            raise HTTPException(status_code=502, detail=f"Could not verify payment: {exc}") from exc

        _mark_order_from_paystack_status(db, order, data.get("status"))
        db.refresh(order)

    return order


@router.post("/webhook")
async def paystack_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Configure this URL in the Paystack dashboard under Settings -> API Keys
    & Webhooks. Paystack signs every request with your secret key so it
    can be trusted even though it's unauthenticated from a user's point
    of view — the signature check below is what makes that safe.
    """
    raw_body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")

    expected_signature = hmac.new(
        settings.paystack_secret_key.encode("utf-8"), raw_body, hashlib.sha512
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    event = await request.json()
    if event.get("event") == "charge.success":
        reference = event["data"]["reference"]
        order = (
            db.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.paystack_reference == reference)
            .first()
        )
        if order:
            _mark_order_from_paystack_status(db, order, "success")

    return {"received": True}
