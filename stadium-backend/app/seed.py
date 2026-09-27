"""
Populates the database with data matching the mock MATCHES/SEAT_TYPES
arrays that were hardcoded in src/components/Matches.jsx, plus one
admin account for testing the /admin endpoints.

Run with:  python -m app.seed
"""

import uuid
from datetime import datetime

from app.database import Base, SessionLocal, engine
from app.models import (
    AttendanceLog,
    AttendanceResult,
    Match,
    Order,
    OrderItem,
    OrderStatus,
    SeatType,
    Ticket,
    TicketStatus,
    User,
    UserRole,
)
from app.pricing import compute_totals
from app.security import hash_password

SEAT_TEMPLATE = [
    {"key": "vip", "label": "VIP SEATS", "description": "Covered stand", "price": 25000, "capacity": 212},
    {"key": "premium", "label": "PREMIUM SEATS", "description": "Side stand", "price": 12000, "capacity": 640},
    {"key": "regular", "label": "Regular", "description": "General terraces", "price": 5000, "capacity": 3100},
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Match).count() == 0:
            for _ in range(4):
                match = Match(
                    title="Kano Pillars vs Warri Wolves",
                    venue="Abuja National Stadium",
                    kickoff_at=datetime(2026, 11, 14, 14, 0),
                )
                match.seat_types = [SeatType(**seat) for seat in SEAT_TEMPLATE]
                db.add(match)
            db.commit()
            print("Seeded 4 sample matches with seat types.")
        else:
            print("Matches already exist, skipping match seed.")

        admin_email = "admin@stadiumapp-admin.com"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            admin = User(
                first_name="Admin",
                last_name="User",
                phone_number="08000000000",
                email=admin_email,
                password_hash=hash_password("ChangeMe123!"),
                role=UserRole.admin,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"Seeded admin user: {admin_email} / ChangeMe123!  (change this password immediately)")
        else:
            print("Admin user already exists, skipping.")

        _seed_demo_sale_and_gate_activity(db, admin)
    finally:
        db.close()


def _seed_demo_sale_and_gate_activity(db, admin: User) -> None:
    """
    Gives the admin dashboard (Ticket Sales / Attendance / Gate / Sales by
    Category) something real to show on a fresh database: one paid order
    with issued tickets on the first match, a couple of them checked in.
    Safe to call repeatedly — it only runs once (keyed on a fixed reference).
    """
    demo_reference = "STD-DEMOSEED0001"
    if db.query(Order).filter(Order.paystack_reference == demo_reference).first():
        return

    match = db.query(Match).order_by(Match.created_at.asc()).first()
    if not match or not match.seat_types:
        return

    demo_email = "demo.fan@stadiumapp.example"
    demo_user = db.query(User).filter(User.email == demo_email).first()
    if not demo_user:
        demo_user = User(
            first_name="Demo",
            last_name="Fan",
            phone_number="08011111111",
            email=demo_email,
            password_hash=hash_password("ChangeMe123!"),
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

    vip = next((s for s in match.seat_types if s.key == "vip"), match.seat_types[0])
    regular = next((s for s in match.seat_types if s.key == "regular"), match.seat_types[-1])

    quantities = {vip.id: 2, regular.id: 3}
    tickets_subtotal = vip.price * 2 + regular.price * 3
    totals = compute_totals(tickets_subtotal)

    order = Order(
        user_id=demo_user.id,
        match_id=match.id,
        status=OrderStatus.paid,
        paystack_reference=demo_reference,
        paid_at=datetime.utcnow(),
        items=[
            OrderItem(seat_type_id=vip.id, quantity=2, unit_price=vip.price),
            OrderItem(seat_type_id=regular.id, quantity=3, unit_price=regular.price),
        ],
        **totals,
    )
    db.add(order)
    for seat_type, qty in quantities.items():
        st = db.query(SeatType).filter(SeatType.id == seat_type).first()
        st.quantity_sold += qty
    db.commit()
    db.refresh(order)

    tickets: list[Ticket] = []
    for item in order.items:
        for _ in range(item.quantity):
            t = Ticket(
                order_id=order.id,
                order_item_id=item.id,
                match_id=match.id,
                seat_type_id=item.seat_type_id,
                user_id=demo_user.id,
                ticket_code=f"TCKT-{uuid.uuid4().hex[:10].upper()}",
                holder_name="Demo Fan",
            )
            db.add(t)
            tickets.append(t)
    db.commit()

    # Check two of them in at Gate 1, deny a made-up code at Gate 2.
    for t in tickets[:2]:
        db.refresh(t)
        t.status = TicketStatus.checked_in
        t.checked_in_at = datetime.utcnow()
        db.add(AttendanceLog(ticket_id=t.id, match_id=match.id, gate="Gate 1", scanned_code=t.ticket_code, result=AttendanceResult.granted))
    db.add(AttendanceLog(ticket_id=None, match_id=match.id, gate="Gate 2", scanned_code="TCKT-INVALID000", result=AttendanceResult.denied, reason="Ticket not found"))
    db.commit()
    print("Seeded a demo paid order with tickets and gate-scan activity for the admin dashboard.")


if __name__ == "__main__":
    run()
