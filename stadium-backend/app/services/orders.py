"""
Order lifecycle helpers shared between the checkout/cancel endpoints
(app/routers/tickets.py) and the pending-order expiry job (app/jobs.py).

Pulled out into its own module so both call sites share exactly one
implementation of "give reserved seats back to the pool" instead of
drifting apart, and so the expiry job doesn't need to import from the
router module (which would pull in FastAPI's routing machinery for no
reason and risk a circular import).
"""

from sqlalchemy.orm import Session

from app.models import Order, SeatType


def release_order_seats(db: Session, order: Order) -> None:
    """Give reserved seats back to the pool for a failed/cancelled/expired order."""
    for item in order.items:
        seat_type = (
            db.query(SeatType)
            .filter(SeatType.id == item.seat_type_id)
            .with_for_update()
            .first()
        )
        if seat_type:
            seat_type.quantity_sold = max(seat_type.quantity_sold - item.quantity, 0)
