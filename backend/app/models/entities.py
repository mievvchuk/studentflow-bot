from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    telegram_id: Mapped[int] = mapped_column(BigInteger, unique=True, index=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(255))
    first_name: Mapped[str | None] = mapped_column(String(255))
    last_name: Mapped[str | None] = mapped_column(String(255))
    photo_url: Mapped[str | None] = mapped_column(Text)

    subjects: Mapped[list["Subject"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    labs: Mapped[list["Lab"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    study_tracks: Mapped[list["StudyTrack"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    reminders: Mapped[list["Reminder"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    group_memberships: Mapped[list["GroupMember"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    institution_memberships: Mapped[list["InstitutionMember"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    weekly_statistics: Mapped[list["WeeklyStatistic"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Institution(Base, TimestampMixin):
    __tablename__ = "institutions"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    city: Mapped[str | None] = mapped_column(String(255))
    country: Mapped[str | None] = mapped_column(String(255))
    invite_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    members: Mapped[list["InstitutionMember"]] = relationship(back_populates="institution", cascade="all, delete-orphan")
    groups: Mapped[list["Group"]] = relationship(back_populates="institution")


class InstitutionMember(Base, TimestampMixin):
    __tablename__ = "institution_members"
    __table_args__ = (UniqueConstraint("institution_id", "user_id", name="uq_institution_members_institution_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    institution_id: Mapped[int] = mapped_column(ForeignKey("institutions.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    institution: Mapped[Institution] = relationship(back_populates="members")
    user: Mapped[User] = relationship(back_populates="institution_memberships")


class Group(Base, TimestampMixin):
    __tablename__ = "groups"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    institution_id: Mapped[int | None] = mapped_column(ForeignKey("institutions.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    invite_code: Mapped[str] = mapped_column(String(32), unique=True, index=True, nullable=False)
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    institution: Mapped[Institution | None] = relationship(back_populates="groups")
    members: Mapped[list["GroupMember"]] = relationship(back_populates="group", cascade="all, delete-orphan")
    weekly_statistics: Mapped[list["WeeklyStatistic"]] = relationship(back_populates="group", cascade="all, delete-orphan")


class GroupMember(Base, TimestampMixin):
    __tablename__ = "group_members"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_group_members_group_user"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)

    group: Mapped[Group] = relationship(back_populates="members")
    user: Mapped[User] = relationship(back_populates="group_memberships")


class WeeklyStatistic(Base, TimestampMixin):
    __tablename__ = "weekly_statistics"
    __table_args__ = (UniqueConstraint("group_id", "user_id", "week_start", name="uq_weekly_statistics_group_user_week"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    group_id: Mapped[int] = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    week_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    completed_labs_on_time: Mapped[int] = mapped_column(Integer, default=0)
    completed_labs_late: Mapped[int] = mapped_column(Integer, default=0)
    completed_learning_tasks: Mapped[int] = mapped_column(Integer, default=0)
    streak_bonus_points: Mapped[int] = mapped_column(Integer, default=0)
    points: Mapped[int] = mapped_column(Integer, default=0, index=True)

    group: Mapped[Group] = relationship(back_populates="weekly_statistics")
    user: Mapped[User] = relationship(back_populates="weekly_statistics")


class Subject(Base, TimestampMixin):
    __tablename__ = "subjects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    color: Mapped[str | None] = mapped_column(String(32), default="#2563eb")

    user: Mapped[User] = relationship(back_populates="subjects")
    labs: Mapped[list["Lab"]] = relationship(back_populates="subject", passive_deletes=True)


class Lab(Base, TimestampMixin):
    __tablename__ = "labs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[int | None] = mapped_column(ForeignKey("subjects.id", ondelete="SET NULL"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    deadline: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    status: Mapped[str] = mapped_column(String(32), default="not_started", index=True)
    github_url: Mapped[str | None] = mapped_column(Text)
    report_file_url: Mapped[str | None] = mapped_column(Text)

    user: Mapped[User] = relationship(back_populates="labs")
    subject: Mapped[Subject | None] = relationship(back_populates="labs")
    tasks: Mapped[list["LabTask"]] = relationship(back_populates="lab", cascade="all, delete-orphan")
    reminders: Mapped[list["Reminder"]] = relationship(back_populates="lab", cascade="all, delete-orphan")


class LabTask(Base, TimestampMixin):
    __tablename__ = "lab_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    lab_id: Mapped[int] = mapped_column(ForeignKey("labs.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)

    lab: Mapped[Lab] = relationship(back_populates="tasks")


class StudyTrack(Base, TimestampMixin):
    __tablename__ = "study_tracks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    progress: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped[User] = relationship(back_populates="study_tracks")
    technologies: Mapped[list["Technology"]] = relationship(back_populates="study_track", cascade="all, delete-orphan")


class Technology(Base, TimestampMixin):
    __tablename__ = "technologies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    study_track_id: Mapped[int] = mapped_column(ForeignKey("study_tracks.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="not_started")
    progress: Mapped[int] = mapped_column(Integer, default=0)

    study_track: Mapped[StudyTrack] = relationship(back_populates="technologies")
    learning_tasks: Mapped[list["LearningTask"]] = relationship(back_populates="technology", cascade="all, delete-orphan")


class LearningTask(Base, TimestampMixin):
    __tablename__ = "learning_tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    technology_id: Mapped[int] = mapped_column(ForeignKey("technologies.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)

    technology: Mapped[Technology] = relationship(back_populates="learning_tasks")


class Reminder(Base, TimestampMixin):
    __tablename__ = "reminders"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    lab_id: Mapped[int | None] = mapped_column(ForeignKey("labs.id", ondelete="CASCADE"), index=True)
    remind_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_sent: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    user: Mapped[User] = relationship(back_populates="reminders")
    lab: Mapped[Lab | None] = relationship(back_populates="reminders")
