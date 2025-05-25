from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from .models import AccountTypes
import logging

logger = logging.getLogger(__name__)

UserModel = get_user_model()

def create_user(strategy, details, backend, user=None, *args, **kwargs):
    if user:
        logger.debug(f"Existing user: {user}")
        return {'is_new': False, 'user': user}

    fields = {
        'username': details.get('first_name') or details.get('username'),
        'phone_number': details.get('phone'),
        'social_provider': backend.name,
        'social_id': kwargs.get('uid'),
        'is_phone_verified': 1,
        'is_active': 1,
    }
    try:
        personal_account = AccountTypes.objects.get(type_name="Персональный")
        fields['account_type'] = personal_account
    except AccountTypes.DoesNotExist:
        logger.error("Тип аккаунта 'Персональный' не существует в AccountTypes")
        raise ValueError("Тип аккаунта 'Персональный' не существует в AccountTypes")
    user = UserModel.objects.create_user(**fields)
    logger.info(f"Created new user: {user}")
    return {'is_new': True, 'user': user}

def save_token(backend, user, *args, **kwargs):
    logger.debug(f"Saving token for user: {user}")
    if user:
        token, created = Token.objects.get_or_create(user=user)
        redirect_url = f"https://mergius.ru/vk/callback/?token={token.key}&user_id={user.user_id}"
        logger.debug(f"Redirecting to: {redirect_url}")
        return {'redirect_url': redirect_url}
    logger.warning("Пользователь не указан для сохранения токена")
    return None