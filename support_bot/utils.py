import aiohttp
import logging
from config import SITE_URL

logger = logging.getLogger(__name__)

async def check_site():
    """Check if the website is operational by sending an HTTP GET request."""
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(SITE_URL, timeout=5) as response:
                if response.status == 200:
                    return "Сайт работает."
                else:
                    return f"Сайт не работает (код ответа: {response.status})."
        except aiohttp.ClientConnectionError as e:
            return f"Сайт не работает (ошибка соединения: {e})."
        except aiohttp.ClientTimeout:
            return "Сайт не работает (таймаут запроса)."
        except Exception as e:
            return f"Сайт не работает (ошибка: {e})."