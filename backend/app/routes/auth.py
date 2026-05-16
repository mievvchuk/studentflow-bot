from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.schemas import AuthToken, TelegramAuthIn
from app.services.auth import get_or_create_telegram_user
from app.utils.security import create_access_token
from app.utils.telegram_auth import validate_telegram_init_data

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/telegram", response_model=AuthToken)
def telegram_auth(payload: TelegramAuthIn, db: Annotated[Session, Depends(get_db)]) -> AuthToken:
    settings = get_settings()
    telegram_user = validate_telegram_init_data(payload.init_data, settings.bot_token)
    user = get_or_create_telegram_user(db, telegram_user)
    token = create_access_token(user.id)
    return AuthToken(access_token=token, user=user)

