from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.db import models
from profile_user.models import AccountTypes

class CustomUserManager(BaseUserManager):
    def create_user(self, phone_number, **extra_fields):
        if not phone_number:
            raise ValueError('The Phone Number field must be set')
        user = self.model(phone_number=phone_number, **extra_fields)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone_number, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(phone_number, **extra_fields)

class CustomUser(AbstractBaseUser):
    user_id = models.AutoField(primary_key=True)
    phone_number = models.CharField(max_length=15, unique=True)
    email = models.EmailField(max_length=255, blank=True, null=True)
    username = models.CharField(max_length=150, blank=True, null=True)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)
    is_phone_verified = models.IntegerField(default=0)
    is_active = models.IntegerField(default=1)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    social_provider = models.CharField(max_length=50, blank=True, null=True)
    social_id = models.CharField(max_length=255, blank=True, null=True)
    account_type = models.ForeignKey(AccountTypes, on_delete=models.SET_NULL, null=True, blank=True)

    objects = CustomUserManager()

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []

    def __str__(self):
        return self.phone_number

    class Meta:
        db_table = 'Users'
        managed = False  # Set to False if Users table is pre-existing