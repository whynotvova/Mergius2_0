from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
import phonenumbers
from django.conf import settings
from .models import AccountTypes
import requests
import logging

logger = logging.getLogger(__name__)

UserModel = get_user_model()

class PhoneSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)

    def validate_phone_number(self, value):
        cleaned_phone = ''.join(filter(str.isdigit, value))
        if not cleaned_phone.startswith('+'):
            cleaned_phone = '+' + cleaned_phone

        if not cleaned_phone.startswith('+7'):
            raise serializers.ValidationError(
                "В настоящее время поддерживаются только российские номера (+7)."
            )

        try:
            parsed_number = phonenumbers.parse(cleaned_phone, None)
            if not phonenumbers.is_valid_number(parsed_number):
                raise serializers.ValidationError(
                    "Неверный формат номера телефона."
                )
        except phonenumbers.NumberParseException:
            raise serializers.ValidationError(
                "Неверный формат номера телефона."
            )

        return cleaned_phone

    def save(self):
        phone_number = self.validated_data['phone_number']
        user, created = UserModel.objects.get_or_create(phone_number=phone_number)

        if created:
            account_type, _ = AccountTypes.objects.get_or_create(type_name='Персональный')
            user.account_type = account_type

        # Генерация OTP кода
        otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        otp_expiry = timezone.now() + timedelta(minutes=5)

        user.otp_code = otp_code
        user.otp_expiry = otp_expiry
        user.save()

        try:
            smsc_url = "https://smsc.ru/sys/send.php"
            params = {
                "login": settings.SMSC_LOGIN,
                "psw": settings.SMSC_PASSWORD,
                "phones": phone_number[1:],
                "mes": f"Ваш код подтверждения: {otp_code}",
                "fmt": 3,
                "sender": "INFO",
            }
            response = requests.get(smsc_url, params=params)
            response_data = response.json()

            if response_data.get("error_code") is None:
                logger.info(f"OTP отправлен на {phone_number}: id={response_data.get('id')}, cnt={response_data.get('cnt')}, balance={response_data.get('balance')}")
            else:
                error_code = response_data.get("error_code")
                error_msg = response_data.get("error", "Неизвестная ошибка")
                logger.error(f"Ошибка SMSC.ru при отправке OTP на {phone_number}: {error_msg} (Код: {error_code})")
                if error_code == 1:
                    raise serializers.ValidationError("Ошибка отправки SMS: Неверные параметры запроса")
                elif error_code == 2:
                    raise serializers.ValidationError("Ошибка отправки SMS: Неверный логин или пароль")
                elif error_code == 4:
                    raise serializers.ValidationError("Неверный формат номера телефона")
                elif error_code == 7:
                    raise serializers.ValidationError("Недостаточно средств на балансе")
                elif error_code == 9:
                    raise serializers.ValidationError("Слишком много запросов, попробуйте позже")
                raise serializers.ValidationError(f"Не удалось отправить OTP: {error_msg}")
        except requests.RequestException as e:
            logger.error(f"Ошибка сети при отправке OTP на {phone_number}: {str(e)}", exc_info=True)
            raise serializers.ValidationError("Не удалось отправить OTP: Ошибка сети")
        except ValueError as e:
            logger.error(f"Ошибка обработки ответа SMSC.ru для {phone_number}: {str(e)}", exc_info=True)
            raise serializers.ValidationError("Не удалось отправить OTP: Неверный ответ от сервиса")

        return user

class PhoneUpdateSerializer(serializers.Serializer):
    phone_number = serializers.CharField()

    def validate_phone_number(self, value):
        if not value.startswith('+') or not value[1:].isdigit():
            raise serializers.ValidationError('Введите корректный номер телефона (например, +71234567890)')
        if UserModel.objects.filter(phone_number=value).exclude(user_id=self.context['request'].user.user_id).exists():
            raise serializers.ValidationError('Этот номер телефона уже используется')
        return value

    def update(self, instance, validated_data):
        instance.phone_number = validated_data['phone_number']
        instance.is_phone_verified = 0
        instance.save()
        logger.info(f"Номер телефона обновлен для пользователя {instance.user_id} на {instance.phone_number}")
        return instance

class OTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    otp_code = serializers.CharField(max_length=6)

    def validate(self, data):
        phone_number = data.get('phone_number')
        otp_code = data.get('otp_code')
        try:
            user = UserModel.objects.get(phone_number=phone_number)
            if user.otp_code != otp_code or user.otp_expiry < timezone.now():
                logger.warning(f"Неверный OTP для {phone_number}: код={otp_code}, срок действия={user.otp_expiry}")
                raise serializers.ValidationError('Неверный OTP код или срок действия истек')
        except UserModel.DoesNotExist:
            logger.error(f"Пользователь не найден: {phone_number}")
            raise serializers.ValidationError('Пользователь не найден')
        return data

class UsernameSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)

    def validate_username(self, value):
        if not value.strip():
            raise serializers.ValidationError('Имя пользователя не может быть пустым')
        return value

class ProfileSerializer(serializers.ModelSerializer):
    account_type_id = serializers.IntegerField(write_only=True, allow_null=True, required=False)
    date_of_birth = serializers.DateField(allow_null=True, required=False)

    class Meta:
        model = UserModel
        fields = ['username', 'country', 'date_of_birth', 'account_type_id']

    def validate_account_type_id(self, value):
        if value is None:
            return value
        try:
            AccountTypes.objects.get(account_type_id=value)
        except AccountTypes.DoesNotExist:
            raise serializers.ValidationError('Неверный тип аккаунта')
        return value

    def validate_date_of_birth(self, value):
        from datetime import date
        if value and value > date.today():
            raise serializers.ValidationError('Дата рождения не может быть в будущем')
        return value

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        instance.country = validated_data.get('country', instance.country)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        account_type_id = validated_data.get('account_type_id')
        if account_type_id is not None:
            instance.account_type = AccountTypes.objects.get(account_type_id=account_type_id) if account_type_id else None
        instance.save()
        logger.info(f"Профиль обновлен для пользователя {instance.user_id}")
        return instance