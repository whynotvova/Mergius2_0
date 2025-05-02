from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from profile_user.models import UserEmailAccount, EmailService, AuditLog
from profile_user.serializers import EmailServiceSerializer
from django.db import transaction
import logging
import imaplib
import requests

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

class AddEmailAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            user = request.user
            service_name = request.data.get('service_name')
            email_address = request.data.get('email_address')
            password = request.data.get('password')

            logger.debug(f"POST /api/mail/email-accounts/add/ by user {user.user_id} with data: {{service_name: {service_name}, email_address: {email_address}}}")

            if not all([service_name, email_address]):
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

            if password:
                try:
                    imap_server = email_service.imap_server
                    imap_port = email_service.imap_port
                    imap = imaplib.IMAP4_SSL(imap_server, imap_port)
                    imap.login(email_address, password)
                    imap.logout()
                except Exception as e:
                    logger.error(f"IMAP login failed for {email_address}: {str(e)}")
                    return Response(
                        {'error': 'Invalid email or password'},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            with transaction.atomic():
                email_account = UserEmailAccount.objects.create(
                    user=user,
                    service=email_service,
                    email_address=email_address,
                    avatar='/images/mail/default-avatar.png',
                    oauth_token=None
                )
                if password:
                    email_account.set_password(password)  # Хэшируем пароль
                email_account.save()

                client_ip = get_client_ip(request)
                AuditLog.objects.create(
                    user=user,
                    action='Добавление почтового ящика',
                    details=f"Добавлен почтовый ящик {email_address} (сервис: {service_name})",
                    ip_address=client_ip,
                    timestamp=timezone.now()
                )
                logger.info(f"Email account {email_address} added for user {user.user_id}")

            return Response(
                {'message': f"Email account {email_address} added successfully"},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            logger.error(f"Error adding email account for user {user.user_id}: {str(e)}")
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