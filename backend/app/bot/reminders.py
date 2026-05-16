from aiogram import Bot

from app.config import get_settings
from app.models import Reminder


async def send_reminder(reminder: Reminder) -> None:
    settings = get_settings()
    bot = Bot(token=settings.bot_token)
    try:
        await bot.send_message(chat_id=reminder.user.telegram_id, text=reminder.message)
    finally:
        await bot.session.close()

