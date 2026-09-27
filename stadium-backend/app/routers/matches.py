from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Match
from app.schemas import MatchDetailOut, MatchOut

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=list[MatchOut])
def list_matches(db: Session = Depends(get_db)):
    matches = (
        db.query(Match)
        .options(joinedload(Match.seat_types))
        .filter(Match.is_published.is_(True))
        .order_by(Match.kickoff_at.asc())
        .all()
    )
    return matches


@router.get("/{match_id}", response_model=MatchDetailOut)
def get_match(match_id: str, db: Session = Depends(get_db)):
    match = (
        db.query(Match)
        .options(joinedload(Match.seat_types))
        .filter(Match.id == match_id, Match.is_published.is_(True))
        .first()
    )
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match
