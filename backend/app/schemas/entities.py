from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import LabStatus, OrmModel, ProgressMixin, TechnologyStatus, Timestamped
from app.schemas.user import UserRead


class TelegramAuthIn(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    init_data: str = Field(alias="initData")


class AuthToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class SubjectBase(BaseModel):
    title: str
    description: str | None = None
    color: str | None = "#2563eb"


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    color: str | None = None


class SubjectRead(SubjectBase, Timestamped):
    id: int
    user_id: int


class LabBase(BaseModel):
    subject_id: int | None = None
    title: str
    description: str | None = None
    deadline: datetime | None = None
    status: LabStatus = "not_started"
    github_url: str | None = None
    report_file_url: str | None = None


class LabCreate(LabBase):
    pass


class LabUpdate(BaseModel):
    subject_id: int | None = None
    title: str | None = None
    description: str | None = None
    deadline: datetime | None = None
    status: LabStatus | None = None
    github_url: str | None = None
    report_file_url: str | None = None


class LabRead(LabBase, Timestamped):
    id: int
    user_id: int


class LabTaskBase(BaseModel):
    title: str
    is_completed: bool = False


class LabTaskCreate(LabTaskBase):
    pass


class LabTaskUpdate(BaseModel):
    title: str | None = None
    is_completed: bool | None = None


class LabTaskRead(LabTaskBase, Timestamped):
    id: int
    lab_id: int


class StudyTrackBase(ProgressMixin):
    title: str
    description: str | None = None


class StudyTrackCreate(StudyTrackBase):
    pass


class StudyTrackUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    progress: int | None = Field(default=None, ge=0, le=100)


class StudyTrackRead(StudyTrackBase, Timestamped):
    id: int
    user_id: int


class TechnologyBase(ProgressMixin):
    title: str
    status: TechnologyStatus = "not_started"


class TechnologyCreate(TechnologyBase):
    pass


class TechnologyUpdate(BaseModel):
    title: str | None = None
    status: TechnologyStatus | None = None
    progress: int | None = Field(default=None, ge=0, le=100)


class TechnologyRead(TechnologyBase, Timestamped):
    id: int
    study_track_id: int


class LearningTaskBase(BaseModel):
    title: str
    description: str | None = None
    is_completed: bool = False


class LearningTaskCreate(LearningTaskBase):
    pass


class LearningTaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    is_completed: bool | None = None


class LearningTaskRead(LearningTaskBase, Timestamped):
    id: int
    technology_id: int


class ReminderBase(BaseModel):
    lab_id: int | None = None
    remind_at: datetime
    message: str
    is_sent: bool = False


class ReminderCreate(ReminderBase):
    pass


class ReminderUpdate(BaseModel):
    lab_id: int | None = None
    remind_at: datetime | None = None
    message: str | None = None
    is_sent: bool | None = None


class ReminderRead(ReminderBase, Timestamped):
    id: int
    user_id: int


class DashboardRead(OrmModel):
    total_subjects: int
    total_labs: int
    completed_labs: int
    labs_in_progress: int
    upcoming_deadlines: list[LabRead]
    study_track_progress: list[StudyTrackRead]
    reminders_for_today: list[ReminderRead]


class InstitutionBase(BaseModel):
    title: str
    type: str = Field(pattern="^(school|college|university)$")
    city: str | None = None
    country: str | None = None


class InstitutionCreate(InstitutionBase):
    pass


class InstitutionJoin(BaseModel):
    invite_code: str


class InstitutionRead(InstitutionBase, Timestamped):
    id: int
    invite_code: str
    created_by_user_id: int


class GroupBase(BaseModel):
    title: str
    description: str | None = None
    institution_id: int | None = None


class GroupCreate(GroupBase):
    pass


class GroupJoin(BaseModel):
    invite_code: str


class GroupRead(GroupBase, Timestamped):
    id: int
    invite_code: str
    created_by_user_id: int
    institution: InstitutionRead | None = None


class LeaderboardUser(OrmModel):
    id: int
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    photo_url: str | None = None


class LeaderboardEntry(OrmModel):
    rank: int
    user: LeaderboardUser
    points: int
    completed_labs_on_time: int
    completed_labs_late: int
    completed_learning_tasks: int
    streak_bonus_points: int


class MyLeaderboardStats(OrmModel):
    rank: int | None
    points: int
    completed_labs_on_time: int
    completed_labs_late: int
    completed_learning_tasks: int
    streak_bonus_points: int


class LeaderboardRead(OrmModel):
    group: GroupRead
    week_start: datetime
    week_end: datetime
    podium: list[LeaderboardEntry]
    rankings: list[LeaderboardEntry]
    my_stats: MyLeaderboardStats
