from aiogram import Bot
from aiogram.types import Update
from fastapi import APIRouter, Request

from app.bot.main import create_dispatcher
from app.config import get_settings

settings = get_settings()

router = APIRouter(prefix="/telegram", tags=["telegram"])
bot = Bot(token=settings.bot_token)
dispatcher = create_dispatcher()


@router.post("/webhook")
async def telegram_webhook(request: Request) -> dict[str, bool]:
    update = Update.model_validate(await request.json(), context={"bot": bot})
    await dispatcher.feed_update(bot, update)
    return {"ok": True}


@router.get("/bot-info")
async def telegram_bot_info() -> dict[str, int | str | None]:
    current_bot = await bot.get_me()
    return {
        "id": current_bot.id,
        "username": current_bot.username,
        "first_name": current_bot.first_name,
    }
