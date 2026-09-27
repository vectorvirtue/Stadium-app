from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, UserRole
from app.security import decode_access_token


def _extract_token(request: Request) -> str | None:
    # Primary path: the httpOnly cookie set by /auth/login and /auth/signup.
    # A JS-injected script (XSS) can't read this, unlike a token sitting
    # in localStorage — that's the whole point of moving it here.
    token = request.cookies.get(settings.access_token_cookie_name)
    if token:
        return token
    # Fallback: a standard Authorization: Bearer header, kept so the
    # Swagger "Authorize" button and any non-browser API client (scripts,
    # mobile apps that can't/shouldn't rely on browser cookies) still work.
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.lower().startswith("bearer "):
        return auth_header[7:]
    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = _extract_token(request)
    if token is None:
        raise credentials_error

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_error

    user_id = payload.get("sub")
    token_version = payload.get("tv")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_error

    # The core of revocation: a token issued before a logout or password
    # change carries the *old* token_version and is rejected here even
    # though it's still a validly-signed, unexpired JWT.
    if token_version != user.token_version:
        raise credentials_error

    return user


def get_current_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user
