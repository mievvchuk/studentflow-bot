from datetime import datetime, time, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import Group, GroupMember, Lab, LearningTask, StudyTrack, Technology, User, WeeklyStatistic


def current_week_bounds(now: datetime | None = None) -> tuple[datetime, datetime]:
    current = now or datetime.now(timezone.utc)
    week_start_date = (current - timedelta(days=current.weekday())).date()
    week_start = datetime.combine(week_start_date, time.min, tzinfo=timezone.utc)
    return week_start, week_start + timedelta(days=7)


def _completed_dates(items: list[Lab] | list[LearningTask]) -> set:
    return {item.completed_at.astimezone(timezone.utc).date() for item in items if item.completed_at}


def _has_weekly_streak(completion_dates: set, week_start: datetime, week_end: datetime, now: datetime) -> bool:
    last_required_day = min(now.date(), (week_end - timedelta(days=1)).date())
    required_days = (last_required_day - week_start.date()).days + 1
    if required_days <= 0:
        return False
    return all((week_start.date() + timedelta(days=offset)) in completion_dates for offset in range(required_days))


def calculate_user_weekly_stat(
    db: Session,
    group_id: int,
    user_id: int,
    week_start: datetime,
    week_end: datetime,
    now: datetime | None = None,
) -> WeeklyStatistic:
    current = now or datetime.now(timezone.utc)
    labs = (
        db.query(Lab)
        .filter(
            Lab.user_id == user_id,
            Lab.status.in_(["completed", "submitted"]),
            Lab.completed_at.isnot(None),
            Lab.completed_at >= week_start,
            Lab.completed_at < week_end,
        )
        .all()
    )
    completed_labs_on_time = sum(1 for lab in labs if lab.deadline is None or lab.completed_at <= lab.deadline)
    completed_labs_late = len(labs) - completed_labs_on_time

    learning_tasks = (
        db.query(LearningTask)
        .join(Technology)
        .join(StudyTrack)
        .filter(
            StudyTrack.user_id == user_id,
            LearningTask.is_completed.is_(True),
            LearningTask.completed_at.isnot(None),
            LearningTask.completed_at >= week_start,
            LearningTask.completed_at < week_end,
        )
        .all()
    )
    completed_learning_tasks = len(learning_tasks)
    completion_dates = _completed_dates(labs) | _completed_dates(learning_tasks)
    streak_bonus_points = 5 if _has_weekly_streak(completion_dates, week_start, week_end, current) else 0
    points = completed_labs_on_time * 10 + completed_labs_late * 3 + completed_learning_tasks * 2 + streak_bonus_points

    stat = (
        db.query(WeeklyStatistic)
        .filter(
            WeeklyStatistic.group_id == group_id,
            WeeklyStatistic.user_id == user_id,
            WeeklyStatistic.week_start == week_start,
        )
        .first()
    )
    if not stat:
        stat = WeeklyStatistic(group_id=group_id, user_id=user_id, week_start=week_start)
        db.add(stat)

    stat.completed_labs_on_time = completed_labs_on_time
    stat.completed_labs_late = completed_labs_late
    stat.completed_learning_tasks = completed_learning_tasks
    stat.streak_bonus_points = streak_bonus_points
    stat.points = points
    return stat


def build_group_leaderboard(db: Session, group: Group, current_user: User, now: datetime | None = None) -> dict:
    current = now or datetime.now(timezone.utc)
    week_start, week_end = current_week_bounds(current)
    members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
    entries = []

    for member in members:
        stat = calculate_user_weekly_stat(db, group.id, member.user_id, week_start, week_end, current)
        entries.append({"user": member.user, "stat": stat})

    db.commit()

    entries.sort(
        key=lambda item: (
            -item["stat"].points,
            -item["stat"].completed_labs_on_time,
            -item["stat"].completed_learning_tasks,
            item["user"].id,
        )
    )

    rankings = []
    my_stats = None
    for index, item in enumerate(entries, start=1):
        stat = item["stat"]
        entry = {
            "rank": index,
            "user": item["user"],
            "points": stat.points,
            "completed_labs_on_time": stat.completed_labs_on_time,
            "completed_labs_late": stat.completed_labs_late,
            "completed_learning_tasks": stat.completed_learning_tasks,
            "streak_bonus_points": stat.streak_bonus_points,
        }
        rankings.append(entry)
        if item["user"].id == current_user.id:
            my_stats = {
                "rank": index,
                "points": stat.points,
                "completed_labs_on_time": stat.completed_labs_on_time,
                "completed_labs_late": stat.completed_labs_late,
                "completed_learning_tasks": stat.completed_learning_tasks,
                "streak_bonus_points": stat.streak_bonus_points,
            }

    return {
        "group": group,
        "week_start": week_start,
        "week_end": week_end,
        "podium": rankings[:3],
        "rankings": rankings,
        "my_stats": my_stats
        or {
            "rank": None,
            "points": 0,
            "completed_labs_on_time": 0,
            "completed_labs_late": 0,
            "completed_learning_tasks": 0,
            "streak_bonus_points": 0,
        },
    }
