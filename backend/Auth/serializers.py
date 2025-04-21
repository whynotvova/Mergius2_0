from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random
import string
from twilio.rest import Client
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

UserModel = get_user_model()

class PhoneSerializer(serializers.Serializer):
    phone_number = serializers.CharField()

    def validate_phone_number(self, value):
        if not value.startswith('+') or not value[1:].isdigit():
            raise serializers.ValidationError('Введите корректный номер телефона (например, +71234567890)')
        return value

    def send_otp_sms(self, phone_number, otp_code):
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                body=f'Ваш OTP код: {otp_code}',
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            logger.info(f'SMS sent to {phone_number}: SID {message.sid}')
            return True
        except Exception as e:
            logger.error(f'Twilio exception: {str(e)}')
            print(f'OTP for {phone_number}: {otp_code}')
            return False

    def generate_otp(self, user):
        user.otp_code = ''.join(random.choices(string.digits, k=6))
        user.otp_expiry = timezone.now() + timedelta(minutes=5)
        user.save()
        self.send_otp_sms(user.phone_number, user.otp_code)

    def save(self):
        phone_number = self.validated_data['phone_number']
        logger.debug(f"Creating/retrieving user with phone: {phone_number}")
        try:
            user = UserModel.objects.get(phone_number=phone_number)
        except UserModel.DoesNotExist:
            logger.debug("User does not exist, creating new user")
            user = UserModel.objects.create_user(phone_number=phone_number)
        self.generate_otp(user)
        return user

class OTPSerializer(serializers.Serializer):
    phone_number = serializers.CharField()
    otp_code = serializers.CharField(max_length=6)

    def validate(self, data):
        phone_number = data.get('phone_number')
        otp_code = data.get('otp_code')
        try:
            user = UserModel.objects.get(phone_number=phone_number)
            if user.otp_code != otp_code or user.otp_expiry < timezone.now():
                raise serializers.ValidationError('Неверный OTP код или срок действия истек')
        except UserModel.DoesNotExist:
            raise serializers.ValidationError('Пользователь не найден')
        return data

class ProfileSerializer(serializers.ModelSerializer):
    account_type_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = UserModel
        fields = ['username', 'account_type_id']

    def validate_account_type_id(self, value):
        from profile_user.models import AccountTypes
        try:
            AccountTypes.objects.get(account_type_id=value)
        except AccountTypes.DoesNotExist:
            raise serializers.ValidationError('Неверный тип аккаунта')
        return value

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        account_type_id = validated_data.get('account_type_id')
        if account_type_id:
            from profile_user.models import AccountTypes
            instance.account_type = AccountTypes.objects.get(account_type_id=account_type_id)
        instance.save()
        return instance