from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routes import auth, dashboard, groups, institutions, labs, leaderboard, reminders, study_tracks, subjects, users

settings = get_settings()

app = FastAPI(title="StudentFlow Bot API", version="0.1.0")

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


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
