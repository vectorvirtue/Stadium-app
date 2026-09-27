from datetime import datetime, timedelta, timezone

import bcrypt
import jwt as pyjwt
from jwt import InvalidTokenError

from app.config import settings

# bcrypt has a hard 72-byte input limit; passwords longer than that are
# truncated before hashing so overly-long input can't error out or (worse)
# silently behave differently across bcrypt versions.
_MAX_PASSWORD_BYTES = 72


def _prepare(password: str) -> bytes:
    return password.encode("utf-8")[:_MAX_PASSWORD_BYTES]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_prepare(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(_prepare(plain_password), password_hash.encode("utf-8"))
    except ValueError:
        # Malformed/unknown hash format (e.g. a leftover legacy hash) —
        # never let this raise into a 500, just fail the check.
        return False


def create_access_token(subject: str, token_version: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    # "tv" ties this token to a specific token_version on the user row.
    # Logging out or changing password bumps token_version, which makes
    # every previously-issued token fail the check in decode_access_token
    # (well, in whoever compares it — see deps.get_current_user) even
    # though the JWT itself is still cryptographically valid and unexpired.
    payload = {"sub": subject, "tv": token_version, "exp": expire}
    return pyjwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict | None:
    """Returns the token's payload (with "sub" and "tv") or None if the
    token is missing, malformed, expired, or otherwise invalid. Does NOT
    check token_version against the DB — that's the caller's job, since
    this function has no DB session."""
    try:
        return pyjwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
    except InvalidTokenError:
        return None
