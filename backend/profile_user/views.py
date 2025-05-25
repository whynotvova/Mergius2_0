from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileSerializer, MailFolderSerializer, UserSettingsSerializer, EmailServiceSerializer
from .models import MailFolder, AuditLog, UserEmailAccount, EmailService, User_Settings
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging
import requests
import imaplib
from django.db import transaction

User = get_user_model()
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


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        logger.debug(f"GET /api/profile/ пользователем {user.user_id}")
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        logger.debug(f"DELETE /api/profile/ пользователем {user.user_id}")
        try:
            client_ip = get_client_ip(request)
            AuditLog.objects.create(
                user=user,
                action='Удаление аккаунта',
                details='Аккаунт пользователя удалён',
                ip_address=client_ip,
                timestamp=timezone.now()
            )
            user.delete()
            logger.info(f"Аккаунт пользователя {user.user_id} удалён")
            return Response({'сообщение': 'Аккаунт успешно удалён'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Ошибка удаления аккаунта пользователя {user.user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class MailFolderView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        logger.debug(f"GET /api/profile/folders/ пользователем {user.user_id}")
        email_accounts = UserEmailAccount.objects.filter(user=user)
        folders = MailFolder.objects.filter(email_account__in=email_accounts)
        serializer = MailFolderSerializer(folders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        logger.debug(f"POST /api/profile/folders/ пользователем {user.user_id} с данными: {request.data}")
        email_account = UserEmailAccount.objects.filter(user=user).first()
        if not email_account:
            email_service, created = EmailService.objects.get_or_create(
                service_name='Gmail',
                defaults={
                    'imap_server': 'imap.gmail.com',
                    'smtp_server': 'smtp.gmail.com',
                    'imap_port': 993,
                    'smtp_port': 587,
                    'service_icon': '/images/mail/google-logo.png'
                }
            )
            email_account = UserEmailAccount.objects.create(
                user=user,
                service=email_service,
                email_address=f"{user.username or 'user'}_{user.user_id}@example.com",
                created_at=timezone.now()
            )
            logger.info(f"Создан почтовый аккаунт по умолчанию для пользователя {user.user_id}: {email_account.email_address}")

        data = request.data.copy()
        data['email_account'] = email_account.email_account_id
        serializer = MailFolderSerializer(data=data)
        if serializer.is_valid():
            folder = serializer.save()
            client_ip = get_client_ip(request)
            AuditLog.objects.create(
                user=user,
                action='Создание папки',
                details=f'Создана папка "{folder.folder_name}"',
                ip_address=client_ip,
                timestamp=timezone.now()
            )
            logger.info(f"Папка '{folder.folder_name}' создана для пользователя {user.user_id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Ошибки сериализатора: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, folder_id):
        try:
            folder = MailFolder.objects.get(folder_id=folder_id, email_account__user=request.user)
        except MailFolder.DoesNotExist:
            logger.error(f"Папка {folder_id} не найдена для пользователя {request.user.user_id}")
            return Response({'ошибка': 'Папка не найдена'}, status=status.HTTP_404_NOT_FOUND)

        serializer = MailFolderSerializer(folder, data=request.data, partial=True)
        if serializer.is_valid():
            folder = serializer.save()
            client_ip = get_client_ip(request)
            AuditLog.objects.create(
                user=request.user,
                action='Обновление папки',
                details=f'Обновлена папка "{folder.folder_name}"',
                ip_address=client_ip,
                timestamp=timezone.now()
            )
            logger.info(f"Папка '{folder.folder_name}' обновлена для пользователя {request.user.user_id}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        logger.error(f"Ошибки сериализатора: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, folder_id):
        try:
            folder = MailFolder.objects.get(folder_id=folder_id, email_account__user=request.user)
        except MailFolder.DoesNotExist:
            logger.error(f"Папка {folder_id} не найдена для пользователя {request.user.user_id}")
            return Response({'ошибка': 'Папка не найдена'}, status=status.HTTP_404_NOT_FOUND)

        folder_name = folder.folder_name
        folder.delete()
        client_ip = get_client_ip(request)
        AuditLog.objects.create(
            user=request.user,
            action='Удаление папки',
            details=f'Удалена папка "{folder_name}"',
            ip_address=client_ip,
            timestamp=timezone.now()
        )
        logger.info(f"Папка '{folder_name}' удалена для пользователя {request.user.user_id}")
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserSettingsView(APIView):
    def get(self, request):
        user_id = request.data.get('user_id') or request.query_params.get('user_id')
        if not user_id:
            logger.error("Не указан user_id в GET /api/profile/settings/")
            return Response({'ошибка': 'user_id обязателен'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(user_id=user_id)
            logger.debug(
                f"GET /api/profile/settings/ для пользователя {user.user_id}, Источник: {request.META.get('HTTP_ORIGIN', 'неизвестный')}")
            settings = User_Settings.objects.filter(user=user).first()
            if not settings:
                logger.info(f"Создание новых настроек для пользователя {user.user_id}")
                client_ip = get_client_ip(request)
                settings = User_Settings.objects.create(
                    user=user,
                    language='ru',
                    theme='light'
                )
                AuditLog.objects.create(
                    user=user,
                    action='Создание настроек',
                    details='Созданы настройки по умолчанию для пользователя',
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Созданы настройки по умолчанию для пользователя {user.user_id}: language=ru, theme=light")
            serializer = UserSettingsSerializer(settings)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            logger.error(f"Пользователь с user_id {user_id} не найден")
            return Response({'ошибка': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Ошибка получения настроек для user_id {user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            logger.error("Не указан user_id в PUT /api/profile/settings/")
            return Response({'ошибка': 'user_id обязателен'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(user_id=user_id)
            logger.debug(
                f"PUT /api/profile/settings/ для пользователя {user.user_id} с данными: {request.data}, Источник: {request.META.get('HTTP_ORIGIN', 'неизвестный')}")
            settings = User_Settings.objects.filter(user=user).first()
            if not settings:
                logger.info(f"Создание новых настроек для пользователя {user.user_id}")
                client_ip = get_client_ip(request)
                settings = User_Settings.objects.create(
                    user=user,
                    language='ru',
                    theme='light'
                )
                AuditLog.objects.create(
                    user=user,
                    action='Создание настроек',
                    details='Созданы настройки по умолчанию для пользователя',
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Созданы настройки по умолчанию для пользователя {user.user_id}: language=ru, theme=light")

            serializer = UserSettingsSerializer(settings, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                client_ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=user,
                    action='Обновление настроек',
                    details=f'Обновлены настройки (тема: {request.data.get("theme", "не указана")})',
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Настройки обновлены для пользователя {user.user_id}: {request.data}")
                return Response(serializer.data, status=status.HTTP_200_OK)
            logger.error(f"Ошибки сериализатора: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            logger.error(f"Пользователь с user_id {user_id} не найден")
            return Response({'ошибка': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Ошибка обновления настроек для user_id {user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            logger.error("Не указан user_id в POST /api/profile/settings/")
            return Response({'ошибка': 'user_id обязателен'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(user_id=user_id)
            logger.debug(
                f"POST /api/profile/settings/ для пользователя {user.user_id} с данными: {request.data}, Источник: {request.META.get('HTTP_ORIGIN', 'неизвестный')}")
            if User_Settings.objects.filter(user=user).exists():
                logger.warning(f"Настройки уже существуют для пользователя {user.user_id}")
                return Response({'ошибка': 'Настройки для этого пользователя уже существуют'}, status=status.HTTP_400_BAD_REQUEST)

            serializer = UserSettingsSerializer(data=request.data)
            if serializer.is_valid():
                settings = serializer.save(user=user)
                client_ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=user,
                    action='Создание настроек',
                    details=f'Созданы настройки (тема: {request.data.get("theme", "не указана")})',
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Настройки созданы для пользователя {user.user_id}: {request.data}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.error(f"Ошибки сериализатора: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            logger.error(f"Пользователь с user_id {user_id} не найден")
            return Response({'ошибка': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Ошибка создания настроек для user_id {user_id}: {str(e)}")
            return Response({'ошибка': 'Внутренняя ошибка сервера'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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


class AddEmailAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            service_name = request.data.get('service_name')
            email_address = request.data.get('email_address')
            password = request.data.get('password')

            logger.debug(
                f"POST /api/mail/email-accounts/add/ пользователем {user.user_id} с данными: {{service_name: {service_name}, email_address: {email_address}}}")
            if not all([service_name, email_address]):
                logger.error("Отсутствуют обязательные поля: service_name или email_address")
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

            if UserEmailAccount.objects.filter(user=user, email_address=email_address).exists():
                logger.error(f"Адрес электронной почты {email_address} уже связан с пользователем {user.user_id}")
                return Response(
                    {'ошибка': 'Этот адрес электронной почты уже связан с вашим аккаунтом'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if password:
                try:
                    imap_server = email_service.imap_server
                    imap_port = email_service.imap_port
                    imap = imaplib.IMAP4_SSL(imap_server, imap_port)
                    imap.login(email_address, password)
                    imap.logout()
                except Exception as e:
                    logger.error(f"Ошибка входа IMAP для {email_address}: {str(e)}")
                    return Response(
                        {'ошибка': 'Неверный email или пароль'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            with transaction.atomic():
                email_account = UserEmailAccount.objects.create(
                    user=user,
                    service=email_service,
                    email_address=email_address,
                    oauth_token=None
                )
                if password:
                    email_account.set_password(password)
                email_account.save()

                client_ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=user,
                    action='Добавление почтового ящика',
                    details=f"Добавлен почтовый ящик {email_address} (сервис: {service_name})",
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Почтовый аккаунт {email_address} добавлен для пользователя {user.user_id}")

            return Response(
                {'сообщение': f"Почтовый аккаунт {email_address} успешно добавлен"},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Ошибка добавления почтового аккаунта для пользователя {user.user_id}: {str(e)}")
            return Response(
                {'ошибка': 'Внутренняя ошибка сервера'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
