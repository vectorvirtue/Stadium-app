from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.cookies import set_auth_cookie
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import PasswordChange, UserOut, UserUpdate
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("", response_model=UserOut)
def update_profile(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True)

    if "email" in updates and updates["email"] != current_user.email:
        existing = db.query(User).filter(User.email == updates["email"]).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    for field, value in updates.items():
        setattr(current_user, field, value)

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: PasswordChange,
    response: Response,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.password_hash = hash_password(payload.new_password)
    # Revokes every token issued before this point — including one that
    # leaked and is sitting in an attacker's hands, which was exactly the
    # gap this closes. We then issue a fresh token under the new version
    # so the tab the user is actively using right now doesn't get logged
    # out by its own password change.
    current_user.token_version += 1
    db.commit()
    db.refresh(current_user)

    token = create_access_token(subject=current_user.id, token_version=current_user.token_version)
    set_auth_cookie(response, token)
    return {"detail": "Password updated"}
