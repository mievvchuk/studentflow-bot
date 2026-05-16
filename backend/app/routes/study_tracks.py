from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models import LearningTask, StudyTrack, Technology, User
from app.schemas import (
    LearningTaskCreate,
    LearningTaskRead,
    LearningTaskUpdate,
    StudyTrackCreate,
    StudyTrackRead,
    StudyTrackUpdate,
    TechnologyCreate,
    TechnologyRead,
    TechnologyUpdate,
)

router = APIRouter(tags=["study tracks"])


def get_track_or_404(db: Session, user_id: int, track_id: int) -> StudyTrack:
    track = db.query(StudyTrack).filter(StudyTrack.id == track_id, StudyTrack.user_id == user_id).first()
    if not track:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Study track not found")
    return track


def get_technology_or_404(db: Session, user_id: int, technology_id: int) -> Technology:
    technology = (
        db.query(Technology)
        .join(StudyTrack)
        .filter(Technology.id == technology_id, StudyTrack.user_id == user_id)
        .first()
    )
    if not technology:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technology not found")
    return technology


def get_learning_task_or_404(db: Session, user_id: int, task_id: int) -> LearningTask:
    task = (
        db.query(LearningTask)
        .join(Technology)
        .join(StudyTrack)
        .filter(LearningTask.id == task_id, StudyTrack.user_id == user_id)
        .first()
    )
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning task not found")
    return task


@router.get("/study-tracks", response_model=list[StudyTrackRead])
def list_tracks(db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> list[StudyTrack]:
    return db.query(StudyTrack).filter(StudyTrack.user_id == current_user.id).order_by(StudyTrack.created_at.desc()).all()


@router.post("/study-tracks", response_model=StudyTrackRead, status_code=status.HTTP_201_CREATED)
def create_track(payload: StudyTrackCreate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> StudyTrack:
    track = StudyTrack(user_id=current_user.id, **payload.model_dump())
    db.add(track)
    db.commit()
    db.refresh(track)
    return track


@router.get("/study-tracks/{track_id}", response_model=StudyTrackRead)
def get_track(track_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> StudyTrack:
    return get_track_or_404(db, current_user.id, track_id)


@router.put("/study-tracks/{track_id}", response_model=StudyTrackRead)
def update_track(track_id: int, payload: StudyTrackUpdate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> StudyTrack:
    track = get_track_or_404(db, current_user.id, track_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(track, key, value)
    db.commit()
    db.refresh(track)
    return track


@router.delete("/study-tracks/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_track(track_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> None:
    db.delete(get_track_or_404(db, current_user.id, track_id))
    db.commit()


@router.get("/study-tracks/{track_id}/technologies", response_model=list[TechnologyRead])
def list_technologies(track_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> list[Technology]:
    get_track_or_404(db, current_user.id, track_id)
    return db.query(Technology).filter(Technology.study_track_id == track_id).order_by(Technology.created_at.asc()).all()


@router.post("/study-tracks/{track_id}/technologies", response_model=TechnologyRead, status_code=status.HTTP_201_CREATED)
def create_technology(track_id: int, payload: TechnologyCreate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> Technology:
    get_track_or_404(db, current_user.id, track_id)
    technology = Technology(study_track_id=track_id, **payload.model_dump())
    db.add(technology)
    db.commit()
    db.refresh(technology)
    return technology


@router.put("/technologies/{technology_id}", response_model=TechnologyRead)
def update_technology(technology_id: int, payload: TechnologyUpdate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> Technology:
    technology = get_technology_or_404(db, current_user.id, technology_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(technology, key, value)
    db.commit()
    db.refresh(technology)
    return technology


@router.delete("/technologies/{technology_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_technology(technology_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> None:
    db.delete(get_technology_or_404(db, current_user.id, technology_id))
    db.commit()


@router.get("/technologies/{technology_id}/tasks", response_model=list[LearningTaskRead])
def list_learning_tasks(technology_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> list[LearningTask]:
    get_technology_or_404(db, current_user.id, technology_id)
    return db.query(LearningTask).filter(LearningTask.technology_id == technology_id).order_by(LearningTask.created_at.asc()).all()


@router.post("/technologies/{technology_id}/tasks", response_model=LearningTaskRead, status_code=status.HTTP_201_CREATED)
def create_learning_task(technology_id: int, payload: LearningTaskCreate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> LearningTask:
    get_technology_or_404(db, current_user.id, technology_id)
    task = LearningTask(technology_id=technology_id, **payload.model_dump())
    if task.is_completed:
        task.completed_at = datetime.now(timezone.utc)
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.put("/learning-tasks/{task_id}", response_model=LearningTaskRead)
def update_learning_task(task_id: int, payload: LearningTaskUpdate, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> LearningTask:
    task = get_learning_task_or_404(db, current_user.id, task_id)
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, key, value)
    if payload.is_completed is True and task.completed_at is None:
        task.completed_at = datetime.now(timezone.utc)
    elif payload.is_completed is False:
        task.completed_at = None
    db.commit()
    db.refresh(task)
    return task


@router.delete("/learning-tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_learning_task(task_id: int, db: Annotated[Session, Depends(get_db)], current_user: Annotated[User, Depends(get_current_user)]) -> None:
    db.delete(get_learning_task_or_404(db, current_user.id, task_id))
    db.commit()
