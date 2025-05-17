from celery import shared_task
from profile_user.models import UserEmailAccount, Emails, MailFolder, EmailFolderAssignment, Email_Recipients, EmailAttachment, AuditLog
from django.utils import timezone
from django.db import transaction
from django.conf import settings
from django.core.mail import send_mail
import logging
import imaplib
import email
from email.header import decode_header
from email.utils import parsedate_to_datetime
import socket
from django.db.utils import OperationalError
import time

logger = logging.getLogger(__name__)

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False

CATEGORY_RULES = {
    'Чаты': [
        'чат', 'сообщение', 'диалог', 'переписка', 'мессенджер', 'message',
        'conversation', 'messenger', 'group chat', 'групповой чат',
        'instant message', 'им', 'dm', 'direct message', 'прямое сообщение'
    ],
    'Социальные сети': [
        'вк', 'вконтакте', 'instagram', 'facebook', 'twitter', 'x.com', 'одноклассники',
        'linkedin', 'tiktok', 'snapchat', 'pinterest', 'reddit', 'whatsapp', 'telegram',
        'viber', 'signal', 'social', 'discord', 'slack', 'skype', 'zoom', 'teams',
        'социальная сеть', 'профиль', 'пост', 'post', 'like', 'лайк', 'follow',
        'подписка', 'share', 'поделиться', 'comment', 'комментарий', 'hashtag',
        'хэштег', 'story', 'история', 'reels', 'видео', 'network', 'сеть',
        'friend request', 'запрос в друзья'
    ],
    'Удаленные': [
        'удален', 'удалено', 'удаление', 'deleted', 'delete', 'trash', 'корзина',
        'spam', 'спам', 'unsubscribe', 'отписаться', 'archive', 'архив', 'clean',
        'очистка', 'junk', 'мусор', 'remove', 'удалить', 'clear', 'очистить',
        'unwanted', 'нежелательный'
    ],
    'Покупки': [
        'покупка', 'заказ', 'доставка', 'чек', 'оплата', 'инвойс', 'purchase',
        'order', 'delivery', 'receipt', 'payment', 'invoice', 'shop', 'магазин',
        'cart', 'корзина', 'sale', 'распродажа', 'discount', 'скидка', 'amazon',
        'ebay', 'aliexpress', 'ozon', 'wildberries', 'coupon', 'купон', 'promo',
        'промокод', 'checkout', 'оформление заказа', 'refund', 'возврат', 'deal',
        'сделка'
    ],
    'Анонимные': [
        'аноним', 'анонимный', 'anonymous', 'privacy', 'приватность', 'vpn', 'tor',
        'secure', 'безопасность', 'encrypt', 'шифрование', 'hidden', 'скрытый',
        'incognito', 'инкогнито', 'proxy', 'прокси', 'dark web', 'темный веб',
        'pseudonym', 'псевдоним', 'burner email', 'одноразовый email'
    ],
    'Новости': [
        'новости', 'новость', 'обзор', 'статья', 'репортаж', 'news', 'article',
        'report', 'update', 'обновление', 'breaking', 'срочные', 'newsletter',
        'рассылка', 'press', 'пресса', 'headline', 'заголовок', 'journal', 'журнал',
        'editorial', 'редакция', 'bulletin', 'бюллетень', 'digest', 'дайджест'
    ],
    'Игры': [
        'игра', 'игры', 'гейминг', 'game', 'gaming', 'gamer', 'steam', 'playstation',
        'xbox', 'nintendo', 'esports', 'квест', 'quest', 'multiplayer',
        'многопользовательский', 'battle', 'битва', 'fortnite', 'minecraft', 'roblox',
        'twitch', 'stream', 'стрим', 'tournament', 'турнир', 'mod', 'мод', 'patch',
        'патч'
    ],
    'Билеты': [
        'билет', 'билеты', 'ticket-bin' if 'ticket' else 'tickets', 'booking', 'бронирование',
        'reservation', 'перелет', 'рейс', 'flight', 'train', 'поезд', 'bus',
        'автобус', 'event', 'мероприятие', 'concert', 'концерт', 'theater', 'театр',
        'cinema', 'кино', 'festival', 'фестиваль', 'show', 'шоу', 'pass', 'пропуск',
        'boarding', 'посадка'
    ],
    'Работа': [
        'работа', 'вакансия', 'резюме', 'собеседование', 'job', 'vacancy', 'resume',
        'interview', 'career', 'карьера', 'employment', 'трудоустройство', 'salary',
        'зарплата', 'freelance', 'фриланс', 'project', 'проект', 'promotion',
        'повышение', 'recruitment', 'наем', 'hiring', 'найм', 'contract', 'контракт',
        'internship', 'стажировка'
    ],
    'Личное': [
        'личное', 'персональное', 'семья', 'друг', 'любовь', 'personal', 'family',
        'friend', 'love', 'birthday', 'день рождения', 'wedding', 'свадьба',
        'invitation', 'приглашение', 'hobby', 'хобби', 'photo', 'фото', 'memory',
        'воспоминание', 'gift', 'подарок', 'anniversary', 'годовщина', 'attachment',
        'вложение', 'greeting', 'поздравление'
    ],
    'Gmail': ['gmail'],
    'Mail.ru': ['mail.ru'],
    'Yandex': ['yandex'],
    'Outlook': ['outlook'],
    'Yahoo': ['yahoo'],
    'AOL': ['aol']
}

def assign_email_to_categories(email, categories):
    try:
        logger.debug(f"Assigning categories {categories} to email {email.email_id}")
        assignments = []
        existing_assignments = EmailFolderAssignment.objects.filter(
            email=email
        ).values('folder__folder_id')
        existing_folder_ids = {assignment['folder__folder_id'] for assignment in existing_assignments}

        for category in categories:
            folder = MailFolder.objects.filter(
                folder_name__iexact=category,
                email_account=email.email_account
            ).first()
            if folder:
                if folder.folder_id not in existing_folder_ids:
                    assignments.append(
                        EmailFolderAssignment(email=email, folder=folder)
                    )
                    logger.debug(f"Prepared assignment for email {email.email_id} to folder {folder.folder_name}")
                else:
                    logger.debug(f"Skipping duplicate assignment for email {email.email_id} to folder {folder.folder_name}")
            else:
                logger.warning(f"No folder found for category '{category}' for email account {email.email_account.email_address}")

        if assignments:
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    with transaction.atomic():
                        EmailFolderAssignment.objects.bulk_create(assignments, ignore_conflicts=True)
                        logger.info(f"Assigned {len(assignments)} categories to email {email.email_id}")
                        client_ip = 'celery_worker'
                        AuditLog.objects.create(
                            user=email.email_account.user,
                            action='Автоматическое назначение категорий',
                            details=f"Письмо {email.email_id} отнесено к категориям: {', '.join(categories)}",
                            ip_address=client_ip,
                            timestamp=timezone.now()
                        )
                    break
                except OperationalError as e:
                    if '1213' in str(e):
                        logger.warning(f"Deadlock detected in assign_email_to_categories on attempt {attempt + 1}/{max_retries}. Retrying...")
                        time.sleep(0.5 * (attempt + 1))
                        if attempt == max_retries - 1:
                            logger.error(f"Failed to assign categories for email {email.email_id} after {max_retries} attempts: {str(e)}")
                            raise
                    else:
                        logger.error(f"Database error in assign_email_to_categories: {str(e)}")
                        raise
        else:
            logger.info(f"No new assignments created for email {email.email_id}")

    except Exception as e:
        logger.error(f"Error assigning categories for email {email.email_id}: {str(e)}", exc_info=True)
        raise

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def categorize_email_task(self, email_id):
    try:
        logger.debug(f"Starting categorization for email {email_id}")
        email = Emails.objects.get(email_id=email_id)
        user_folders = MailFolder.objects.filter(
            email_account=email.email_account
        ).values_list('folder_name', flat=True)
        user_folders_lower = [f.lower() for f in user_folders]
        existing_assignments = EmailFolderAssignment.objects.filter(
            email=email
        ).values_list('folder__folder_name', flat=True)
        existing_folders_lower = [f.lower() for f in existing_assignments]

        content = f"{email.subject} {email.sender} {email.body[:1000]}".lower()
        categories = []
        sender_domain = email.sender.lower().split('@')[-1].split('.')[-2] if '@' in email.sender else ''
        for service, keywords in CATEGORY_RULES.items():
            if service in ('Gmail', 'Mail.ru', 'Yandex', 'Outlook', 'Yahoo', 'AOL'):
                if sender_domain in keywords and service.lower() in user_folders_lower:
                    if service.lower() not in existing_folders_lower:
                        categories.append(service)
                        logger.debug(f"Matched service category '{service}' for sender domain '{sender_domain}'")
        for category, keywords in CATEGORY_RULES.items():
            if category in ('Gmail', 'Mail.ru', 'Yandex', 'Outlook', 'Yahoo', 'AOL'):
                continue
            if category.lower() in user_folders_lower:
                for keyword in keywords:
                    if keyword.lower() in content:
                        if category.lower() not in existing_folders_lower:
                            categories.append(category)
                            logger.debug(f"Matched category '{category}' for keyword '{keyword}'")
                        break

        if categories:
            assign_email_to_categories(email, categories)
            logger.info(f"Email {email_id} categorized into: {categories}")
        else:
            logger.info(f"No new categories assigned for email {email_id} (already categorized or no matches)")

    except Emails.DoesNotExist:
        logger.error(f"Email {email_id} not found")
    except Exception as e:
        logger.error(f"Unexpected error categorizing email {email_id}: {str(e)}", exc_info=True)
        raise self.retry(countdown=2**self.request.retries * 60)

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def categorize_existing_emails_task(self, email_account_id):
    logger.info(f"Starting categorize_existing_emails_task for account {email_account_id}")
    try:
        email_account = UserEmailAccount.objects.get(email_account_id=email_account_id)
        logger.debug(f"Retrieved email account: {email_account.email_address}")
        emails = Emails.objects.filter(email_account=email_account)
        total_emails = emails.count()
        logger.info(f"Found {total_emails} emails to categorize for {email_account.email_address}")

        batch_size = 100
        processed = 0

        for i in range(0, total_emails, batch_size):
            batch = emails[i:i + batch_size]
            logger.info(f"Processing batch {i//batch_size + 1} of {len(batch)} emails")

            for email in batch:
                try:
                    categorize_email_task.delay(email.email_id)
                    processed += 1
                    logger.debug(f"Triggered categorization for email {email.email_id}")
                except Exception as e:
                    logger.error(f"Error triggering categorization for email {email.email_id}: {str(e)}", exc_info=True)
                    continue

            logger.info(f"Completed batch: {len(batch)} emails. Total processed: {processed}")

        logger.info(f"Completed categorizing {processed} emails for {email_account.email_address}")

    except UserEmailAccount.DoesNotExist:
        logger.error(f"Email account {email_account_id} not found")
    except Exception as e:
        logger.error(f"Unexpected error in categorize_existing_emails_task for account {email_account_id}: {str(e)}", exc_info=True)
        try:
            raise self.retry(countdown=2**self.request.retries * 300)
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for categorize_existing_emails_task for account {email_account_id}")
            send_mail(
                subject='Email Categorization Failure',
                message=f"Failed to categorize existing emails for account {email_account_id} after retries: {str(e)}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.ADMIN_EMAIL],
                fail_silently=True,
            )

@shared_task(bind=True, max_retries=3, default_retry_delay=300)
def fetch_emails_task(self, email_account_id, force_refresh=False):
    logger.info(f"Starting fetch_emails_task for account {email_account_id} with force_refresh={force_refresh}")
    imap = None
    try:
        email_account = UserEmailAccount.objects.get(email_account_id=email_account_id)
        logger.debug(f"Retrieved email account: {email_account.email_address}")

        imap_server = email_account.service.imap_server
        imap_port = email_account.service.imap_port
        logger.debug(f"Connecting to IMAP server {imap_server}:{imap_port}")
        imap = imaplib.IMAP4_SSL(imap_server, imap_port, timeout=30)

        try:
            if email_account.oauth_token and email_account.service.service_name.lower() == 'gmail' and GOOGLE_AUTH_AVAILABLE:
                logger.debug(f"Using OAuth for {email_account.email_address}")
                imap.authenticate('XOAUTH2', lambda _: f"user={email_account.email_address}\1auth=Bearer {email_account.oauth_token}\1\1".encode())
            else:
                password = email_account.password or ''
                logger.debug(f"Using password authentication for {email_account.email_address}")
                imap.login(email_account.email_address, password)
        except imaplib.IMAP4.error as auth_error:
            logger.error(f"Authentication failed for {email_account.email_address}: {str(auth_error)}")
            raise self.retry(countdown=2**self.request.retries * 60, exc=auth_error)

        try:
            status, data = imap.select('INBOX')
            if status != 'OK':
                logger.error(f"Failed to select INBOX for {email_account.email_address}: {data}")
                raise imaplib.IMAP4.error(f"Failed to select INBOX: {data}")
            logger.debug(f"Selected INBOX for {email_account.email_address}")
        except imaplib.IMAP4.error as e:
            logger.error(f"IMAP error selecting INBOX for {email_account.email_address}: {str(e)}")
            raise self.retry(countdown=2**self.request.retries * 60, exc=e)

        status, data = imap.uid('SEARCH', None, 'ALL')
        if status != 'OK' or not data or not isinstance(data[0], bytes):
            logger.warning(f"No email data found in INBOX for {email_account.email_address}: {data}")
            return

        email_good = data[0].split()
        total_emails = len(email_good)
        logger.info(f"Found {total_emails} emails in INBOX for {email_account.email_address}")

        batch_size = 100
        last_fetched_uid = 0 if force_refresh else (email_account.last_fetched_uid or 0)
        max_uid = last_fetched_uid
        total_fetched = 0
        while True:
            new_uids = [uid for uid in email_good if int(uid.decode('utf-8')) > last_fetched_uid][:batch_size]
            if not new_uids:
                logger.info(f"No more new emails after UID {last_fetched_uid} for {email_account.email_address}")
                break

            logger.info(f"Processing batch of {len(new_uids)} new emails after UID {last_fetched_uid}")
            batch_fetched = 0

            for email_uid in new_uids:
                try:
                    email_uid_str = email_uid.decode('utf-8')
                    logger.debug(f"Fetching email UID {email_uid_str}")
                    status, msg_data = imap.uid('FETCH', email_uid_str, '(RFC822 FLAGS)')
                    if status != 'OK' or not msg_data[0]:
                        logger.warning(f"Failed to fetch email {email_uid_str} for {email_account.email_address}: {msg_data}")
                        continue

                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)
                    flags_data = msg_data[0][0].decode('utf-8')
                    email_status = 'read' if r'\Seen' in flags_data else 'unread'

                    imap_id = email_uid_str
                    message_id = msg['Message-ID'] if msg['Message-ID'] else imap_id

                    subject = ''
                    if msg['Subject']:
                        subject_data = decode_header(msg['Subject'])
                        decoded_part = subject_data[0] if subject_data else ('No Subject', None)
                        subject_content, encoding = decoded_part if isinstance(decoded_part, tuple) else (
                            decoded_part, None)
                        if isinstance(subject_content, bool):
                            subject = 'No Subject'
                        elif isinstance(subject_content, bytes):
                            try:
                                subject = subject_content.decode(encoding or 'utf-8')
                            except Exception as e:
                                logger.error(f"Error decoding subject for email {email_uid_str}: {str(e)}")
                                subject = 'No Subject'
                        elif isinstance(subject_content, str):
                            subject = subject_content
                        else:
                            subject = 'No Subject'
                    else:
                        subject = 'No Subject'

                    sender = ''
                    if msg['From']:
                        sender_data = decode_header(msg['From'])
                        decoded_part = sender_data[0] if sender_data else ('Unknown Sender', None)
                        sender_content, encoding = decoded_part if isinstance(decoded_part, tuple) else (
                            decoded_part, None)
                        if isinstance(sender_content, bool):
                            sender = 'Unknown Sender'
                        elif isinstance(sender_content, bytes):
                            try:
                                sender = sender_content.decode(encoding or 'utf-8')
                            except Exception as e:
                                logger.error(f"Error decoding sender for email {email_uid_str}: {str(e)}")
                                sender = 'Unknown Sender'
                        elif isinstance(sender_content, str):
                            sender = sender_content
                        else:
                            sender = 'Unknown Sender'
                    else:
                        sender = 'Unknown Sender'

                    recipients = {'TO': [], 'CC': [], 'BCC': []}
                    for field in ['To', 'Cc', 'Bcc']:
                        if msg[field]:
                            recipient_data = decode_header(msg[field])
                            for decoded_part in recipient_data:
                                recipient_content, encoding = decoded_part if isinstance(decoded_part, tuple) else (
                                    decoded_part, None)
                                if isinstance(recipient_content, bytes):
                                    try:
                                        recipient_content = recipient_content.decode(encoding or 'utf-8')
                                    except Exception as e:
                                        logger.error(f"Error decoding {field} for email {email_uid_str}: {str(e)}")
                                        continue
                                if isinstance(recipient_content, str):
                                    recipients[field.upper()] = recipient_content.split(', ')
                                else:
                                    recipients[field.upper()] = []

                    body = ''
                    if msg.is_multipart():
                        for part in msg.walk():
                            if part.get_content_type() == 'text/plain':
                                payload = part.get_payload(decode=True)
                                if payload and isinstance(payload, bytes):
                                    body = payload.decode('utf-8', errors='ignore')
                                else:
                                    logger.warning(
                                        f"Invalid payload for email {email_uid_str} in account {email_account.email_address}")
                                break
                    else:
                        payload = msg.get_payload(decode=True)
                        if payload and isinstance(payload, bytes):
                            body = payload.decode('utf-8', errors='ignore')
                        else:
                            logger.warning(
                                f"Invalid payload for email {email_uid_str} in account {email_account.email_address}")

                    sent_date = None
                    if msg['Date']:
                        try:
                            sent_date = parsedate_to_datetime(msg['Date'])
                            if sent_date and not settings.USE_TZ:
                                sent_date = timezone.make_naive(sent_date)
                        except (TypeError, ValueError) as e:
                            logger.warning(
                                f"Invalid date format for email {email_uid_str} in {email_account.email_address}: {msg['Date']}. Error: {str(e)}. Using current timestamp.")
                            sent_date = timezone.now()
                            if not settings.USE_TZ:
                                sent_date = timezone.make_naive(sent_date)

                    received_date = timezone.now()
                    if not settings.USE_TZ:
                        received_date = timezone.make_naive(received_date)

                    with transaction.atomic():
                        email_obj, created = Emails.objects.update_or_create(
                            email_account=email_account,
                            imap_id=imap_id,
                            defaults={
                                'message_id': message_id,
                                'sender': sender,
                                'subject': subject,
                                'body': body,
                                'sent_date': sent_date,
                                'received_date': received_date,
                                'status': email_status
                            }
                        )

                        Email_Recipients.objects.filter(email=email_obj).delete()
                        recipient_objects = []
                        for recipient_type, addresses in recipients.items():
                            for address in addresses:
                                if address.strip():
                                    recipient_objects.append(
                                        Email_Recipients(
                                            email=email_obj,
                                            recipient_address=address.strip(),
                                            recipient_type=recipient_type
                                        )
                                    )
                        if recipient_objects:
                            Email_Recipients.objects.bulk_create(recipient_objects, ignore_conflicts=True)
                        inbox_folder = MailFolder.objects.filter(
                            email_account=email_account,
                            folder_name__iexact='Входящие'
                        ).first()
                        if inbox_folder:
                            EmailFolderAssignment.objects.get_or_create(
                                email=email_obj,
                                folder=inbox_folder
                            )
                            logger.debug(f"Assigned email {email_obj.email_id} to INBOX folder")

                    batch_fetched += 1
                    total_fetched += 1
                    max_uid = max(max_uid, int(email_uid_str))
                    logger.debug(f"Processed email {email_uid_str} for {email_account.email_address} (Status: {email_status})")
                    categorize_email_task.delay(email_obj.email_id)

                except Exception as e:
                    logger.error(f"Error processing email {email_uid} for {email_account.email_address}: {str(e)}", exc_info=True)
                    continue
            email_account.last_fetched_uid = max_uid
            email_account.last_fetched = timezone.now()
            email_account.save()
            last_fetched_uid = max_uid
            logger.info(
                f"Completed batch: {batch_fetched} of {len(new_uids)} emails for {email_account.email_address}. Total fetched: {total_fetched}")

        email_account.last_fetched = timezone.now()
        email_account.last_fetched_uid = max_uid
        email_account.save()
        logger.info(
            f"Completed fetching {total_fetched} new emails for {email_account.email_address} from INBOX")

    except UserEmailAccount.DoesNotExist:
        logger.error(f"Email account {email_account_id} not found")
    except socket.timeout as e:
        logger.error(f"Timeout error fetching emails for account {email_account_id}: {str(e)}", exc_info=True)
        try:
            raise self.retry(exc=e, countdown=2**self.request.retries * 300)
        except self.MaxRetriesExceededError:
            logger.error(f"Max retries exceeded for account {email_account_id}: {str(e)}")
            send_mail(
                subject='Email Fetch Failure',
                message=f"Failed to fetch emails for account {email_account_id} after retries: {str(e)}",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.ADMIN_EMAIL],
                fail_silently=True,
            )
    except imaplib.IMAP4.error as e:
        logger.error(f"IMAP error for account {email_account_id}: {str(e)}", exc_info=True)
        raise self.retry(countdown=2**self.request.retries * 60, exc=e)
    except Exception as e:
        logger.error(f"Unexpected error fetching emails for account {email_account_id}: {str(e)}", exc_info=True)
        raise self.retry(countdown=2**self.request.retries * 60, exc=e)
    finally:
        if imap:
            try:
                imap.logout()
            except Exception as e:
                logger.warning(f"Error during IMAP logout for account {email_account_id}: {str(e)}")