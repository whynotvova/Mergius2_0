from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.authtoken.models import Token
from django.contrib.auth import login
from .serializers import PhoneSerializer, OTPSerializer, ProfileSerializer, PhoneUpdateSerializer, UsernameSerializer, VKAuthSerializer
from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.middleware.csrf import get_token
from .models import AccountTypes
import logging
import requests
import phonenumbers
from django.conf import settings
from datetime import datetime
import random
import uuid

logger = logging.getLogger(__name__)

UserModel = get_user_model()
ADJECTIVES = ['Cool', 'Brave', 'Swift', 'Bright', 'Lucky', 'Wise', 'Happy', 'Bold']
NOUNS = ['Star', 'Fox', 'Wolf', 'Eagle', 'River', 'Cloud', 'Tiger', 'Moon']

def generate_random_nickname():
    adjective = random.choice(ADJECTIVES)
    noun = random.choice(NOUNS)
    number = random.randint(100, 999)
    nickname = f"{adjective}{noun}{number}"
    while UserModel.objects.filter(username=nickname).exists():
        adjective = random.choice(ADJECTIVES)
        noun = random.choice(NOUNS)
        number = random.randint(100, 999)
        nickname = f"{adjective}{noun}{number}"
    return nickname

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
class PhoneUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        logger.debug(f"PhoneUpdateView received data: {request.data}")
        serializer = PhoneUpdateSerializer(request.user, data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.update(request.user, serializer.validated_data)
            logger.info(f"Phone number updated for user {user.user_id} to {user.phone_number}")
            serializer = PhoneSerializer(data={'phone_number': user.phone_number})
            if serializer.is_valid():
                serializer.save()
                return Response({'phone_number': user.phone_number}, status=status.HTTP_200_OK)
            logger.error(f"PhoneSerializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        logger.error(f"PhoneUpdateView errors: {serializer.errors}")
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
                if user.otp_code != otp_code:
                    logger.warning(
                        f"Invalid OTP code for {phone_number}: provided={otp_code}, expected={user.otp_code}")
                    return Response({'detail': 'Неверный OTP код'}, status=status.HTTP_400_BAD_REQUEST)
                if user.otp_expiry < timezone.now():
                    logger.warning(f"OTP expired for {phone_number}: expiry={user.otp_expiry}")
                    return Response({'detail': 'Срок действия OTP кода истек'}, status=status.HTTP_400_BAD_REQUEST)
                user.is_phone_verified = 1
                user.otp_code = None
                user.otp_expiry = None
                user.save()
                login(request, user, backend='Auth.backends.CustomAuthBackend')
                token, created = Token.objects.get_or_create(user=user)
                logger.info(f"User {user.phone_number} authenticated, token: {token.key}")
                return Response({
                    'token': token.key,
                    'user_id': user.user_id,
                    'is_phone_verified': user.is_phone_verified,
                    'username': user.username,
                    'country': user.country,
                    'date_of_birth': user.date_of_birth,
                }, status=status.HTTP_200_OK)
            except UserModel.DoesNotExist:
                logger.error(f"User not found: {phone_number}")
                return Response({'detail': 'Пользователь не найден'}, status=status.HTTP_400_BAD_REQUEST)
        logger.error(f"OTPView errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class VKCallbackView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.debug(f"VKCallbackView received data at {datetime.utcnow().isoformat()}: {request.data}")
        logger.debug(f"Received CSRF token: {request.headers.get('X-CSRFToken')}")
        serializer = VKAuthSerializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"VKCallbackView serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data['code']
        device_id = request.data.get('device_id')
        code_verifier = request.data.get('code_verifier')

        try:
            token_url = 'https://id.vk.com/oauth2/auth'
            token_params = {
                'grant_type': 'authorization_code',
                'client_id': settings.SOCIAL_AUTH_VK_OAUTH2_KEY,
                'client_secret': settings.SOCIAL_AUTH_VK_OAUTH2_SECRET,
                'redirect_uri': settings.SOCIAL_AUTH_VK_OAUTH2_REDIRECT_URI,
                'code': code,
            }
            if device_id:
                token_params['device_id'] = device_id
            if code_verifier:
                token_params['code_verifier'] = code_verifier
            else:
                logger.warning("No code_verifier provided in request")
                return Response({'detail': 'Ошибка: code_verifier обязателен для VK ID SDK'}, status=status.HTTP_400_BAD_REQUEST)

            logger.debug(f"Sending token request to {token_url} with params: {token_params} at {datetime.utcnow().isoformat()}")
            token_response = requests.post(token_url, data=token_params)
            logger.debug(f"Token response status: {token_response.status_code}, body: {token_response.text}")
            token_data = token_response.json()

            if 'access_token' not in token_data:
                error_msg = token_data.get('error_description', 'No error description')
                if 'error' in token_data:
                    error_msg = f"{token_data['error']}: {error_msg}"
                logger.error(f"VK token error: {error_msg}")
                return Response({'detail': f'Ошибка получения токена VK: {error_msg}'}, status=status.HTTP_400_BAD_REQUEST)

            access_token = token_data['access_token']
            user_id = token_data.get('user_id')
            logger.debug(f"Received access_token: {access_token}, user_id: {user_id}")
            user_url = 'https://api.vk.com/method/users.get'
            user_params = {
                'access_token': access_token,
                'v': '5.199',
                'fields': 'phone,first_name,bdate,country',
            }
            logger.debug(f"Fetching user data from {user_url} with params: {user_params}")
            user_response = requests.get(user_url, params=user_params)
            user_data = user_response.json()
            logger.debug(f"User data response: {user_data}")

            if 'response' not in user_data or not user_data['response']:
                logger.error(f"VK user data error: {user_data.get('error', 'No error')}")
                return Response({'detail': 'Ошибка получения данных пользователя VK'}, status=status.HTTP_400_BAD_REQUEST)

            user_info = user_data['response'][0]
            phone = user_info.get('phone')
            bdate = user_info.get('bdate')
            country = user_info.get('country', {}).get('title') if user_info.get('country') else None
            nickname = generate_random_nickname()
            logger.debug(f"User info: phone={phone}, bdate={bdate}, country={country}, generated_nickname={nickname}")
            if phone:
                try:
                    parsed_number = phonenumbers.parse(phone, None)
                    if not phonenumbers.is_valid_number(parsed_number) or not phone.startswith('+7'):
                        logger.warning(f"Invalid VK phone: {phone}, falling back to temporary phone")
                        phone = None
                except phonenumbers.NumberParseException:
                    logger.warning(f"Invalid VK phone format: {phone}, falling back to temporary phone")
                    phone = None
            if not phone:
                logger.warning(f"No valid phone number provided by VK for user_id={user_id}, using temporary phone")
                phone = f'+7{str(user_id).zfill(10)[-10:]}'
                is_phone_verified = 0
            else:
                is_phone_verified = 1
            date_of_birth = None
            if bdate:
                try:
                    parts = bdate.split('.')
                    if len(parts) == 3 and parts[2]:
                        day, month, year = map(int, parts)
                        date_of_birth = f"{year}-{month:02d}-{day:02d}"
                        datetime.strptime(date_of_birth, '%Y-%m-%d')
                    else:
                        logger.warning(f"Invalid or incomplete bdate: {bdate}")
                except (ValueError, TypeError):
                    logger.warning(f"Failed to parse bdate: {bdate}")
                    date_of_birth = None
            if country:
                country = country[:100] if len(country) > 100 else country
            else:
                logger.debug("No country provided by VK")
            try:
                user = UserModel.objects.get(social_provider='vk', social_id=user_id)
                logger.debug(f"Found existing user: {user.phone_number}")
                if (user.phone_number != phone or user.username != nickname or
                    user.date_of_birth != date_of_birth or user.country != country):
                    user.phone_number = phone
                    user.is_phone_verified = is_phone_verified
                    user.username = nickname
                    user.date_of_birth = date_of_birth
                    user.country = country
                    user.save()
            except UserModel.DoesNotExist:
                user, created = UserModel.objects.get_or_create(
                    phone_number=phone,
                    defaults={
                        'username': nickname,
                        'social_provider': 'vk',
                        'social_id': str(user_id),
                        'is_phone_verified': is_phone_verified,
                        'is_active': 1,
                        'account_type': AccountTypes.objects.get(type_name='Персональный'),
                        'date_of_birth': date_of_birth,
                        'country': country,
                    }
                )
                if not created:
                    user.social_provider = 'vk'
                    user.social_id = str(user_id)
                    user.is_phone_verified = is_phone_verified
                    user.username = nickname
                    user.date_of_birth = date_of_birth
                    user.country = country
                    user.save()
                logger.debug(f"Created new user: {user.phone_number}, created={created}")
            login(request, user, backend='Auth.backends.CustomAuthBackend')
            token, created = Token.objects.get_or_create(user=user)
            logger.info(f"VK auth success for user {user.user_id}, token: {token.key}")
            return Response({
                'token': token.key,
                'user_id': user.user_id,
                'is_phone_verified': user.is_phone_verified,
                'username': user.username,
                'phone_number': user.phone_number if user.is_phone_verified else None,
                'needs_phone_verification': not user.is_phone_verified,
                'date_of_birth': user.date_of_birth,
                'country': user.country,
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"VK auth error: {str(e)}", exc_info=True)
            return Response({'detail': f'Ошибка авторизации VK: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        logger.debug(f"ProfileView received data: {request.data}")
        user = request.user
        serializer = ProfileSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f"Profile updated for user {user.user_id}")
            return Response(serializer.data, status=status.HTTP_200_OK)
        logger.error(f"ProfileView errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(csrf_exempt, name='dispatch')
class CheckUsernameView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        logger.debug(f"CheckUsernameView received query: {request.query_params}")
        serializer = UsernameSerializer(data=request.query_params)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            exists = UserModel.objects.filter(username=username).exists()
            logger.info(f"Username check: {username} exists={exists}")
            return Response({'доступен': not exists}, status=status.HTTP_200_OK)
        logger.error(f"CheckUsernameView errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@method_decorator(ensure_csrf_cookie, name='dispatch')
class GetCSRFTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        logger.debug("GetCSRFTokenView accessed")
        csrf_token = get_token(request)
        logger.debug(f"Generated CSRF token: {csrf_token}")
        return Response({'csrfToken': csrf_token}, status=status.HTTP_200_OK)