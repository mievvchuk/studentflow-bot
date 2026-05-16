import asyncio
import logging

from aiogram import Bot, Dispatcher, F
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo

from app.config import get_settings

settings = get_settings()


def mini_app_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="Open StudentFlow", web_app=WebAppInfo(url=settings.mini_app_url))]
        ]
    )


async def start(message: Message) -> None:
    await message.answer(
        "StudentFlow Bot is ready. Open the Mini App to manage labs, tracks, deadlines, and reminders.",
        reply_markup=mini_app_keyboard(),
    )


def create_dispatcher() -> Dispatcher:
    dispatcher = Dispatcher()
    dispatcher.message.register(start, CommandStart())
    dispatcher.message.filter(F.chat.type == "private")
    return dispatcher


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    bot = Bot(token=settings.bot_token)
    dispatcher = create_dispatcher()
    await dispatcher.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
