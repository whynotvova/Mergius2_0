from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model

UserModel = get_user_model()

class CustomAuthBackend(BaseBackend):
    def authenticate(self, request, phone_number=None, otp_code=None):
        try:
            user = UserModel.objects.get(phone_number=phone_number)
            if user.otp_code == otp_code and user.otp_expiry > timezone.now():
                user.is_phone_verified = 1
                user.otp_code = None
                user.otp_expiry = None
                user.save()
                return user
            return None
        except UserModel.DoesNotExist:
            return None

    def get_user(self, user_id):
        try:
            return UserModel.objects.get(user_id=user_id)
        except UserModel.DoesNotExist:
            return None