from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Group, GroupMember, User
from app.schemas import LeaderboardRead
from app.services.leaderboard import build_group_leaderboard

router = APIRouter(prefix="/leaderboard", tags=["leaderboard"])


def get_accessible_group(db: Session, user_id: int, group_id: int | None) -> Group:
    query = db.query(Group).join(GroupMember).filter(GroupMember.user_id == user_id)
    if group_id is not None:
        query = query.filter(Group.id == group_id)
    group = query.order_by(Group.created_at.desc()).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Join or create a group to view the leaderboard")
    return group


@router.get("", response_model=LeaderboardRead)
def get_leaderboard(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    group_id: Annotated[int | None, Query()] = None,
) -> dict:
    group = get_accessible_group(db, current_user.id, group_id)
    return build_group_leaderboard(db, group, current_user)
