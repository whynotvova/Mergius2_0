from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from profile_user.models import UserEmailAccount, EmailService, AuditLog, MailFolder, Emails, Email_Recipients, EmailFolderAssignment, EmailAttachment
from profile_user.serializers import UserEmailAccountSerializer, EmailServiceSerializer, MailFolderSerializer, EmailSerializer, EmailFolderAssignmentSerializer, EmailAttachmentSerializer, AssignCategoriesSerializer, TranslateEmailSerializer, SendEmailSerializer
from django.db import transaction
from django.db.models import Q, Count
from django.core.paginator import Paginator
import logging
import imaplib
import smtplib
import requests
import email
from email.header import decode_header
from email.utils import parsedate_to_datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import base64

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False

import os
from django.conf import settings
from datetime import timedelta
import schedule
import time
import threading
import uuid

logger = logging.getLogger(__name__)

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', 'unknown')

    if ip in ('127.0.0.1', '::1', 'unknown'):
        try:
            response = requests.get('https://api.ipify.org?format=json', timeout=5)
            response.raise_for_status()
            ip_data = response.json()
            ip = ip_data.get('ip', 'unknown')
        except requests.RequestException as e:
            logger.error(f"Error fetching public IP: {str(e)}")
            ip = 'unknown'
    return ip

def fetch_email_avatar(email_account):
    try:
        logger.debug(f"Fetching avatar for {email_account.email_address}")
        imap_server = email_account.service.imap_server
        imap_port = email_account.service.imap_port
        imap = imaplib.IMAP4_SSL(imap_server, imap_port, timeout=30)
        if email_account.oauth_token and GOOGLE_AUTH_AVAILABLE:
            logger.debug(f"Using OAuth for {email_account.email_address}")
            imap.authenticate('XOAUTH2', lambda
                _: f"user={email_account.email_address}\1auth=Bearer {email_account.oauth_token}\1\1".encode())
        else:
            password = email_account.password or ''
            logger.debug(f"Using password authentication for {email_account.email_address}")
            imap.login(email_account.email_address, password)

        imap.select('INBOX')
        status, data = imap.fetch('1', '(BODY[HEADER.FIELDS (FROM)])')
        if status == 'OK':
            msg = email.message_from_bytes(data[0][1])
            avatar_url = f'https://api.adorable.io/avatars/100/{email_account.email_address}'
            email_account.avatar = avatar_url
            email_account.save()
            logger.debug(f"Avatar set for {email_account.email_address}: {avatar_url}")
        else:
            logger.warning(f"Failed to fetch header for avatar for {email_account.email_address}: {data}")

        imap.logout()
    except imaplib.IMAP4.error as e:
        logger.error(f"IMAP error fetching avatar for {email_account.email_address}: {str(e)}")
        error_str = str(e).lower()
        if "application-specific password required" in error_str or "neobhodim parol prilozheniya" in error_str:
            logger.error(
                f"Application-specific password required for {email_account.email_address}. See provider's security settings.")
        elif "invalid credentials" in error_str:
            logger.error(
                f"Invalid credentials for {email_account.email_address}. Ensure correct password or OAuth token.")
        email_account.avatar = '/images/mail/default-avatar.png'
        email_account.save()
    except Exception as e:
        logger.error(f"Unexpected error fetching avatar for {email_account.email_address}: {str(e)}")
        email_account.avatar = '/images/mail/default-avatar.png'
        email_account.save()

def fetch_emails(email_account, force_refresh=False):
    try:
        logger.debug(f"Starting email fetch for {email_account.email_address}")

        imap_server = email_account.service.imap_server
        imap_port = email_account.service.imap_port
        imap = imaplib.IMAP4_SSL(imap_server, imap_port, timeout=30)

        if email_account.oauth_token and email_account.service.service_name.lower() == 'gmail' and GOOGLE_AUTH_AVAILABLE:
            logger.debug(f"Using OAuth 2.0 for {email_account.email_address}")
            try:
                imap.authenticate('XOAUTH2', lambda
                    _: f"user={email_account.email_address}\1auth=Bearer {email_account.oauth_token}\1\1".encode())
            except imaplib.IMAP4.error as e:
                logger.error(f"OAuth authentication failed for {email_account.email_address}: {str(e)}")
                return
        else:
            logger.debug(f"Using password authentication for {email_account.email_address}")
            if email_account.oauth_token and not GOOGLE_AUTH_AVAILABLE:
                logger.warning(
                    f"OAuth token provided for {email_account.email_address}, but google-auth-oauthlib is not installed.")
                return
            password = email_account.password or ''
            try:
                imap.login(email_account.email_address, password)
            except imaplib.IMAP4.error as e:
                error_str = str(e).lower()
                if "application-specific password required" in error_str or "neobhodim parol prilozheniya" in error_str:
                    logger.error(
                        f"Application-specific password required for {email_account.email_address}. See provider's security settings.")
                    return
                elif "invalid credentials" in error_str:
                    logger.error(
                        f"Invalid credentials for {email_account.email_address}. Ensure an application-specific password is used.")
                    return
                else:
                    logger.error(f"IMAP login error for {email_account.email_address}: {str(e)}")
                    raise e

        status, folders = imap.list()
        if status != 'OK':
            logger.error(f"Failed to list folders for {email_account.email_address}: {folders}")
            imap.logout()
            return

        folder_candidates = ['INBOX']
        if email_account.service.service_name.lower() == 'gmail':
            folder_candidates.append('[Gmail]/All Mail')

        selected_folder = None
        for folder in folder_candidates:
            try:
                status, data = imap.select(folder)
                if status == 'OK':
                    selected_folder = folder
                    logger.debug(f"Selected folder {folder} for {email_account.email_address}")
                    break
                else:
                    logger.warning(f"Failed to select {folder} for {email_account.email_address}: {data}")
            except imaplib.IMAP4.error as e:
                logger.error(f"IMAP error selecting {folder} for {email_account.email_address}: {str(e)}")

        if not selected_folder:
            logger.error(f"Failed to select any folder for {email_account.email_address}. Tried: {folder_candidates}")
            imap.logout()
            return

        search_criteria = 'ALL'
        status, data = imap.uid('SEARCH', None, search_criteria)
        if status != 'OK' or not data or not isinstance(data[0], bytes):
            logger.warning(f"No email data found in {selected_folder} for {email_account.email_address}: {data}")
            imap.logout()
            return

        email_uids = data[0].split()
        logger.info(f"Found {len(email_uids)} emails in {selected_folder} for {email_account.email_address}")

        fetched_count = 0
        max_uid = 0
        for email_uid in email_uids:
            try:
                email_uid_str = email_uid.decode('utf-8')
                status, msg_data = imap.uid('FETCH', email_uid_str, '(RFC822)')
                if status == 'OK' and msg_data[0]:
                    raw_email = msg_data[0][1]
                    msg = email.message_from_bytes(raw_email)

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
                                'status': 'unread'
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
                            Email_Recipients.objects.bulk_create(recipient_objects)

                        inbox_folder = MailFolder.objects.filter(
                            email_account=email_account,
                            folder_name='Входящие'
                        ).first()
                        if inbox_folder:
                            EmailFolderAssignment.objects.get_or_create(
                                email=email_obj,
                                folder=inbox_folder
                            )

                    fetched_count += 1
                    max_uid = max(max_uid, int(email_uid_str))
                    logger.debug(f"Processed email {email_uid_str} for {email_account.email_address}")

                else:
                    logger.warning(
                        f"Failed to fetch email {email_uid_str} for {email_account.email_address}: {msg_data}")

            except (ValueError, UnicodeDecodeError) as e:
                logger.error(f"Error processing email {email_uid} for {email_account.email_address}: {str(e)}")
            except Exception as e:
                logger.error(f"Unexpected error fetching email {email_uid} for {email_account.email_address}: {str(e)}")

        email_account.last_fetched = timezone.now()
        email_account.last_fetched_uid = max_uid if max_uid > 0 else None
        email_account.save()
        logger.info(
            f"Completed fetching {fetched_count} of {len(email_uids)} emails for {email_account.email_address} from {selected_folder}")
        imap.logout()

    except imaplib.IMAP4.error as e:
        logger.error(f"IMAP error fetching emails for {email_account.email_address}: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error fetching emails for {email_account.email_address}: {str(e)}")

def fetch_emails_periodically():
    logger.info("Starting periodic email fetch for all users")
    email_accounts = UserEmailAccount.objects.all()
    for email_account in email_accounts:
        logger.debug(f"Fetching all emails for {email_account.email_address} (user {email_account.user.user_id})")
        fetch_emails(email_account, force_refresh=True)
    logger.info("Completed periodic email fetch")

schedule.every(1).minutes.do(fetch_emails_periodically)

def run_scheduler():
    while True:
        schedule.run_pending()
        time.sleep(60)

scheduler_thread = threading.Thread(target=run_scheduler, daemon=True)
scheduler_thread.start()

class AddEmailAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            service_name = request.data.get('service_name')
            email_address = request.data.get('email_address')
            password = request.data.get('password')
            oauth_token = request.data.get('oauth_token')

            logger.debug(
                f"POST /api/mail/email-accounts/add/ by user {user.user_id} with data: {{service_name: {service_name}, email_address: {email_address}, auth_method: {'OAuth' if oauth_token else 'Password'}}}")

            if not service_name or not email_address:
                logger.error("Missing required fields: service_name or email_address")
                return Response(
                    {'error': 'Service name and email address are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                email_service = EmailService.objects.get(service_name=service_name)
            except EmailService.DoesNotExist:
                logger.error(f"Email service '{service_name}' not found")
                return Response(
                    {'error': f"Email service '{service_name}' not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            existing_accounts = UserEmailAccount.objects.filter(user=user, service=email_service).count()
            if existing_accounts >= 2:
                logger.error(f"User {user.user_id} already has 2 email accounts for service {service_name}")
                return Response(
                    {'error': f'You cannot add more than 2 email accounts for {service_name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if UserEmailAccount.objects.filter(user=user, email_address=email_address).exists():
                logger.error(f"Email address {email_address} already associated with user {user.user_id}")
                return Response(
                    {'error': 'This email address is already associated with your account'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Validate IMAP credentials
            try:
                imap_server = email_service.imap_server
                imap_port = email_service.imap_port
                imap = imaplib.IMAP4_SSL(imap_server, imap_port, timeout=30)
                if oauth_token and service_name.lower() == 'gmail' and GOOGLE_AUTH_AVAILABLE:
                    logger.info(f"Validating OAuth token for {email_address}")
                    imap.authenticate('XOAUTH2',
                                      lambda _: f"user={email_address}\1auth=Bearer {oauth_token}\1\1".encode())
                else:
                    if oauth_token and not GOOGLE_AUTH_AVAILABLE:
                        logger.warning("OAuth token provided, but google-auth-oauthlib is not installed.")
                        return Response(
                            {
                                'error': 'OAuth authentication is not available. Please install google-auth-oauthlib or use an application-specific password.'
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if not password:
                        logger.error("Password required for non-OAuth authentication")
                        return Response(
                            {'error': f'Password is required for {service_name} authentication'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    logger.info(f"Validating password for {email_address}")
                    imap.login(email_address, password)
                imap.logout()
            except imaplib.IMAP4.error as e:
                logger.error(f"IMAP login failed for {email_address}: {str(e)}", exc_info=True)
                error_str = str(e).lower()
                if "application-specific password required" in error_str or "neobhodim parol prilozheniya" in error_str:
                    provider_instructions = {
                        'mail.ru': 'Go to Mail.ru account settings > Security > App passwords to generate an app-specific password.',
                        'gmail': 'Go to Google Account > Security > 2-Step Verification > App passwords to generate an app-specific password, or use OAuth 2.0.'
                    }
                    return Response(
                        {
                            'error': f'An application-specific password is required for {service_name}. {provider_instructions.get(service_name.lower(), "Check your provider’s security settings.")}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif "invalid credentials" in error_str:
                    return Response(
                        {
                            'error': f'Invalid email or password for {email_address}. If 2FA is enabled, use an application-specific password or OAuth token.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    return Response(
                        {
                            'error': f'IMAP login failed for {email_address}: {str(e)}. Please check your credentials or account settings.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                logger.error(f"Unexpected error during IMAP validation for {email_address}: {str(e)}", exc_info=True)
                return Response(
                    {
                        'error': f'Failed to validate IMAP credentials for {email_address}: {str(e)}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create email account
            try:
                with transaction.atomic():
                    email_account = UserEmailAccount.objects.create(
                        user=user,
                        service=email_service,
                        email_address=email_address,
                        avatar='/images/mail/default-avatar.png',
                        oauth_token=oauth_token,
                        last_fetched=None
                    )
                    if password and not oauth_token:
                        email_account.set_password(password)
                    email_account.save()
                    default_folders = [
                        {'name': 'Входящие', 'icon': '/images/mail/folder-inbox-active.png', 'sort_order': 1},
                        {'name': 'Отмеченное', 'icon': '/images/mail/folder-marked.png', 'sort_order': 2},
                        {'name': 'Черновики', 'icon': '/images/mail/folder-drafts.png', 'sort_order': 3},
                        {'name': 'Отправленное', 'icon': '/images/mail/folder-sender.png', 'sort_order': 4},
                        {'name': 'Спам', 'icon': '/images/mail/folder-spam.png', 'sort_order': 5},
                    ]
                    for folder in default_folders:
                        MailFolder.objects.get_or_create(
                            email_account=email_account,
                            folder_name=folder['name'],
                            defaults={
                                'folder_icon': folder['icon'],
                                'sort_order': folder['sort_order']
                            }
                        )

                    # Fetch avatar and emails
                    try:
                        fetch_email_avatar(email_account)
                    except Exception as e:
                        logger.error(f"Failed to fetch avatar for {email_address}: {str(e)}", exc_info=True)
                        email_account.avatar = '/images/mail/default-avatar.png'
                        email_account.save()

                    try:
                        fetch_emails(email_account, force_refresh=True)
                    except Exception as e:
                        logger.error(f"Failed to fetch emails for {email_address}: {str(e)}", exc_info=True)
                        # Continue despite email fetch failure to allow account creation

                    client_ip = get_client_ip(request)
                    AuditLog.objects.create(
                        user=user,
                        action='Добавление почтового ящика',
                        details=f"Добавлен почтовый ящик {email_address} (сервис: {service_name}, метод: {'OAuth' if oauth_token else 'Password'})",
                        ip_address=client_ip,
                        timestamp=timezone.now()
                    )
                    logger.info(f"Email account {email_account.email_address} added for user {user.user_id}")

                serializer = UserEmailAccountSerializer(email_account)
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )

            except Exception as e:
                logger.error(f"Error creating email account for {email_address}: {str(e)}", exc_info=True)
                return Response(
                    {'error': f'Failed to create email account: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.error(f"Unexpected error in AddEmailAccountView for user {user.user_id}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EmailServiceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            services = EmailService.objects.all()
            serializer = EmailServiceSerializer(services, many=True)
            logger.debug(f"GET /api/mail/email-services/ by user {request.user.user_id}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching email services: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FetchEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            logger.debug(f"GET /api/mail/fetch/ by user {request.user.user_id} with params: {request.query_params}")
            force_refresh = request.query_params.get('force_refresh', 'false').lower() == 'true'
            page = int(request.query_params.get('page', 1))
            page_size = int(request.query_params.get('page_size', 20))
            search_query = request.query_params.get('search', '')
            service_name = request.query_params.get('service_name', '')
            filter_param = request.query_params.get('filter', '')
            folder_name = request.query_params.get('folder_name', '')
            emails = Emails.objects.filter(email_account__user=request.user)
            if folder_name:
                folder_exists = MailFolder.objects.filter(
                    email_account__user=request.user,
                    folder_name__iexact=folder_name
                ).exists()
                if folder_exists:
                    emails = emails.filter(
                        folder_assignments__folder__folder_name__iexact=folder_name
                    ).distinct()
                    logger.debug(f"Filtering emails for folder: {folder_name}")
                else:
                    logger.warning(
                        f"Folder '{folder_name}' not found for user {request.user.user_id}. Returning empty email list.")
                    emails = Emails.objects.none()
            if service_name:
                emails = emails.filter(email_account__service__service_name=service_name)
                logger.debug(f"Filtering emails for service: {service_name}")
            if search_query:
                emails = emails.filter(
                    Q(subject__icontains=search_query) |
                    Q(sender__icontains=search_query) |
                    Q(body__icontains=search_query)
                )
                logger.debug(f"Applying search query: {search_query}")
            if filter_param == 'sort-az':
                emails = emails.order_by('subject')
                logger.debug("Sorting emails A-Z")
            elif filter_param == 'sort-date':
                emails = emails.order_by('-sent_date')
                logger.debug("Sorting emails by date")
            else:
                emails = emails.order_by('-received_date')
                logger.debug("Sorting emails by received date (default)")
            total_emails = emails.count()
            unread_count = emails.filter(status='unread').count()
            unread_counts_by_service = Emails.objects.filter(
                email_account__user=request.user,
                status='unread'
            ).values('email_account__service__service_name').annotate(
                count=Count('email_id')
            )
            unread_counts_by_service = {
                item['email_account__service__service_name']: item['count']
                for item in unread_counts_by_service
            }
            logger.debug(f"Unread counts by service for user {request.user.user_id}: {unread_counts_by_service}")
            unread_counts_by_folder = Emails.objects.filter(
                email_account__user=request.user,
                status='unread',
                folder_assignments__folder__email_account__user=request.user
            ).values('folder_assignments__folder__folder_name').annotate(
                count=Count('email_id')
            )
            unread_counts_by_folder = {
                item['folder_assignments__folder__folder_name']: item['count']
                for item in unread_counts_by_folder
            }
            inbox_unread_count = Emails.objects.filter(
                email_account__user=request.user,
                status='unread'
            ).count()
            unread_counts_by_folder['Входящие'] = unread_counts_by_folder.get('Входящие', 0) or inbox_unread_count

            logger.debug(f"Unread counts by folder for user {request.user.user_id}: {unread_counts_by_folder}")
            paginator = Paginator(emails, page_size)
            try:
                page_obj = paginator.page(page)
            except:
                logger.error(f"Invalid page number: {page}")
                return Response({'error': 'Invalid page number'}, status=status.HTTP_400_BAD_REQUEST)
            email_serializer = EmailSerializer(page_obj, many=True)
            folder_serializer = MailFolderSerializer(
                MailFolder.objects.filter(email_account__user=request.user),
                many=True
            )

            response_data = {
                'folders': folder_serializer.data,
                'emails': email_serializer.data,
                'total_emails': total_emails,
                'unread_count': unread_count,
                'unread_counts_by_service': unread_counts_by_service,
                'unread_counts_by_folder': unread_counts_by_folder,
                'current_page': page,
                'total_pages': paginator.num_pages
            }
            if force_refresh:
                email_accounts = UserEmailAccount.objects.filter(user=request.user)
                if service_name:
                    email_accounts = email_accounts.filter(service__service_name=service_name)
                logger.debug(f"Found {len(email_accounts)} email accounts for user {request.user.user_id}")
                for email_account in email_accounts:
                    threading.Thread(target=fetch_emails, args=(email_account, force_refresh), daemon=True).start()

            if not emails.exists():
                logger.info(
                    f"No emails found for user {request.user.user_id} with filters: folder_name={folder_name}, service_name={service_name}, search={search_query}")
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching emails for user {request.user.user_id}: {str(e)}", exc_info=True)
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EmailAccountListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            logger.debug(f"GET /api/mail/email-accounts/ by user {request.user.user_id}")
            email_accounts = UserEmailAccount.objects.filter(user=request.user)
            serializer = UserEmailAccountSerializer(email_accounts, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error fetching email accounts for user {request.user.user_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EmailDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, email_id):
        try:
            logger.debug(f"GET /api/mail/emails/{email_id}/ by user {request.user.user_id}")
            email_obj = Emails.objects.get(email_id=email_id, email_account__user=request.user)
            recipients = Email_Recipients.objects.filter(email=email_obj)
            recipient_addresses = {
                'TO': [],
                'CC': [],
                'BCC': []
            }
            for recipient in recipients:
                recipient_addresses[recipient.recipient_type].append(recipient.recipient_address)
            data = {
                'email_id': email_obj.email_id,
                'subject': email_obj.subject,
                'sender': email_obj.sender,
                'recipient_addresses': recipient_addresses,
                'body': email_obj.body,
                'sent_date': email_obj.sent_date,
                'attachments': EmailAttachmentSerializer(email_obj.attachments.all(), many=True).data
            }
            return Response(data, status=status.HTTP_200_OK)
        except Emails.DoesNotExist:
            logger.error(f"Email {email_id} not found for user {request.user.user_id}")
            return Response({'error': 'Email not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching email {email_id} for user {request.user.user_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, email_id):
        try:
            logger.debug(f"PATCH /api/mail/emails/{email_id}/ by user {request.user.user_id}")
            email_obj = Emails.objects.get(email_id=email_id, email_account__user=request.user)
            status_value = request.data.get('status')
            if status_value not in ['read', 'unread']:
                logger.error(f"Invalid status value: {status_value}")
                return Response(
                    {'error': 'Invalid status value. Must be "read" or "unread"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            email_obj.status = status_value
            email_obj.save()

            client_ip = get_client_ip(request)
            AuditLog.objects.create(
                user=request.user,
                action='Обновление статуса письма',
                details=f"Письмо {email_id} обновлено до статуса {status_value}",
                ip_address=client_ip,
                timestamp=timezone.now()
            )
            logger.info(f"Email {email_id} status updated to {status_value} for user {request.user.user_id}")
            return Response({'status': email_obj.status}, status=status.HTTP_200_OK)
        except Emails.DoesNotExist:
            logger.error(f"Email {email_id} not found for user {request.user.user_id}")
            return Response({'error': 'Email not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error updating email {email_id} for user {request.user.user_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, email_id):
        try:
            logger.debug(f"DELETE /api/mail/emails/{email_id}/ by user {request.user.user_id}")
            email_obj = Emails.objects.get(email_id=email_id, email_account__user=request.user)
            with transaction.atomic():
                Email_Recipients.objects.filter(email=email_obj).delete()
                EmailFolderAssignment.objects.filter(email=email_obj).delete()
                EmailAttachment.objects.filter(email=email_obj).delete()
                email_obj.delete()

                client_ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=request.user,
                    action='Удаление письма',
                    details=f"Письмо {email_id} удалено",
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
            logger.info(f"Email {email_id} deleted for user {request.user.user_id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Emails.DoesNotExist:
            logger.error(f"Email {email_id} not found for user {request.user.user_id}")
            return Response({'error': 'Email not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting email {email_id} for user {request.user.user_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EmailFolderAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.debug(f"POST /api/mail/emails/assign-folder/ by user {request.user.user_id}")
            email_ids = request.data.get('email_ids', [])
            folder_id = request.data.get('folder_id')

            if not email_ids or not folder_id:
                logger.error("Missing email_ids or folder_id")
                return Response(
                    {'error': 'email_ids and folder_id are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                folder = MailFolder.objects.get(folder_id=folder_id, email_account__user=request.user)
            except MailFolder.DoesNotExist:
                logger.error(f"Folder {folder_id} not found for user {request.user.user_id}")
                return Response(
                    {'error': 'Folder not found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            emails = Emails.objects.filter(email_id__in=email_ids, email_account__user=request.user)
            if not emails.exists():
                logger.error(f"No valid emails found for IDs: {email_ids}")
                return Response(
                    {'error': 'No valid emails found'},
                    status=status.HTTP_404_NOT_FOUND
                )

            with transaction.atomic():
                for email_obj in emails:
                    EmailFolderAssignment.objects.get_or_create(
                        email=email_obj,
                        folder=folder
                    )

                client_ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=request.user,
                    action='Назначение папки для писем',
                    details=f"Письма {email_ids} назначены в папку {folder.folder_name} (ID: {folder_id})",
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Emails {email_ids} assigned to folder {folder_id} for user {request.user.user_id}")

            return Response({'status': 'Emails assigned to folder'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error assigning emails to folder for user {request.user.user_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AssignCategoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.debug(
                f"POST /api/mail/emails/assign-categories/ by user {request.user.user_id} with data: {request.data}")
            serializer = AssignCategoriesSerializer(data=request.data, many=True)
            if not serializer.is_valid():
                logger.error(f"Invalid data for category assignment: {serializer.errors}")
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            assignments = serializer.validated_data
            if not assignments:
                logger.warning("No assignments provided")
                return Response(
                    {'error': 'No assignments provided'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            email_ids = [assignment['email_id'] for assignment in assignments]
            folder_ids = [assignment['folder_id'] for assignment in assignments]
            emails = Emails.objects.filter(
                email_id__in=email_ids,
                email_account__user=request.user
            )
            folders = MailFolder.objects.filter(
                folder_id__in=folder_ids,
                email_account__user=request.user
            )
            email_id_set = set(email.email_id for email in emails)
            folder_id_set = set(folder.folder_id for folder in folders)
            invalid_assignments = [
                assignment for assignment in assignments
                if assignment['email_id'] not in email_id_set or assignment['folder_id'] not in folder_id_set
            ]
            if invalid_assignments:
                logger.error(f"Invalid assignments: {invalid_assignments}")
                return Response(
                    {'error': 'Some email_ids or folder_ids are invalid or not accessible'},
                    status=status.HTTP_404_NOT_FOUND
                )
            created_count = 0
            with transaction.atomic():
                for assignment in assignments:
                    email_obj = emails.get(email_id=assignment['email_id'])
                    folder = folders.get(folder_id=assignment['folder_id'])
                    if not EmailFolderAssignment.objects.filter(
                            email=email_obj,
                            folder=folder
                    ).exists():
                        EmailFolderAssignment.objects.create(
                            email=email_obj,
                            folder=folder
                        )
                        created_count += 1
                    else:
                        logger.debug(
                            f"Skipping duplicate assignment for email_id={assignment['email_id']}, folder_id={assignment['folder_id']}")

                if created_count > 0:
                    client_ip = get_client_ip(request)
                    AuditLog.objects.create(
                        user=request.user,
                        action='Автоматическое назначение категорий',
                        details=f"Создано {created_count} новых назначений категорий для писем: {email_ids}",
                        ip_address=client_ip,
                        timestamp=timezone.now()
                    )
                    logger.info(f"Created {created_count} new category assignments for user {request.user.user_id}")

            return Response({'status': f'{created_count} categories assigned successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Error assigning categories for user {request.user.user_id}: {str(e)}", exc_info=True)
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DeleteEmailAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, email_account_id):
        try:
            email_account = UserEmailAccount.objects.get(email_account_id=email_account_id, user=request.user)
            with transaction.atomic():
                MailFolder.objects.filter(email_account=email_account).delete()
                Emails.objects.filter(email_account=email_account).delete()
                email_account.delete()

                client_ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=request.user,
                    action='Удаление почтового ящика',
                    details=f"Удален почтовый ящик {email_account.email_address}",
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Email account {email_account.email_address} deleted for user {request.user.user_id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserEmailAccount.DoesNotExist:
            logger.error(f"Email account {email_account_id} not found for user {request.user.user_id}")
            return Response({'error': 'Email account not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting email account {email_account_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FolderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.debug(f"POST /api/mail/folders/ by user {request.user.user_id} with data: {request.data}")
            serializer = MailFolderSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Invalid data for folder creation: {serializer.errors}")
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            email_account_id = serializer.validated_data['email_account'].email_account_id
            if not UserEmailAccount.objects.filter(
                    email_account_id=email_account_id,
                    user=request.user
            ).exists():
                logger.error(f"Email account {email_account_id} not found for user {request.user.user_id}")
                return Response(
                    {'error': 'Email account not found or not authorized'},
                    status=status.HTTP_404_NOT_FOUND
                )

            with transaction.atomic():
                folder = serializer.save()
                client_ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=request.user,
                    action='Создание папки',
                    details=f"Создана папка {folder.folder_name} (ID: {folder.folder_id}) для аккаунта {email_account_id}",
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Folder {folder.folder_name} created for user {request.user.user_id}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Error creating folder for user {request.user.user_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FolderDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, folder_id):
        try:
            logger.debug(f"DELETE /api/mail/folders/{folder_id}/ by user {request.user.user_id}")
            folder = MailFolder.objects.get(
                folder_id=folder_id,
                email_account__user=request.user
            )
            with transaction.atomic():
                EmailFolderAssignment.objects.filter(folder=folder).delete()
                folder_name = folder.folder_name
                folder.delete()

                client_ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=request.user,
                    action='Удаление папки',
                    details=f"Удалена папка {folder_name} (ID: {folder_id})",
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Folder {folder_name} (ID: {folder_id}) deleted for user {request.user.user_id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except MailFolder.DoesNotExist:
            logger.error(f"Folder {folder_id} not found for user {request.user.user_id}")
            return Response({'error': 'Folder not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error deleting folder {folder_id} for user {request.user.user_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TranslateEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.debug(f"POST /api/translate/ by user {request.user.user_id} with data: {request.data}")
            serializer = TranslateEmailSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Invalid data for translation: {serializer.errors}")
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            text = serializer.validated_data['text']
            target_language = serializer.validated_data['target_language']
            try:
                translation_response = requests.post(
                    'https://translate.api.cloud.yandex.net/translate/v2/translate',
                    headers={
                        'Authorization': f'Api-Key {settings.YANDEX_TRANSLATE_API_KEY}',
                        'Content-Type': 'application/json'
                    },
                    json={
                        'folderId': settings.YANDEX_CLOUD_FOLDER_ID,
                        'texts': [text],
                        'targetLanguageCode': target_language,
                        'sourceLanguageCode': 'auto'
                    },
                    timeout=10
                )
                translation_response.raise_for_status()
                response_data = translation_response.json()
                translated_text = response_data.get('translations', [{}])[0].get('text')
                if not translated_text:
                    logger.error("Yandex Translate API returned empty response")
                    return Response(
                        {'error': 'Translation service returned empty response'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            except requests.HTTPError as e:
                if e.response.status_code == 401:
                    logger.error(f"Yandex Translate API unauthorized: {e.response.text}")
                    return Response(
                        {
                            'error': 'Translation service authentication failed. Check API key and permissions.',
                            'details': e.response.text
                        },
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                elif e.response.status_code == 403:
                    logger.error(f"Yandex Translate API forbidden: {e.response.text}")
                    return Response(
                        {
                            'error': 'Translation service access denied. Check service subscription or folder ID.',
                            'details': e.response.text
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
                else:
                    logger.error(f"Yandex Translate API error: {e.response.status_code} - {e.response.text}")
                    return Response(
                        {
                            'error': 'Translation service error.',
                            'details': e.response.text
                        },
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )
            except requests.RequestException as e:
                logger.error(f"Error connecting to Yandex Translate API: {str(e)}")
                return Response(
                    {'error': 'Failed to connect to translation service'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            client_ip = get_client_ip(request)
            AuditLog.objects.create(
                user=request.user,
                action='Перевод письма',
                details=f"Переведен текст на язык {target_language} (длина текста: {len(text)} символов)",
                ip_address=client_ip,
                timestamp=timezone.now()
            )
            logger.info(f"Text translated to {target_language} for user {request.user.user_id}")

            return Response(
                {'translated_text': translated_text},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Error translating text for user {request.user.user_id}: {str(e)}", exc_info=True)
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SendEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.debug(f"POST /api/mail/send/ by user {request.user.user_id} with data: {request.data}")
            serializer = SendEmailSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Invalid data for sending email: {serializer.errors}")
                return Response(
                    {'error': 'Invalid data', 'details': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            recipient = serializer.validated_data['recipient']
            subject = serializer.validated_data['subject'] or 'No Subject'
            body = serializer.validated_data['body'] or ''
            email_account_id = serializer.validated_data.get('email_account_id')
            attachments = serializer.validated_data.get('attachments', [])
            if email_account_id:
                try:
                    email_account = UserEmailAccount.objects.get(
                        email_account_id=email_account_id,
                        user=request.user
                    )
                except UserEmailAccount.DoesNotExist:
                    logger.error(f"Email account {email_account_id} not found for user {request.user.user_id}")
                    return Response(
                        {'error': 'Email account not found or not authorized'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                email_account = UserEmailAccount.objects.filter(user=request.user).first()
                if not email_account:
                    logger.error(f"No email accounts found for user {request.user.user_id}")
                    return Response(
                        {'error': 'No email accounts configured for sending'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                logger.debug(f"No email_account_id provided; using default account: {email_account.email_address}")
            msg = MIMEMultipart()
            msg['From'] = email_account.email_address
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(body, 'html'))
            message_id = str(uuid.uuid4())
            attachment_details = []
            for file in attachments:
                try:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(file.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename="{file.name}"'
                    )
                    msg.attach(part)
                    attachment_details.append({
                        'file_name': file.name,
                        'file_size': file.size
                    })
                except Exception as e:
                    logger.error(f"Error processing attachment {file.name}: {str(e)}")
                    return Response(
                        {'error': f'Failed to process attachment: {file.name}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            smtp_server = email_account.service.smtp_server
            smtp_port = email_account.service.smtp_port
            service_name = email_account.service.service_name.lower()

            try:
                if service_name == 'gmail' and email_account.oauth_token and GOOGLE_AUTH_AVAILABLE:
                    logger.debug(f"Using OAuth2 for SMTP authentication for {email_account.email_address}")
                    smtp = smtplib.SMTP(smtp_server, smtp_port)
                    smtp.ehlo()
                    smtp.starttls()
                    smtp.ehlo()
                    oauth2_string = f"user={email_account.email_address}\1auth=Bearer {email_account.oauth_token}\1\1"
                    smtp.docmd("AUTH", "XOAUTH2 " + base64.b64encode(oauth2_string.encode()).decode())
                    smtp.sendmail(email_account.email_address, recipient, msg.as_string())
                    smtp.quit()
                else:
                    logger.debug(f"Using password authentication for SMTP for {email_account.email_address}")
                    if not email_account.password:
                        logger.error(f"No password available for {email_account.email_address}")
                        return Response(
                            {'error': 'Password required for SMTP authentication'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if smtp_port == 587:
                        smtp = smtplib.SMTP(smtp_server, smtp_port, timeout=30)
                        smtp.ehlo()
                        smtp.starttls()
                        smtp.ehlo()
                    else:
                        smtp = smtplib.SMTP_SSL(smtp_server, smtp_port, timeout=30)
                    smtp.login(email_account.email_address, email_account.password)
                    smtp.sendmail(email_account.email_address, recipient, msg.as_string())
                    smtp.quit()
                with transaction.atomic():
                    sent_date = timezone.now()
                    if not settings.USE_TZ:
                        sent_date = timezone.make_naive(sent_date)

                    email_obj = Emails.objects.create(
                        email_account=email_account,
                        message_id=message_id,
                        sender=email_account.email_address,
                        subject=subject,
                        body=body,
                        sent_date=sent_date,
                        received_date=sent_date,
                        status='read'
                    )

                    Email_Recipients.objects.create(
                        email=email_obj,
                        recipient_address=recipient,
                        recipient_type='TO'
                    )
                    for attachment in attachment_details:
                        EmailAttachment.objects.create(
                            email=email_obj,
                            file_name=attachment['file_name'],
                            file_size=attachment['file_size']
                        )

                    sent_folder = MailFolder.objects.filter(
                        email_account=email_account,
                        folder_name='Отправленное'
                    ).first()
                    if sent_folder:
                        EmailFolderAssignment.objects.create(
                            email=email_obj,
                            folder=sent_folder
                        )
                client_ip = get_client_ip(request)
                attachment_log = f", {len(attachment_details)} attachments (total size: {(sum(a['file_size'] for a in attachment_details) / 1024 / 1024):.2f} MB)" if attachment_details else ""
                AuditLog.objects.create(
                    user=request.user,
                    action='Отправка письма',
                    details=f"Отправлено письмо с {email_account.email_address} на {recipient} (тема: {subject}{attachment_log})",
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Email sent from {email_account.email_address} to {recipient} by user {request.user.user_id} with {len(attachment_details)} attachments")

                return Response(
                    {'status': 'Email sent successfully'},
                    status=status.HTTP_200_OK
                )

            except smtplib.SMTPAuthenticationError as e:
                logger.error(f"SMTP authentication failed for {email_account.email_address}: {str(e)}")
                error_str = str(e).lower()
                if "application-specific password required" in error_str or "neobhodim parol prilozheniya" in error_str:
                    provider_instructions = {
                        'mail.ru': 'Go to Mail.ru account settings > Security > App passwords to generate an app-specific password.',
                        'gmail': 'Go to Google Account > Security > 2-Step Verification > App passwords to generate an app-specific password, or use OAuth 2.0.'
                    }
                    return Response(
                        {
                            'error': f'An application-specific password is required for {service_name}. {provider_instructions.get(service_name, "Check your provider’s security settings.")}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif "invalid credentials" in error_str or "authentication failed" in error_str:
                    return Response(
                        {
                            'error': f'Invalid credentials for {email_account.email_address}. If 2FA is enabled, use an application-specific password or OAuth token.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    return Response(
                        {'error': 'SMTP authentication failed. Please check your credentials.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except smtplib.SMTPException as e:
                logger.error(f"SMTP error sending email from {email_account.email_address}: {str(e)}")
                return Response(
                    {'error': 'Failed to send email due to SMTP error.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            except Exception as e:
                logger.error(f"Unexpected error sending email from {email_account.email_address}: {str(e)}")
                return Response(
                    {'error': 'Internal server error'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.error(f"Error processing send email request for user {request.user.user_id}: {str(e)}")
            return Response(
                {'error': 'Internal server error'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )