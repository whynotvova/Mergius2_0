from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileSerializer, MailFolderSerializer, UserSettingsSerializer
from .models import MailFolder, AuditLog, UserEmailAccount, EmailService, User_Settings
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging
import requests  # Added for IP lookup

User = get_user_model()
logger = logging.getLogger(__name__)

# Helper function to get the client's real IP address
def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0].strip()
    else:
        ip = request.META.get('REMOTE_ADDR', 'Unknown')

    # In local development, REMOTE_ADDR might be 127.0.0.1; fetch public IP instead
    if ip in ('127.0.0.1', '::1', 'Unknown'):
        try:
            response = requests.get('https://api.ipify.org?format=json', timeout=5)
            response.raise_for_status()
            ip_data = response.json()
            ip = ip_data.get('ip', 'Unknown')
        except requests.RequestException as e:
            logger.error(f"Error fetching public IP: {str(e)}")
            ip = 'Unknown'

    return ip

class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        logger.debug(f"GET /api/profile/ by user {user.user_id}")
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request):
        user = request.user
        logger.debug(f"DELETE /api/profile/ by user {user.user_id}")
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
            logger.info(f"User account {user.user_id} deleted")
            return Response({'message': 'Account deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.error(f"Error deleting account for user {user.user_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MailFolderView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        logger.debug(f"GET /api/profile/folders/ by user {user.user_id}")
        email_accounts = UserEmailAccount.objects.filter(user=user)
        folders = MailFolder.objects.filter(email_account__in=email_accounts)
        serializer = MailFolderSerializer(folders, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        logger.debug(f"POST /api/profile/folders/ by user {user.user_id} with data: {request.data}")
        email_account = UserEmailAccount.objects.filter(user=user).first()
        if not email_account:
            email_service, created = EmailService.objects.get_or_create(
                service_name='Gmail',
                defaults={
                    'imap_server': 'imap.gmail.com',
                    'smtp_server': 'smtp.gmail.com',
                    'imap_port': 993,
                    'smtp_port': 587
                }
            )
            email_account = UserEmailAccount.objects.create(
                user=user,
                service=email_service,
                email_address=f"{user.username or 'user'}_{user.user_id}@example.com",
                created_at=timezone.now()
            )
            logger.info(f"Created default email account for user {user.user_id}: {email_account.email_address}")

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
            logger.info(f"Folder '{folder.folder_name}' created for user {user.user_id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, folder_id):
        try:
            folder = MailFolder.objects.get(folder_id=folder_id, email_account__user=request.user)
        except MailFolder.DoesNotExist:
            logger.error(f"Folder {folder_id} not found for user {request.user.user_id}")
            return Response({'error': 'Folder not found'}, status=status.HTTP_404_NOT_FOUND)

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
            logger.info(f"Folder '{folder.folder_name}' updated for user {request.user.user_id}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        logger.error(f"Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, folder_id):
        try:
            folder = MailFolder.objects.get(folder_id=folder_id, email_account__user=request.user)
        except MailFolder.DoesNotExist:
            logger.error(f"Folder {folder_id} not found for user {request.user.user_id}")
            return Response({'error': 'Folder not found'}, status=status.HTTP_404_NOT_FOUND)

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
        logger.info(f"Folder '{folder_name}' deleted for user {request.user.user_id}")
        return Response(status=status.HTTP_204_NO_CONTENT)

class UserSettingsView(APIView):
    def get(self, request):
        user_id = request.data.get('user_id') or request.query_params.get('user_id')
        if not user_id:
            logger.error("No user_id provided in GET /api/profile/settings/")
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(user_id=user_id)
            logger.debug(
                f"GET /api/profile/settings/ for user {user.user_id}, Origin: {request.META.get('HTTP_ORIGIN', 'Unknown')}")
            settings = User_Settings.objects.filter(user=user).first()
            if not settings:
                logger.info(f"Creating new settings for user {user.user_id}")
                client_ip = get_client_ip(request)
                settings = User_Settings.objects.create(
                    user=user,
                    language='ru',
                    theme='default'
                )
                AuditLog.objects.create(
                    user=user,
                    action='Создание настроек',
                    details='Созданы настройки по умолчанию для пользователя',
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Created default settings for user {user.user_id}: language=ru, theme=default")
            serializer = UserSettingsSerializer(settings)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            logger.error(f"User with user_id {user_id} not found")
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error fetching settings for user_id {user_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            logger.error("No user_id provided in PUT /api/profile/settings/")
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(user_id=user_id)
            logger.debug(
                f"PUT /api/profile/settings/ for user {user.user_id} with data: {request.data}, Origin: {request.META.get('HTTP_ORIGIN', 'Unknown')}")
            settings = User_Settings.objects.filter(user=user).first()
            if not settings:
                logger.info(f"Creating new settings for user {user.user_id}")
                client_ip = get_client_ip(request)
                settings = User_Settings.objects.create(
                    user=user,
                    language='ru',
                    theme='default'
                )
                AuditLog.objects.create(
                    user=user,
                    action='Создание настроек',
                    details='Созданы настройки по умолчанию для пользователя',
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Created default settings for user {user.user_id}: language=ru, theme=default")

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
                logger.info(f"Settings updated for user {user.user_id}: {request.data}")
                return Response(serializer.data, status=status.HTTP_200_OK)
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            logger.error(f"User with user_id {user_id} not found")
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error updating settings for user_id {user_id}: {str(e)}")
            return Response({'error': 'Internal server error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        user_id = request.data.get('user_id')
        if not user_id:
            logger.error("No user_id provided in POST /api/profile/settings/")
            return Response({'error': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user = User.objects.get(user_id=user_id)
            logger.debug(
                f"POST /api/profile/settings/ for user {user.user_id} with data: {request.data}, Origin: {request.META.get('HTTP_ORIGIN', 'Unknown')}")
            if User_Settings.objects.filter(user=user).exists():
                logger.warning(f"Settings already exist for user {user.user_id}")
                return Response({'error': 'Settings already exist for this user'}, status=status.HTTP_400_BAD_REQUEST)

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
                logger.info(f"Settings created for user {user.user_id}: {request.data}")
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            logger.error(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            logger.error(f"User with user_id {user_id} not found")
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error creating settings for user_id {user_id}: {str(e)}")