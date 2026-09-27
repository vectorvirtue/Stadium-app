"""
Minimal Paystack client.

Docs: https://paystack.com/docs/api/transaction/

Amounts are sent to Paystack in kobo (i.e. naira * 100), and Paystack
returns amounts in kobo too, so every amount crossing this boundary is
converted at the edge.
"""

from decimal import Decimal

import httpx

from app.config import settings

PAYSTACK_BASE_URL = "https://api.paystack.co"


class PaystackError(Exception):
    def __init__(self, message: str, response_body: dict | None = None):
        super().__init__(message)
        self.response_body = response_body


def _headers() -> dict:
    return {
        "Authorization": f"Bearer {settings.paystack_secret_key}",
        "Content-Type": "application/json",
    }


def naira_to_kobo(amount: Decimal) -> int:
    return int(amount * 100)


def kobo_to_naira(amount_kobo: int) -> Decimal:
    return Decimal(amount_kobo) / Decimal(100)


def initialize_transaction(email: str, amount_naira: Decimal, reference: str, callback_url: str | None = None) -> dict:
    """
    Starts a Paystack transaction and returns the payload containing
    `authorization_url` (send the user here to pay) and `access_code`.
    """
    payload = {
        "email": email,
        "amount": naira_to_kobo(amount_naira),
        "reference": reference,
    }
    if callback_url:
        payload["callback_url"] = callback_url

    with httpx.Client(timeout=15) as client:
        resp = client.post(f"{PAYSTACK_BASE_URL}/transaction/initialize", json=payload, headers=_headers())

    body = resp.json()
    if resp.status_code >= 400 or not body.get("status"):
        raise PaystackError(body.get("message", "Failed to initialize Paystack transaction"), body)

    return body["data"]


def verify_transaction(reference: str) -> dict:
    """
    Confirms with Paystack whether a transaction actually succeeded.
    Never trust a client-side "payment successful" callback alone —
    always verify server-side before marking an order paid.
    """
    with httpx.Client(timeout=15) as client:
        resp = client.get(f"{PAYSTACK_BASE_URL}/transaction/verify/{reference}", headers=_headers())

    body = resp.json()
    if resp.status_code >= 400 or not body.get("status"):
        raise PaystackError(body.get("message", "Failed to verify Paystack transaction"), body)

    return body["data"]
