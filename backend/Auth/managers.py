from django.contrib.auth.models import BaseUserManager
from profile_user.models import AccountTypes

class CustomUserManager(BaseUserManager):
    def create_user(self, phone_number=None, email=None, **extra_fields):
        if not phone_number and not email:
            raise ValueError('Phone number or email is required')
        if email:
            email = self.normalize_email(email)
        extra_fields.setdefault('is_active', 1)
        extra_fields.setdefault('is_phone_verified', 0)
        # Set default account_type to "Персональный"
        if 'account_type' not in extra_fields:
            try:
                personal_account = AccountTypes.objects.get(type_name="Персональный")
                extra_fields['account_type'] = personal_account
            except AccountTypes.DoesNotExist:
                raise ValueError('Персональный account type does not exist in AccountTypes')
        user = self.model(phone_number=phone_number, email=email, **extra_fields)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_phone_verified', 1)
        extra_fields.setdefault('is_active', 1)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True')

        return self.create_user(phone_number=phone_number, **extra_fields)