from contextlib import asynccontextmanager

from aiogram import Bot
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import auth, dashboard, groups, institutions, labs, leaderboard, reminders, study_tracks, subjects, telegram, users
from app.scheduler.worker import process_due_reminders, send_weekly_group_summaries

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler: AsyncIOScheduler | None = None
    webhook_bot: Bot | None = None

    if settings.enable_integrated_scheduler:
        scheduler = AsyncIOScheduler(timezone="UTC")
        scheduler.add_job(process_due_reminders, "interval", minutes=1, max_instances=1)
        scheduler.add_job(send_weekly_group_summaries, "cron", day_of_week="sun", hour=18, minute=0, max_instances=1)
        scheduler.start()

    if settings.webhook_base_url:
        webhook_bot = Bot(token=settings.bot_token)
        webhook_url = f"{settings.webhook_base_url.rstrip('/')}/telegram/webhook"
        await webhook_bot.set_webhook(webhook_url, drop_pending_updates=True)

    try:
        yield
    finally:
        if scheduler:
            scheduler.shutdown(wait=False)
        if webhook_bot:
            await webhook_bot.session.close()
        await telegram.bot.session.close()


app = FastAPI(title="StudentFlow Bot API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(institutions.router)
app.include_router(groups.router)
app.include_router(subjects.router)
app.include_router(labs.router)
app.include_router(study_tracks.router)
app.include_router(reminders.router)
app.include_router(dashboard.router)
app.include_router(leaderboard.router)
app.include_router(telegram.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
