from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import Lab, LabTask, Subject, User
from app.schemas import LabCreate, LabRead, LabStatus, LabTaskCreate, LabTaskRead, LabTaskUpdate, LabUpdate

router = APIRouter(tags=["labs"])


def ensure_subject_owner(db: Session, user_id: int, subject_id: int | None) -> None:
    if subject_id is None:
        return
    exists = db.query(Subject.id).filter(Subject.id == subject_id, Subject.user_id == user_id).first()
    if not exists:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject does not belong to current user")


def get_lab_or_404(db: Session, user_id: int, lab_id: int) -> Lab:
    lab = db.query(Lab).filter(Lab.id == lab_id, Lab.user_id == user_id).first()
    if not lab:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab not found")
    return lab


def get_task_or_404(db: Session, user_id: int, task_id: int) -> LabTask:
    task = db.query(LabTask).join(Lab).filter(LabTask.id == task_id, Lab.user_id == user_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lab task not found")
    return task


@router.get("/labs", response_model=list[LabRead])
def list_labs(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    status_filter: Annotated[LabStatus | None, Query(alias="status")] = None,
    subject_id: int | None = None,
    deadline_from: datetime | None = None,
    deadline_to: datetime | None = None,
) -> list[Lab]:
    query = db.query(Lab).filter(Lab.user_id == current_user.id)
    if status_filter:
        query = query.filter(Lab.status == status_filter)
    if subject_id:
        query = query.filter(Lab.subject_id == subject_id)
    if deadline_from:
        query = query.filter(Lab.deadline >= deadline_from)
    if deadline_to:
        query = query.filter(Lab.deadline <= deadline_to)
    return query.order_by(Lab.deadline.asc().nullslast(), Lab.created_at.desc()).all()


@router.post("/labs", response_model=LabRead, status_code=status.HTTP_201_CREATED)
def create_lab(payload: LabCreate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> Lab:
    ensure_subject_owner(db, current_user.id, payload.subject_id)
    lab = Lab(user_id=current_user.id, **payload.model_dump())
    if lab.status in {"completed", "submitted"}:
        lab.completed_at = datetime.now(timezone.utc)
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return lab


@router.get("/labs/{lab_id}", response_model=LabRead)
def get_lab(lab_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> Lab:
    return get_lab_or_404(db, current_user.id, lab_id)


@router.put("/labs/{lab_id}", response_model=LabRead)
def update_lab(lab_id: int, payload: LabUpdate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> Lab:
    lab = get_lab_or_404(db, current_user.id, lab_id)
    values = payload.model_dump(exclude_unset=True)
    ensure_subject_owner(db, current_user.id, values.get("subject_id", lab.subject_id))
    previous_status = lab.status
    for key, value in values.items():
        setattr(lab, key, value)
    if "status" in values:
        if lab.status in {"completed", "submitted"} and previous_status not in {"completed", "submitted"}:
            lab.completed_at = datetime.now(timezone.utc)
        elif lab.status not in {"completed", "submitted"}:
            lab.completed_at = None
    db.commit()
    db.refresh(lab)
    return lab


@router.delete("/labs/{lab_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lab(lab_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> None:
    db.delete(get_lab_or_404(db, current_user.id, lab_id))
    db.commit()


@router.get("/labs/{lab_id}/tasks", response_model=list[LabTaskRead])
def list_lab_tasks(lab_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> list[LabTask]:
    get_lab_or_404(db, current_user.id, lab_id)
    return db.query(LabTask).filter(LabTask.lab_id == lab_id).order_by(LabTask.created_at.asc()).all()


@router.post("/labs/{lab_id}/tasks", response_model=LabTaskRead, status_code=status.HTTP_201_CREATED)
def create_lab_task(lab_id: int, payload: LabTaskCreate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> LabTask:
    get_lab_or_404(db, current_user.id, lab_id)
    task = LabTask(lab_id=lab_id, **payload.model_dump())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/lab-tasks/{task_id}", response_model=LabTaskRead)
def update_lab_task(task_id: int, payload: LabTaskUpdate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> LabTask:
    task = get_task_or_404(db, current_user.id, task_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/lab-tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lab_task(task_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> None:
    db.delete(get_task_or_404(db, current_user.id, task_id))
    db.commit()
