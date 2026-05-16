import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Group, GroupMember, InstitutionMember, User
from app.schemas import GroupCreate, GroupJoin, GroupRead

router = APIRouter(prefix="/groups", tags=["groups"])


def _generate_invite_code(db: Session) -> str:
    while True:
        code = secrets.token_urlsafe(6).replace("-", "").replace("_", "")[:8].upper()
        exists = db.query(Group.id).filter(Group.invite_code == code).first()
        if not exists:
            return code


@router.get("", response_model=list[GroupRead])
def list_groups(db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> list[Group]:
    return (
        db.query(Group)
        .join(GroupMember)
        .filter(GroupMember.user_id == current_user.id)
        .order_by(Group.created_at.desc())
        .all()
    )


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
def create_group(payload: GroupCreate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> Group:
    if payload.institution_id is not None:
        membership = (
            db.query(InstitutionMember)
            .filter(InstitutionMember.institution_id == payload.institution_id, InstitutionMember.user_id == current_user.id)
            .first()
        )
        if not membership:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Join this institution before creating a group in it")

    group = Group(
        institution_id=payload.institution_id,
        title=payload.title,
        description=payload.description,
        invite_code=_generate_invite_code(db),
        created_by_user_id=current_user.id,
    )
    db.add(group)
    db.flush()
    db.add(GroupMember(group_id=group.id, user_id=current_user.id))
    db.commit()
    db.refresh(group)
    return group


@router.post("/join", response_model=GroupRead)
def join_group(payload: GroupJoin, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> Group:
    invite_code = payload.invite_code.strip().upper()
    group = db.query(Group).filter(Group.invite_code == invite_code).first()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    exists = db.query(GroupMember).filter(GroupMember.group_id == group.id, GroupMember.user_id == current_user.id).first()
    if not exists:
        db.add(GroupMember(group_id=group.id, user_id=current_user.id))
        db.commit()
    return group
