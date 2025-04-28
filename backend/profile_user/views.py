from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .serializers import UserProfileSerializer, MailFolderSerializer
from .models import MailFolder, AuditLog, UserEmailAccount, EmailService
from django.utils import timezone
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
logger = logging.getLogger(__name__)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        logger.debug(f"GET /api/profile/ by user {user.user_id}")
        serializer = UserProfileSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
            AuditLog.objects.create(
                user=user,
                action='Создание папки',
                details=f'Создана папка "{folder.folder_name}" с IP {request.META.get("REMOTE_ADDR", "Unknown")}',
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
            AuditLog.objects.create(
                user=request.user,
                action='Обновление папки',
                details=f'Обновлена папка "{folder.folder_name}" с IP {request.META.get("REMOTE_ADDR", "Unknown")}',
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
        AuditLog.objects.create(
            user=request.user,
            action='Удаление папки',
            details=f'Удалена папка "{folder_name}" с IP {request.META.get("REMOTE_ADDR", "Unknown")}',
            timestamp=timezone.now()
        )
        logger.info(f"Folder '{folder_name}' deleted for user {request.user.user_id}")
        return Response(status=status.HTTP_204_NO_CONTENT)