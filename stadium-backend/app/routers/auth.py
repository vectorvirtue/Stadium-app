from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.cookies import clear_auth_cookie, set_auth_cookie
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.rate_limit import limiter
from app.schemas import Token, UserCreate, UserLogin, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


# Rate limits are per-IP (see app/rate_limit.py) and deliberately generous
# enough not to bother a real user who mistypes a password a couple of
# times, while still shutting down credential-stuffing/brute-force scripts.
@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/hour")
def signup(payload: UserCreate, request: Request, response: Response, db: Session = Depends(get_db)):
    if not payload.passwords_match():
        raise HTTPException(status_code=400, detail="Passwords do not match")

    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    user = User(
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone_number=payload.phone_number,
        email=payload.email,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(subject=user.id, token_version=user.token_version)
    set_auth_cookie(response, token)
    return Token(user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
@limiter.limit("10/minute")
def login(payload: UserLogin, request: Request, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token(subject=user.id, token_version=user.token_version)
    set_auth_cookie(response, token)
    return Token(user=UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(response: Response, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Bumping token_version invalidates the token that was just used to
    # authenticate this very request (and any other outstanding token for
    # this user) — not just clearing the cookie client-side, which would
    # leave a copied-out token perfectly usable until it expired.
    current_user.token_version += 1
    db.commit()
    clear_auth_cookie(response)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
