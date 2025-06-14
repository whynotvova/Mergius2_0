import asyncio
import logging
from aiogram import Bot, Dispatcher
from config import BOT_TOKEN
from handlers.user_handlers import router as user_router
from handlers.admin_handlers import router as admin_router
from database.db import Database

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    bot = Bot(token=BOT_TOKEN)
    dp = Dispatcher()
    db = Database()

    try:
        await db.init_pool()
        logger.info("Бот запущен.")
        # Pass the Database instance to handlers via kwargs
        dp.include_router(user_router)
        dp.include_router(admin_router)
        await dp.start_polling(bot, db=db)  # Pass db to polling
    except Exception as e:
        logger.error(f"Ошибка запуска бота: {e}")
        raise
    finally:
        await db.close()
        logger.info("Бот остановлен.")

if __name__ == "__main__":
    asyncio.run(main())