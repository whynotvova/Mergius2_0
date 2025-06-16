import aiomysql
from config import DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.pool = None

    async def init_pool(self):
        try:
            self.pool = await aiomysql.create_pool(
                host=DB_HOST,
                port=DB_PORT,
                user=DB_USER,
                password=DB_PASSWORD,
                db=DB_NAME,
                minsize=1,
                maxsize=10,
                autocommit=True
            )
            await self.create_tables()
            logger.info(f"Пул соединений с базой данных {DB_NAME} успешно инициализирован.")
        except aiomysql.Error as e:
            logger.error(f"Ошибка подключения к базе данных {DB_NAME}: {e}")
            raise RuntimeError(f"Не удалось инициализировать пул соединений: {e}")
        except Exception as e:
            logger.error(f"Непредвиденная ошибка инициализации пула: {e}")
            raise

    async def create_tables(self):
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                try:
                    await cursor.execute("""
                        CREATE TABLE IF NOT EXISTS users_tg (
                            user_id BIGINT PRIMARY KEY,
                            username VARCHAR(255),
                            tariff ENUM('Персональный', 'Премиум') DEFAULT 'Персональный',
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                        )
                    """)
                    await cursor.execute("""
                        CREATE TABLE IF NOT EXISTS tickets (
                            ticket_id INT AUTO_INCREMENT PRIMARY KEY,
                            user_id BIGINT,
                            message_type VARCHAR(50),
                            message_content TEXT,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            is_answered BOOLEAN DEFAULT FALSE,
                            FOREIGN KEY (user_id) REFERENCES users_tg(user_id)
                        )
                    """)
                    logger.debug("Таблицы users_tg и tickets успешно созданы или уже существуют в базе mergius_db.")
                except Exception as e:
                    logger.error(f"Ошибка создания таблиц в базе {DB_NAME}: {e}")
                    raise

    async def add_user(self, user_id: int, username: str):
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                try:
                    await cursor.execute(
                        "SELECT user_id FROM users_tg WHERE user_id = %s",
                        (user_id,)
                    )
                    if await cursor.fetchone():
                        logger.debug(f"Пользователь {user_id} уже существует в users_tg.")
                        return
                    await cursor.execute(
                        "INSERT INTO users_tg (user_id, username) VALUES (%s, %s)",
                        (user_id, username)
                    )
                    logger.debug(f"Пользователь {user_id} добавлен в users_tg.")
                except Exception as e:
                    logger.error(f"Ошибка добавления пользователя {user_id}: {e}")

    async def add_ticket(self, user_id: int, message_type: str, message_content: str) -> int:
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                try:
                    await cursor.execute(
                        "INSERT INTO tickets (user_id, message_type, message_content) VALUES (%s, %s, %s)",
                        (user_id, message_type, message_content)
                    )
                    await cursor.execute("SELECT LAST_INSERT_ID()")
                    ticket_id = (await cursor.fetchone())[0]
                    logger.debug(f"Заявка #{ticket_id} создана для пользователя {user_id}.")
                    return ticket_id
                except Exception as e:
                    logger.error(f"Ошибка добавления заявки для пользователя {user_id}: {e}")
                    return 0

    async def mark_ticket_answered(self, ticket_id: int):
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                try:
                    await cursor.execute(
                        "UPDATE tickets SET is_answered = TRUE WHERE ticket_id = %s",
                        (ticket_id,)
                    )
                    logger.debug(f"Заявка #{ticket_id} помечена как отвеченная.")
                except Exception as e:
                    logger.error(f"Ошибка обновления заявки #{ticket_id}: {e}")

    async def get_unanswered_tickets(self) -> list:
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                try:
                    await cursor.execute("SELECT * FROM tickets WHERE is_answered = FALSE")
                    tickets = await cursor.fetchall()
                    logger.debug(f"Получено {len(tickets)} неотвеченных заявок.")
                    return tickets
                except Exception as e:
                    logger.error(f"Ошибка получения неотвеченных заявок: {e}")
                    return []

    async def get_users(self) -> list:
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                try:
                    await cursor.execute("SELECT user_id, username, tariff FROM users_tg")
                    users = await cursor.fetchall()
                    logger.debug(f"Получено {len(users)} пользователей Telegram.")
                    return users
                except Exception as e:
                    logger.error(f"Ошибка получения пользователей Telegram: {e}")
                    return []

    async def get_user(self, user_id: int) -> dict:
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                try:
                    await cursor.execute(
                        "SELECT user_id, username, tariff FROM users_tg WHERE user_id = %s",
                        (user_id,)
                    )
                    user = await cursor.fetchone()
                    logger.debug(f"Данные пользователя {user_id} получены: {user}.")
                    return user
                except Exception as e:
                    logger.error(f"Ошибка получения пользователя {user_id}: {e}")
                    return None

    async def update_tariff(self, user_id: int, tariff: str):
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                try:
                    await cursor.execute(
                        "UPDATE users_tg SET tariff = %s WHERE user_id = %s",
                        (tariff, user_id)
                    )
                    logger.debug(f"Тариф пользователя {user_id} обновлён на {tariff}.")
                except Exception as e:
                    logger.error(f"Ошибка обновления тарифа для пользователя {user_id}: {e}")

    async def get_site_users(self) -> list:
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                try:
                    await cursor.execute("SELECT user_id, username, country, account_type_id FROM Users")
                    users = await cursor.fetchall()
                    logger.debug(f"Получено {len(users)} пользователей сайта.")
                    return users
                except Exception as e:
                    logger.error(f"Ошибка получения пользователей сайта: {e}")
                    return []

    async def get_site_user(self, user_id: int) -> dict:
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cursor:
                try:
                    await cursor.execute(
                        "SELECT user_id, username, country, account_type_id FROM Users WHERE user_id = %s",
                        (user_id,)
                    )
                    user = await cursor.fetchone()
                    logger.debug(f"Данные пользователя сайта {user_id} получены: {user}.")
                    return user
                except Exception as e:
                    logger.error(f"Ошибка получения пользователя сайта {user_id}: {e}")
                    return None

    async def update_site_tariff(self, user_id: int, tariff: str):
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                try:
                    await cursor.execute(
                        "UPDATE Users SET account_type_id = %s WHERE user_id = %s",
                        (tariff, user_id)
                    )
                    logger.debug(f"Тариф пользователя сайта {user_id} обновлён на {tariff}.")
                except Exception as e:
                    logger.error(f"Ошибка обновления тарифа для пользователя сайта {user_id}: {e}")

    async def get_stats(self) -> dict:
        if not self.pool:
            raise RuntimeError("Пул соединений не инициализирован.")
        async with self.pool.acquire() as conn:
            async with conn.cursor() as cursor:
                try:
                    await cursor.execute("SELECT COUNT(*) FROM users_tg")
                    bot_users = (await cursor.fetchone())[0]
                    await cursor.execute("SELECT COUNT(*) FROM Users")
                    site_users = (await cursor.fetchone())[0]
                    await cursor.execute("SELECT COUNT(*) FROM tickets WHERE is_answered = FALSE")
                    open_tickets = (await cursor.fetchone())[0]
                    stats = {
                        "bot_users": bot_users,
                        "site_users": site_users,
                        "open_tickets": open_tickets
                    }
                    logger.debug(f"Статистика получена: {stats}.")
                    return stats
                except Exception as e:
                    logger.error(f"Ошибка получения статистики: {e}")
                    return None

    async def close(self):
        if self.pool:
            self.pool.close()
            await self.pool.wait_closed()
            logger.info("Пул соединений закрыт.")