from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Lab, Reminder, User
from app.schemas import ReminderCreate, ReminderRead, ReminderUpdate

router = APIRouter(prefix="/reminders", tags=["reminders"])


def ensure_lab_owner(db: Session, user_id: int, lab_id: int | None) -> None:
    if lab_id is None:
        return
    exists = db.query(Lab.id).filter(Lab.id == lab_id, Lab.user_id == user_id).first()
    if not exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Lab does not belong to current user")


def get_reminder_or_404(db: Session, user_id: int, reminder_id: int) -> Reminder:
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == user_id).first()
    if not reminder:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reminder not found")
    return reminder


@router.get("", response_model=list[ReminderRead])
def list_reminders(db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> list[Reminder]:
    return db.query(Reminder).filter(Reminder.user_id == current_user.id).order_by(Reminder.remind_at.asc()).all()


@router.post("", response_model=ReminderRead, status_code=status.HTTP_201_CREATED)
def create_reminder(payload: ReminderCreate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> Reminder:
    ensure_lab_owner(db, current_user.id, payload.lab_id)
    reminder = Reminder(user_id=current_user.id, **payload.model_dump())
    db.add(reminder)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.put("/{reminder_id}", response_model=ReminderRead)
def update_reminder(reminder_id: int, payload: ReminderUpdate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> Reminder:
    reminder = get_reminder_or_404(db, current_user.id, reminder_id)
    values = payload.model_dump(exclude_unset=True)
    ensure_lab_owner(db, current_user.id, values.get("lab_id", reminder.lab_id))
    for key, value in values.items():
        setattr(reminder, key, value)
    db.commit()
    db.refresh(reminder)
    return reminder


@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(reminder_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> None:
    db.delete(get_reminder_or_404(db, current_user.id, reminder_id))
    db.commit()

