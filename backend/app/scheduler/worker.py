import asyncio
import logging
from datetime import datetime, timezone

from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.bot.reminders import send_reminder
from app.config import get_settings
from app.database import SessionLocal
from app.models import Group, GroupMember, Reminder
from app.services.leaderboard import build_group_leaderboard

logger = logging.getLogger(__name__)


async def process_due_reminders() -> None:
    db = SessionLocal()
    try:
        reminders = (
            db.query(Reminder)
            .filter(Reminder.is_sent.is_(False), Reminder.remind_at <= datetime.now(timezone.utc))
            .order_by(Reminder.remind_at.asc())
            .with_for_update(skip_locked=True)
            .limit(50)
            .all()
        )
        for reminder in reminders:
            try:
                await send_reminder(reminder)
                reminder.is_sent = True
                db.add(reminder)
                db.commit()
            except Exception:
                db.rollback()
                logger.exception("Failed to send reminder %s", reminder.id)
    finally:
        db.close()


def _display_name(entry: dict) -> str:
    user = entry["user"]
    return user.first_name or user.username or f"Student {user.id}"


async def send_weekly_group_summaries() -> None:
    db = SessionLocal()
    settings = get_settings()
    bot = Bot(token=settings.bot_token)
    try:
        groups = db.query(Group).order_by(Group.title.asc()).all()
        for group in groups:
            members = db.query(GroupMember).filter(GroupMember.group_id == group.id).all()
            if not members:
                continue

            leaderboard = build_group_leaderboard(db, group, members[0].user)
            top_lines = [
                f"{entry['rank']}. {_display_name(entry)} - {entry['points']} pts"
                for entry in leaderboard["rankings"][:5]
            ]
            message = "\n".join(
                [
                    f"Weekly StudentFlow summary: {group.title}",
                    f"Week: {leaderboard['week_start'].date()} - {leaderboard['week_end'].date()}",
                    "",
                    *(top_lines or ["No points this week yet."]),
                ]
            )
            for member in members:
                try:
                    await bot.send_message(chat_id=member.user.telegram_id, text=message)
                except Exception:
                    logger.exception("Failed to send weekly summary for group %s to user %s", group.id, member.user_id)
    finally:
        await bot.session.close()
        db.close()


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    scheduler = AsyncIOScheduler(timezone="UTC")
    scheduler.add_job(process_due_reminders, "interval", minutes=1, max_instances=1)
    scheduler.add_job(send_weekly_group_summaries, "cron", day_of_week="sun", hour=18, minute=0, max_instances=1)
    scheduler.start()
    while True:
        await asyncio.sleep(3600)


if __name__ == "__main__":
    asyncio.run(main())
