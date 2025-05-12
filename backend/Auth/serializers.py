from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
import string
from django.conf import settings
from .models import AccountTypes
from twilio.rest import Client
from twilio.base.exceptions import TwilioRestException
import logging

logger = logging.getLogger(__name__)

UserModel = get_user_model()


class PhoneSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=15)

    def validate_phone_number(self, value):
        # Normalize phone number (remove spaces, dashes, etc.)
        cleaned_phone = ''.join(filter(str.isdigit, value))
        if not cleaned_phone.startswith('+'):
            cleaned_phone = '+' + cleaned_phone

        # Check if phone number matches TWILIO_PHONE_NUMBER
        if cleaned_phone == settings.TWILIO_PHONE_NUMBER:
            raise serializers.ValidationError(
                "Cannot send OTP to the Twilio sender phone number."
            )

        return cleaned_phone

    def save(self):
        phone_number = self.validated_data['phone_number']
        user, created = UserModel.objects.get_or_create(phone_number=phone_number)

        # Generate OTP
        otp_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        otp_expiry = timezone.now() + timedelta(minutes=5)

        user.otp_code = otp_code
        user.otp_expiry = otp_expiry
        user.save()

        # Send OTP via Twilio
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=f'Ваш код подтверждения: {otp_code}',
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
        except TwilioRestException as e:
            raise serializers.ValidationError(f"Failed to send OTP: {str(e)}")

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
        logger.info(f"Phone number updated for user {instance.user_id} to {instance.phone_number}")
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
                logger.warning(f"Invalid OTP for {phone_number}: code={otp_code}, expiry={user.otp_expiry}")
                raise serializers.ValidationError('Неверный OTP код или срок действия истек')
        except UserModel.DoesNotExist:
            logger.error(f"User not found: {phone_number}")
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
        logger.info(f"Profile updated for user {instance.user_id}")
        return instance