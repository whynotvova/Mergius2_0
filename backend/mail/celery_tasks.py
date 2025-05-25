from celery import shared_task
from profile_user.models import UserEmailAccount
from .tasks import fetch_emails_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def fetch_emails_periodically():
    logger.info("Начало периодической выборки писем для всех пользователей")
    email_accounts = UserEmailAccount.objects.all()
    total_accounts = email_accounts.count()
    logger.info(f"Найдено {total_accounts} почтовых аккаунтов для обработки")

    if total_accounts == 0:
        logger.warning("Почтовые аккаунты для периодической выборки не найдены")
        return

    processed_accounts = 0
    for email_account in email_accounts:
        try:
            logger.debug(f"Scheduling fetch for {email_account.email_address} (user {email_account.user.user_id})")
            fetch_emails_task.delay(email_account.email_account_id, force_refresh=False)
            processed_accounts += 1
        except Exception as e:
            logger.error(f"Error scheduling fetch for {email_account.email_address}: {str(e)}")
            continue

    logger.info(f"Запланирована выборка для {processed_accounts} из {total_accounts} почтовых аккаунтов")