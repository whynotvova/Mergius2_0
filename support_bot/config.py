import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN")
ADMIN_IDS = [int(admin_id) for admin_id in os.getenv("ADMIN_IDS", "").split(",") if admin_id]

# Параметры базы данных из .env
DB_HOST = os.getenv("MYSQL_HOST", "db")
DB_USER = os.getenv("MYSQL_USER", "mergius_user")
DB_PASSWORD = os.getenv("MYSQL_PASSWORD", "mergius170905!")
DB_NAME = os.getenv("MYSQL_DATABASE", "mergius_db")
DB_PORT = int(os.getenv("MYSQL_PORT", 3306))
SITE_URL = os.getenv("SITE_URL", "https://mergius.ru")