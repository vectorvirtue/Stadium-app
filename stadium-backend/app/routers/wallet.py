from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import User, WalletTransaction
from app.schemas import WalletOut

router = APIRouter(prefix="/wallet", tags=["wallet"])


@router.get("", response_model=WalletOut)
def get_wallet(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    transactions = (
        db.query(WalletTransaction)
        .filter(WalletTransaction.user_id == current_user.id)
        .order_by(WalletTransaction.created_at.desc())
        .all()
    )
    return WalletOut(balance=current_user.wallet_balance, transactions=transactions)
