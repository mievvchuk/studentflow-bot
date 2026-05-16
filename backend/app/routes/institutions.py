import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Institution, InstitutionMember, User
from app.schemas import InstitutionCreate, InstitutionJoin, InstitutionRead

router = APIRouter(prefix="/institutions", tags=["institutions"])


def _generate_invite_code(db: Session) -> str:
    while True:
        code = secrets.token_urlsafe(7).replace("-", "").replace("_", "")[:10].upper()
        exists = db.query(Institution.id).filter(Institution.invite_code == code).first()
        if not exists:
            return code


@router.get("", response_model=list[InstitutionRead])
def list_institutions(db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> list[Institution]:
    return (
        db.query(Institution)
        .join(InstitutionMember)
        .filter(InstitutionMember.user_id == current_user.id)
        .order_by(Institution.created_at.desc())
        .all()
    )


@router.post("", response_model=InstitutionRead, status_code=status.HTTP_201_CREATED)
def create_institution(
    payload: InstitutionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Institution:
    institution = Institution(
        title=payload.title,
        type=payload.type,
        city=payload.city,
        country=payload.country,
        invite_code=_generate_invite_code(db),
        created_by_user_id=current_user.id,
    )
    db.add(institution)
    db.flush()
    db.add(InstitutionMember(institution_id=institution.id, user_id=current_user.id))
    db.commit()
    db.refresh(institution)
    return institution


@router.post("/join", response_model=InstitutionRead)
def join_institution(
    payload: InstitutionJoin,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> Institution:
    invite_code = payload.invite_code.strip().upper()
    institution = db.query(Institution).filter(Institution.invite_code == invite_code).first()
    if not institution:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Institution not found")

    exists = (
        db.query(InstitutionMember)
        .filter(InstitutionMember.institution_id == institution.id, InstitutionMember.user_id == current_user.id)
        .first()
    )
    if not exists:
        db.add(InstitutionMember(institution_id=institution.id, user_id=current_user.id))
        db.commit()
    return institution
