"""
Background jobs. Currently just one: expire checkouts that were started
but never paid for, so the seats they reserved go back into the pool.

Without this, `POST /tickets/checkout` reserves seats the moment an
order is created (SeatType.quantity_sold += quantity) but nothing ever
reserves them back if the user closes the tab instead of paying or
cancelling — inventory quietly leaks away on a real event. This job
runs on a schedule and does what /tickets/{id}/cancel does, but for
every stale pending order instead of one the user asked for.
"""

import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session, joinedload

from app.config import settings
from app.database import SessionLocal
from app.models import Order, OrderStatus
from app.services.orders import release_order_seats

logger = logging.getLogger("app.jobs")


def expire_stale_pending_orders(db: Session | None = None) -> int:
    """
    Cancel every pending order older than settings.pending_order_expiry_minutes
    and release its seats. Returns the number of orders expired.

    Accepts an optional db session so tests/callers can pass one in;
    opens and closes its own when run standalone (e.g. from the scheduler).
    """
    owns_session = db is None
    db = db or SessionLocal()
    try:
        cutoff = datetime.utcnow() - timedelta(minutes=settings.pending_order_expiry_minutes)
        stale_orders = (
            db.query(Order)
            .options(joinedload(Order.items))
            .filter(Order.status == OrderStatus.pending, Order.created_at < cutoff)
            .all()
        )

        for order in stale_orders:
            release_order_seats(db, order)
            order.status = OrderStatus.cancelled

        if stale_orders:
            db.commit()
            logger.info("Expired %d stale pending order(s)", len(stale_orders))

        return len(stale_orders)
    except Exception:
        db.rollback()
        logger.exception("Failed to expire stale pending orders")
        return 0
    finally:
        if owns_session:
            db.close()


_scheduler: BackgroundScheduler | None = None


def start_scheduler() -> BackgroundScheduler:
    """Idempotent: calling this more than once just returns the existing scheduler."""
    global _scheduler
    if _scheduler is not None:
        return _scheduler

    scheduler = BackgroundScheduler(timezone="UTC")
    # Run at half the expiry window (min 1 minute) so a stale order is
    # never left sitting for much longer than the configured cutoff.
    interval_minutes = max(settings.pending_order_expiry_minutes // 2, 1)
    scheduler.add_job(
        expire_stale_pending_orders,
        trigger="interval",
        minutes=interval_minutes,
        id="expire_stale_pending_orders",
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()
    _scheduler = scheduler
    return scheduler


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        _scheduler.shutdown(wait=False)
        _scheduler = None
