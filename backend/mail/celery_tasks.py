from celery import shared_task
from profile_user.models import UserEmailAccount
from .tasks import fetch_emails_task
import logging

logger = logging.getLogger(__name__)

@shared_task
def fetch_emails_periodically():
    logger.info("Starting periodic email fetch for all users")
    email_accounts = UserEmailAccount.objects.all()
    total_accounts = email_accounts.count()
    logger.info(f"Found {total_accounts} email accounts to process")

    if total_accounts == 0:
        logger.warning("No email accounts found for periodic fetch")
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

    logger.info(f"Scheduled fetch for {processed_accounts} of {total_accounts} email accounts")