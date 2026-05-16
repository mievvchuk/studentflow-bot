from datetime import datetime, time, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Lab, Reminder, StudyTrack, Subject, User
from app.schemas import DashboardRead

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardRead)
def get_dashboard(db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> DashboardRead:
    now = datetime.now(timezone.utc)
    today_start = datetime.combine(now.date(), time.min, tzinfo=timezone.utc)
    today_end = datetime.combine(now.date(), time.max, tzinfo=timezone.utc)
    total_subjects = db.query(func.count(Subject.id)).filter(Subject.user_id == current_user.id).scalar() or 0
    total_labs = db.query(func.count(Lab.id)).filter(Lab.user_id == current_user.id).scalar() or 0
    completed_labs = db.query(func.count(Lab.id)).filter(Lab.user_id == current_user.id, Lab.status.in_(["completed", "submitted"])).scalar() or 0
    labs_in_progress = db.query(func.count(Lab.id)).filter(Lab.user_id == current_user.id, Lab.status == "in_progress").scalar() or 0
    upcoming_deadlines = (
        db.query(Lab)
        .filter(Lab.user_id == current_user.id, Lab.deadline.isnot(None), Lab.deadline >= now)
        .order_by(Lab.deadline.asc())
        .limit(5)
        .all()
    )
    study_track_progress = db.query(StudyTrack).filter(StudyTrack.user_id == current_user.id).order_by(StudyTrack.created_at.desc()).limit(5).all()
    reminders_for_today = (
        db.query(Reminder)
        .filter(Reminder.user_id == current_user.id, Reminder.remind_at >= today_start, Reminder.remind_at <= today_end)
        .order_by(Reminder.remind_at.asc())
        .all()
    )
    return DashboardRead(
        total_subjects=total_subjects,
        total_labs=total_labs,
        completed_labs=completed_labs,
        labs_in_progress=labs_in_progress,
        upcoming_deadlines=upcoming_deadlines,
        study_track_progress=study_track_progress,
        reminders_for_today=reminders_for_today,
    )

