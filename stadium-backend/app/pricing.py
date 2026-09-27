from decimal import Decimal

# Kept in sync with the SERVICE_FEE / VAT_RATE constants in
# src/components/Matches.jsx on the frontend. The backend is the source
# of truth for money — never trust a total the client sends.
SERVICE_FEE = Decimal("850")
VAT_RATE = Decimal("0.075")


def compute_totals(tickets_subtotal: Decimal) -> dict:
    subtotal_with_fee = tickets_subtotal + SERVICE_FEE
    vat_amount = (subtotal_with_fee * VAT_RATE).quantize(Decimal("0.01"))
    total_amount = subtotal_with_fee + vat_amount
    return {
        "tickets_subtotal": tickets_subtotal,
        "service_fee": SERVICE_FEE,
        "vat_amount": vat_amount,
        "total_amount": total_amount,
    }
