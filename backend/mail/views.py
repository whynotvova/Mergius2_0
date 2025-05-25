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
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import base64
import uuid
from .tasks import fetch_emails_task
from django.db.utils import OperationalError
import time

try:
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from google.oauth2.credentials import Credentials
    GOOGLE_AUTH_AVAILABLE = True
except ImportError:
    GOOGLE_AUTH_AVAILABLE = False

from django.conf import settings

logger = logging.getLogger(__name__)

def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', 'неизвестный')

    if ip in ('127.0.0.1', '::1', 'неизвестный'):
        try:
            response = requests.get('https://api.ipify.org?format=json', timeout=5)
            response.raise_for_status()
            ip_data = response.json()
            ip = ip_data.get('ip', 'неизвестный')
        except requests.RequestException as e:
            logger.error(f"Ошибка получения общедоступного IP-адреса: {str(e)}")
            ip = 'неизвестный'
    return ip

def fetch_email_avatar(email_account):
    try:
        logger.debug(f"Получение аватара для {email_account.email_address}")
        imap_server = email_account.service.imap_server
        imap_port = email_account.service.imap_port
        imap = imaplib.IMAP4_SSL(imap_server, imap_port, timeout=30)
        if email_account.oauth_token and GOOGLE_AUTH_AVAILABLE:
            logger.debug(f"Использование OAuth для {email_account.email_address}")
            imap.authenticate('XOAUTH2', lambda
                _: f"user={email_account.email_address}\1auth=Bearer {email_account.oauth_token}\1\1".encode())
        else:
            password = email_account.password or ''
            logger.debug(f"Использование аутентификации по паролю для {email_account.email_address}")
            imap.login(email_account.email_address, password)

        imap.select('INBOX')
        status, data = imap.fetch('1', '(BODY[HEADER.FIELDS (FROM)])')
        if status == 'OK':
            msg = email.message_from_bytes(data[0][1])
            avatar_url = f'https://api.adorable.io/avatars/100/{email_account.email_address}'
            email_account.avatar = avatar_url
            email_account.save()
            logger.debug(f"Аватар установлен для {email_account.email_address}: {avatar_url}")
        else:
            logger.warning(f"Не удалось получить заголовок аватара для {email_account.email_address}: {data}")

        imap.logout()
    except imaplib.IMAP4.error as e:
        logger.error(f"Ошибка IMAP при загрузке аватара для {email_account.email_address}: {str(e)}")
        error_str = str(e).lower()
        if "application-specific password required" in error_str or "neobhodim parol prilozheniya" in error_str:
            logger.error(
                f"Пароль для конкретного приложения, необходимый для {email_account.email_address}. Проверьте настройки безопасности провайдера.")
        elif "invalid credentials" in error_str:
            logger.error(
                f"Неверные учетные данные для {email_account.email_address}. Убедитесь, что пароль или токен OAuth правильный.")
        email_account.avatar = '/images/mail/default-avatar.png'
        email_account.save()
    except Exception as e:
        logger.error(f"Непредвиденная ошибка при получении аватара для {email_account.email_address}: {str(e)}")
        email_account.avatar = '/images/mail/default-avatar.png'
        email_account.save()

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
                f"POST /api/mail/email-accounts/add/ пользователем {user.user_id} с данными: {{service_name: {service_name}, email_address: {email_address}, auth_method: {'OAuth' if oauth_token else 'Password'}}}")
            if not service_name or not email_address:
                logger.error("Отсутствуют обязательные поля: имя_сервиса или адрес_электронной_почты")
                return Response(
                    {'ошибка': 'Название сервиса и адрес электронной почты обязательны'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                email_service = EmailService.objects.get(service_name=service_name)
            except EmailService.DoesNotExist:
                logger.error(f"Почтовый сервис '{service_name}' не найден")
                return Response(
                    {'ошибка': f"Почтовый сервис '{service_name}' не найден"},
                    status=status.HTTP_404_NOT_FOUND
                )

            existing_accounts = UserEmailAccount.objects.filter(user=user, service=email_service).count()
            if existing_accounts >= 2:
                logger.error(f"Пользователь {user.user_id} уже имеет 2 почтовых аккаунта для сервиса {service_name}")
                return Response(
                    {'ошибка': f'Нельзя добавить более 2 почтовых аккаунтов для {service_name}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if UserEmailAccount.objects.filter(user=user, email_address=email_address).exists():
                logger.error(f"Адрес электронной почты {email_address} уже связан с пользователем {user.user_id}")
                return Response(
                    {'ошибка': 'Этот адрес электронной почты уже связан с вашим аккаунтом'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            try:
                imap_server = email_service.imap_server
                imap_port = email_service.imap_port
                imap = imaplib.IMAP4_SSL(imap_server, imap_port, timeout=30)
                if oauth_token and service_name.lower() == 'gmail' and GOOGLE_AUTH_AVAILABLE:
                    logger.info(f"Проверка токена OAuth для {email_address}")
                    imap.authenticate('XOAUTH2',
                                      lambda _: f"user={email_address}\1auth=Bearer {oauth_token}\1\1".encode())
                else:
                    if oauth_token and not GOOGLE_AUTH_AVAILABLE:
                        logger.warning("Токен OAuth предоставлен, но google-auth-oauthlib не установлен")
                        return Response(
                            {
                                'ошибка': 'Аутентификация OAuth недоступна. Установите google-auth-oauthlib или используйте пароль для конкретного приложения'
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    if not password:
                        logger.error("Требуется пароль для аутентификации без OAuth")
                        return Response(
                            {'ошибка': f'Пароль необходим для аутентификации {service_name}'},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    logger.info(f"Проверка пароля для {email_address}")
                    imap.login(email_address, password)
                imap.logout()
            except imaplib.IMAP4.error as e:
                logger.error(f"Не удалось войти в IMAP для {email_address}: {str(e)}", exc_info=True)
                error_str = str(e).lower()
                if "application-specific password required" in error_str or "neobhodim parol prilozheniya" in error_str:
                    provider_instructions = {
                        'mail.ru': 'Перейдите в настройки учетной записи Mail.ru > Безопасность > Пароли приложений, чтобы сгенерировать пароль для конкретного приложения.',
                        'gmail': 'Перейдите в «Аккаунт Google» > «Безопасность» > «Двухэтапная проверка» > «Пароли приложений», чтобы сгенерировать пароль для конкретного приложения, или используйте OAuth 2.0.'
                    }
                    return Response(
                        {
                            'ошибка': f'Для {service_name} требуется пароль для конкретного приложения. {provider_instructions.get(service_name.lower(), "Проверьте настройки безопасности вашего провайдера.")}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif "invalid credentials" in error_str:
                    return Response(
                        {
                            'ошибка': f'Неверный адрес электронной почты или пароль для {email_address}. Если включена двухфакторная аутентификация, используйте пароль приложения или токен OAuth.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    return Response(
                        {
                            'ошибка': f'Не удалось войти в IMAP для {email_address}: {str(e)}. Проверьте учетные данные или настройки аккаунта.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except Exception as e:
                logger.error(f"Непредвиденная ошибка при проверке IMAP для {email_address}: {str(e)}", exc_info=True)
                return Response(
                    {
                        'ошибка': f'Не удалось проверить учетные данные IMAP для {email_address}: {str(e)}'
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
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
                    try:
                        fetch_email_avatar(email_account)
                    except Exception as e:
                        logger.error(f"Не удалось получить аватар для {email_address}: {str(e)}", exc_info=True)
                        email_account.avatar = '/images/mail/default-avatar.png'
                        email_account.save()
                    fetch_emails_task.delay(email_account.email_account_id, force_refresh=True)
                    logger.info(f"Запланирована асинхронная загрузка писем для {email_account.email_address}")

                    client_ip = get_client_ip(request)
                    AuditLog.objects.create(
                        user=user,
                        action='Добавление почтового ящика',
                        details=f"Добавлен почтовый ящик {email_address} (сервис: {service_name}, метод: {'OAuth' if oauth_token else 'Password'})",
                        ip_address=client_ip,
                        timestamp=timezone.now()
                    )
                    logger.info(f"Почтовый аккаунт {email_account.email_address} добавлен для пользователя {user.user_id}")

                serializer = UserEmailAccountSerializer(email_account)
                return Response(
                    serializer.data,
                    status=status.HTTP_201_CREATED
                )

            except Exception as e:
                logger.error(f"Ошибка создания почтового аккаунта для {email_address}: {str(e)}", exc_info=True)
                return Response(
                    {'ошибка': f'Не удалось создать почтовый аккаунт: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.error(f"Непредвиденная ошибка в AddEmailAccountView для пользователя {user.user_id}: {str(e)}", exc_info=True)
            return Response(
                {'ошибка': 'Внутренняя ошибка сервера'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class EmailServiceView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            services = EmailService.objects.all()
            serializer = EmailServiceSerializer(services, many=True)
            logger.debug(f"GET /api/mail/email-services/ пользователем {request.user.user_id}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Ошибка получения почтовых сервисов: {str(e)}")
            return Response(
                {'ошибка': 'Внутренняя ошибка сервера'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class FetchEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            logger.debug(f"GET /api/mail/fetch/ пользователем {request.user.user_id} с параметрами: {request.query_params}")
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
                    logger.debug(f"Фильтрация писем по папке: {folder_name}")
                else:
                    logger.warning(
                        f"Папка '{folder_name}' не найдена для пользователя {request.user.user_id}. Возвращён пустой список писем.")
                    emails = Emails.objects.none()
            if service_name:
                emails = emails.filter(email_account__service__service_name=service_name)
                logger.debug(f"Фильтрация писем по сервису: {service_name}")
            if search_query:
                emails = emails.filter(
                    Q(subject__icontains=search_query) |
                    Q(sender__icontains=search_query) |
                    Q(body__icontains=search_query)
                )
                logger.debug(f"Применён поисковый запрос: {search_query}")
            if filter_param == 'sort-az':
                emails = emails.order_by('subject')
                logger.debug("Сортировка писем по алфавиту")
            elif filter_param == 'sort-date':
                emails = emails.order_by('-sent_date')
                logger.debug("Сортировка писем по дате отправки")
            else:
                emails = emails.order_by('-received_date')
                logger.debug("Сортировка писем по дате получения (по умолчанию)")
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
            logger.debug(f"Количество непрочитанных писем по сервисам для пользователя {request.user.user_id}: {unread_counts_by_service}")
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

            logger.debug(f"Количество непрочитанных писем по папкам для пользователя {request.user.user_id}: {unread_counts_by_folder}")
            paginator = Paginator(emails, page_size)
            try:
                page_obj = paginator.page(page)
            except:
                logger.error(f"Неверный номер страницы: {page}")
                return Response({'ошибка': 'Неверный номер страницы'}, status=status.HTTP_400_BAD_REQUEST)
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
                logger.debug(f"Найдено {len(email_accounts)} почтовых аккаунтов для пользователя {request.user.user_id}")
                for email_account in email_accounts:
                    fetch_emails_task.delay(email_account.email_account_id, force_refresh=True)
                    logger.info(f"Запланирована асинхронная загрузка писем для {email_account.email_address}")

            if not emails.exists():
                logger.info(
                    f"Письма не найдены для пользователя {request.user.user_id} с фильтрами: folder_name={folder_name}, service_name={service_name}, search={search_query}")
            return Response(response_data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Ошибка получения писем для пользователя {request.user.user_id}: {str(e)}", exc_info=True)
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EmailAccountListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            logger.debug(f"GET /api/mail/email-accounts/ пользователем {request.user.user_id}")
            email_accounts = UserEmailAccount.objects.filter(user=request.user)
            serializer = UserEmailAccountSerializer(email_accounts, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Ошибка получения почтовых аккаунтов для пользователя {request.user.user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EmailDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, email_id):
        try:
            logger.debug(f"GET /api/mail/emails/{email_id}/ пользователем {request.user.user_id}")
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
            logger.error(f"Письмо {email_id} не найдено для пользователя {request.user.user_id}")
            return Response({'ошибка': 'Письмо не найдено'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Ошибка получения письма {email_id} для пользователя {request.user.user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def patch(self, request, email_id):
        try:
            logger.debug(f"PATCH /api/mail/emails/{email_id}/ пользователем {request.user.user_id}")
            email_obj = Emails.objects.get(email_id=email_id, email_account__user=request.user)
            status_value = request.data.get('status')
            if status_value not in ['read', 'unread']:
                logger.error(f"Недопустимое значение статуса: {status_value}")
                return Response(
                    {'ошибка': 'Недопустимое значение статуса. Должно быть "прочитано" или "непрочитано"'},
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
            logger.info(f"Статус письма {email_id} изменён на {status_value} для пользователя {request.user.user_id}")
            return Response({'статус': email_obj.status}, status=status.HTTP_200_OK)
        except Emails.DoesNotExist:
            logger.error(f"Письмо {email_id} не найдено для пользователя {request.user.user_id}")
            return Response({'ошибка': 'Письмо не найдено'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Ошибка обновления письма {email_id} для пользователя {request.user.user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, email_id):
        try:
            logger.debug(f"DELETE /api/mail/emails/{email_id}/ пользователем {request.user.user_id}")
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
            logger.info(f"Письмо {email_id} удалено для пользователя {request.user.user_id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Emails.DoesNotExist:
            logger.error(f"Письмо {email_id} не найдено для пользователя {request.user.user_id}")
            return Response({'ошибка': 'Письмо не найдено'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Ошибка удаления письма {email_id} для пользователя {request.user.user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EmailFolderAssignmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.debug(f"POST /api/mail/emails/assign-folder/ пользователем {request.user.user_id}")
            email_ids = request.data.get('email_ids', [])
            folder_id = request.data.get('folder_id')

            if not email_ids or not folder_id:
                logger.error("Отсутствуют email_ids или folder_id")
                return Response(
                    {'ошибка': 'email_ids и folder_id обязательны'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            try:
                folder = MailFolder.objects.get(folder_id=folder_id, email_account__user=request.user)
            except MailFolder.DoesNotExist:
                logger.error(f"Папка {folder_id} не найдена для пользователя {request.user.user_id}")
                return Response(
                    {'ошибка': 'Папка не найдена'},
                    status=status.HTTP_404_NOT_FOUND
                )

            emails = Emails.objects.filter(email_id__in=email_ids, email_account__user=request.user)
            if not emails.exists():
                logger.error(f"Валидные письма не найдены для ID: {email_ids}")
                return Response(
                    {'ошибка': 'Валидные письма не найдены'},
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
                logger.info(f"Письма {email_ids} назначены в папку {folder_id} для пользователя {request.user.user_id}")

            return Response({'статус': 'Письма назначены в папку'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Ошибка назначения писем в папку для пользователя {request.user.user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AssignCategoriesView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.debug(
                f"POST /api/mail/emails/assign-categories/ пользователем {request.user.user_id} с данными: {request.data}")
            serializer = AssignCategoriesSerializer(data=request.data, many=True)
            if not serializer.is_valid():
                logger.error(f"Неверные данные для назначения категории: {serializer.errors}")
                return Response(
                    {'ошибка': 'Неверные данные', 'детали': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            assignments = serializer.validated_data
            if not assignments:
                logger.warning("Назначения не указаны")
                return Response(
                    {'ошибка': 'Назначения не указаны'},
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
                logger.error(f"Недопустимые назначения: {invalid_assignments}")
                return Response(
                    {'ошибка': 'Некоторые email_ids или folder_ids недействительны или недоступны'},
                    status=status.HTTP_404_NOT_FOUND
                )
            created_count = 0
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    with transaction.atomic():
                        assignment_objects = []
                        existing_assignments = EmailFolderAssignment.objects.filter(
                            email__email_id__in=email_ids,
                            folder__folder_id__in=folder_ids
                        ).values('email__email_id', 'folder__folder_id')
                        existing_set = {(a['email__email_id'], a['folder__folder_id']) for a in existing_assignments}
                        for assignment in assignments:
                            email_obj = emails.get(email_id=assignment['email_id'])
                            folder = folders.get(folder_id=assignment['folder_id'])
                            if (email_obj.email_id, folder.folder_id) not in existing_set:
                                assignment_objects.append(
                                    EmailFolderAssignment(
                                        email=email_obj,
                                        folder=folder
                                    )
                                )
                        if assignment_objects:
                            EmailFolderAssignment.objects.bulk_create(assignment_objects, ignore_conflicts=True)
                            created_count = len(assignment_objects)
                            client_ip = get_client_ip(request)
                            AuditLog.objects.create(
                                user=request.user,
                                action='Автоматическое назначение категорий',
                                details=f"Создано {created_count} новых назначений категорий для писем: {email_ids}",
                                ip_address=client_ip,
                                timestamp=timezone.now()
                            )
                            logger.info(f"Создано {created_count} новых назначений категорий для пользователя {request.user.user_id}")
                        else:
                            logger.debug("Новые назначения не требуются; все запрошенные назначения уже существуют")
                    break
                except OperationalError as e:
                    if '1213' in str(e):
                        logger.warning(f"Обнаружен deadlock на попытке {attempt + 1}/{max_retries}. Повторная попытка...")
                        time.sleep(0.5 * (attempt + 1))
                        if attempt == max_retries - 1:
                            logger.error(f"Не удалось назначить категории после {max_retries} попыток: {str(e)}")
                            raise
                    else:
                        logger.error(f"Ошибка базы данных при назначении категорий: {str(e)}")
                        raise
            return Response({'статус': f'{created_count} категорий успешно назначено'}, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Ошибка назначения категорий для пользователя {request.user.user_id}: {str(e)}", exc_info=True)
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
                logger.info(f"Почтовый аккаунт {email_account.email_address} удалён для пользователя {request.user.user_id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserEmailAccount.DoesNotExist:
            logger.error(f"Почтовый аккаунт {email_account_id} не найден для пользователя {request.user.user_id}")
            return Response({'ошибка': 'Почтовый аккаунт не найден'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Ошибка удаления почтового аккаунта {email_account_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FolderCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.debug(f"POST /api/mail/folders/ пользователем {request.user.user_id} с данными: {request.data}")
            serializer = MailFolderSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Неверные данные для создания папки: {serializer.errors}")
                return Response(
                    {'ошибка': 'Неверные данные', 'детали': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            email_account_id = serializer.validated_data['email_account'].email_account_id
            if not UserEmailAccount.objects.filter(
                    email_account_id=email_account_id,
                    user=request.user
            ).exists():
                logger.error(f"Почтовый аккаунт {email_account_id} не найден для пользователя {request.user.user_id}")
                return Response(
                    {'ошибка': 'Почтовый аккаунт не найден или не авторизован'},
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
                logger.info(f"Папка {folder.folder_name} создана для пользователя {request.user.user_id}")

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            logger.error(f"Ошибка создания папки для пользователя {request.user.user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class FolderDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, folder_id):
        try:
            logger.debug(f"DELETE /api/mail/folders/{folder_id}/ пользователем {request.user.user_id}")
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
                logger.info(f"Папка {folder_name} (ID: {folder_id}) удалена для пользователя {request.user.user_id}")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except MailFolder.DoesNotExist:
            logger.error(f"Папка {folder_id} не найдена для пользователя {request.user.user_id}")
            return Response({'ошибка': 'Папка не найдена'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Ошибка удаления папки {folder_id} для пользователя {request.user.user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TranslateEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.debug(f"POST /api/translate/ пользователем {request.user.user_id} с данными: {request.data}")
            serializer = TranslateEmailSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Неверные данные для перевода: {serializer.errors}")
                return Response(
                    {'ошибка': 'Неверные данные', 'детали': serializer.errors},
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
                    logger.error("API перевода Yandex вернул пустой ответ")
                    return Response(
                        {'ошибка': 'Сервис перевода вернул пустой ответ'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            except requests.HTTPError as e:
                if e.response.status_code == 401:
                    logger.error(f"API перевода Yandex: ошибка авторизации: {e.response.text}")
                    return Response(
                        {
                            'ошибка': 'Ошибка аутентификации сервиса перевода. Проверьте API-ключ и права доступа.',
                            'детали': e.response.text
                        },
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                elif e.response.status_code == 403:
                    logger.error(f"API перевода Yandex: доступ запрещён: {e.response.text}")
                    return Response(
                        {
                            'ошибка': 'Доступ к сервису перевода запрещён. Проверьте подписку или ID папки.',
                            'детали': e.response.text
                        },
                        status=status.HTTP_403_FORBIDDEN
                    )
                else:
                    logger.error(f"Ошибка API перевода Yandex: {e.response.status_code} - {e.response.text}")
                    return Response(
                        {
                            'ошибка': 'Ошибка сервиса перевода.',
                            'детали': e.response.text
                        },
                        status=status.HTTP_503_SERVICE_UNAVAILABLE
                    )
            except requests.RequestException as e:
                logger.error(f"Ошибка подключения к API перевода Yandex: {str(e)}")
                return Response(
                    {'ошибка': 'Не удалось подключиться к сервису перевода'},
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
            logger.info(f"Текст переведён на {target_language} для пользователя {request.user.user_id}")

            return Response(
                {'переведённый_текст': translated_text},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            logger.error(f"Ошибка перевода текста для пользователя {request.user.user_id}: {str(e)}", exc_info=True)
            return Response(
                {'ошибка': 'Внутренняя ошибка сервера'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class SendEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            logger.debug(f"POST /api/mail/send/ пользователем {request.user.user_id} с данными: {request.data}")
            serializer = SendEmailSerializer(data=request.data)
            if not serializer.is_valid():
                logger.error(f"Неверные данные для отправки письма: {serializer.errors}")
                return Response(
                    {'ошибка': 'Неверные данные', 'детали': serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            recipient = serializer.validated_data['recipient']
            subject = serializer.validated_data['subject'] or 'Без темы'
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
                    logger.error(f"Почтовый аккаунт {email_account_id} не найден для пользователя {request.user.user_id}")
                    return Response(
                        {'ошибка': 'Почтовый аккаунт не найден или не авторизован'},
                        status=status.HTTP_404_NOT_FOUND
                    )
            else:
                email_account = UserEmailAccount.objects.filter(user=request.user).first()
                if not email_account:
                    logger.error(f"Почтовые аккаунты не найдены для пользователя {request.user.user_id}")
                    return Response(
                        {'ошибка': 'Не настроены почтовые аккаунты для отправки'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                logger.debug(f"Не указан email_account_id; используется аккаунт по умолчанию: {email_account.email_address}")
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
                    logger.error(f"Ошибка обработки вложения {file.name}: {str(e)}")
                    return Response(
                        {'ошибка': f'Не удалось обработать вложение: {file.name}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            smtp_server = email_account.service.smtp_server
            smtp_port = email_account.service.smtp_port
            service_name = email_account.service.service_name.lower()

            try:
                if service_name == 'gmail' and email_account.oauth_token and GOOGLE_AUTH_AVAILABLE:
                    logger.debug(f"Использование OAuth2 для SMTP-аутентификации для {email_account.email_address}")
                    smtp = smtplib.SMTP(smtp_server, smtp_port)
                    smtp.ehlo()
                    smtp.starttls()
                    smtp.ehlo()
                    oauth2_string = f"user={email_account.email_address}\1auth=Bearer {email_account.oauth_token}\1\1"
                    smtp.docmd("AUTH", "XOAUTH2 " + base64.b64encode(oauth2_string.encode()).decode())
                    smtp.sendmail(email_account.email_address, recipient, msg.as_string())
                    smtp.quit()
                else:
                    logger.debug(f"Использование аутентификации по паролю для SMTP для {email_account.email_address}")
                    if not email_account.password:
                        logger.error(f"Пароль отсутствует для {email_account.email_address}")
                        return Response(
                            {'ошибка': 'Пароль необходим для SMTP-аутентификации'},
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
                attachment_log = f", {len(attachment_details)} вложений (общий размер: {(sum(a['file_size'] for a in attachment_details) / 1024 / 1024):.2f} МБ)" if attachment_details else ""
                AuditLog.objects.create(
                    user=request.user,
                    action='Отправка письма',
                    details=f"Отправлено письмо с {email_account.email_address} на {recipient} (тема: {subject}{attachment_log})",
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Письмо отправлено с {email_account.email_address} на {recipient} пользователем {request.user.user_id} с {len(attachment_details)} вложениями")

                return Response(
                    {'статус': 'Письмо успешно отправлено'},
                    status=status.HTTP_200_OK
                )

            except smtplib.SMTPAuthenticationError as e:
                logger.error(f"Ошибка SMTP-аутентификации для {email_account.email_address}: {str(e)}")
                error_str = str(e).lower()
                if "application-specific password required" in error_str or "neobhodim parol prilozheniya" in error_str:
                    provider_instructions = {
                        'mail.ru': 'Перейдите в настройки учетной записи Mail.ru > Безопасность > Пароли приложений, чтобы сгенерировать пароль для конкретного приложения.',
                        'gmail': 'Перейдите в «Аккаунт Google» > «Безопасность» > «Двухэтапная проверка» > «Пароли приложений», чтобы сгенерировать пароль для конкретного приложения, или используйте OAuth 2.0.'
                    }
                    return Response(
                        {
                            'ошибка': f'Для {service_name} требуется пароль для конкретного приложения. {provider_instructions.get(service_name, "Проверьте настройки безопасности вашего провайдера.")}'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                elif "invalid credentials" in error_str or "authentication failed" in error_str:
                    return Response(
                        {
                            'ошибка': f'Неверные учетные данные для {email_account.email_address}. Если включена двухфакторная аутентификация, используйте пароль приложения или токен OAuth.'
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                else:
                    return Response(
                        {'ошибка': 'Ошибка SMTP-аутентификации. Проверьте учетные данные.'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            except smtplib.SMTPException as e:
                logger.error(f"Ошибка SMTP при отправке письма с {email_account.email_address}: {str(e)}")
                return Response(
                    {'ошибка': 'Не удалось отправить письмо из-за ошибки SMTP.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            except Exception as e:
                logger.error(f"Непредвиденная ошибка при отправке письма с {email_account.email_address}: {str(e)}")
                return Response(
                    {'ошибка': 'Внутренняя ошибка сервера'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        except Exception as e:
            logger.error(f"Ошибка обработки запроса на отправку письма для пользователя {request.user.user_id}: {str(e)}")
            return Response(
                {'ошибка': 'Внутренняя ошибка сервера'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )