from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from .serializers import PhoneSerializer, OTPSerializer, ProfileSerializer
from social_django.utils import psa
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import logging

logger = logging.getLogger(__name__)

UserModel = get_user_model()

@method_decorator(csrf_exempt, name='dispatch')
class PhoneAuthView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.debug(f"PhoneAuthView received data: {request.data}")
        serializer = PhoneSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(f"User {user.phone_number} processed for OTP")
            return Response({'phone_number': user.phone_number}, status=status.HTTP_200_OK)
        logger.error(f"PhoneAuthView errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class OTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.debug(f"OTPView received data: {request.data}")
        serializer = OTPSerializer(data=request.data)
        if serializer.is_valid():
            phone_number = serializer.validated_data['phone_number']
            otp_code = serializer.validated_data['otp_code']
            try:
                user = UserModel.objects.get(phone_number=phone_number)
                if user.otp_code == otp_code and user.otp_expiry > timezone.now():
                    user.is_phone_verified = 1
                    user.otp_code = None
                    user.otp_expiry = None
                    user.save()
                    login(request, user, backend='Auth.backends.CustomAuthBackend')
                    token, created = Token.objects.get_or_create(user=user)
                    logger.info(f"User {user.phone_number} authenticated, token: {token.key}")
                    return Response({'token': token.key, 'user_id': user.user_id}, status=status.HTTP_200_OK)
                logger.warning(f"Invalid OTP for {phone_number}")
                return Response({'detail': 'Неверный OTP код или срок действия истек'}, status=status.HTTP_400_BAD_REQUEST)
            except UserModel.DoesNotExist:
                logger.error(f"User not found: {phone_number}")
                return Response({'detail': 'Пользователь не найден'}, status=status.HTTP_400_BAD_REQUEST)
        logger.error(f"OTPView errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SocialAuthView(APIView):
    permission_classes = [AllowAny]

    @psa('social:complete')
    def post(self, request, backend):
        logger.debug(f"SocialAuthView for {backend} with data: {request.data}")
        try:
            user = request.backend.auth_complete(**request.data)
            if user and user.is_active:
                login(request, user)
                token, created = Token.objects.get_or_create(user=user)
                logger.info(f"Social auth success for user {user.user_id}, token: {token.key}")
                return Response({
                    'token': token.key,
                    'user_id': user.user_id,
                }, status=status.HTTP_200_OK)
            logger.warning(f"Invalid social auth data for {backend}")
            return Response({'detail': 'Invalid social auth data'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"Social auth error for {backend}: {str(e)}")
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    def patch(self, request):
        logger.debug(f"ProfileView received data: {request.data}")
        user = request.user
        if not user.is_authenticated:
            logger.warning("Unauthenticated profile update attempt")
            return Response({'detail': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        serializer = ProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Profile updated for user {user.user_id}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        logger.error(f"ProfileView errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)