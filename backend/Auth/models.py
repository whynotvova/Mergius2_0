from django.contrib.auth.models import AbstractBaseUser
from django.db import models
from django.core.exceptions import ValidationError
from .managers import CustomUserManager

class AccountTypes(models.Model):
    account_type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.type_name

    class Meta:
        db_table = 'AccountTypes'
        managed = True

class CustomUser(AbstractBaseUser):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=100, null=True, unique=True)
    email = models.CharField(max_length=255, null=True, unique=True)
    phone_number = models.CharField(max_length=15, null=True, unique=True)
    nickname = models.CharField(max_length=50, null=True)
    date_of_birth = models.DateField(null=True)
    country = models.CharField(max_length=100, null=True)
    is_phone_verified = models.IntegerField(default=0)
    last_login = models.CharField(max_length=255, null=True)
    is_superuser = models.IntegerField(default=0)
    is_staff = models.IntegerField(default=0)
    social_provider = models.CharField(max_length=50, null=True)
    social_id = models.CharField(max_length=255, null=True)
    is_active = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    account_type = models.ForeignKey(AccountTypes, null=True, on_delete=models.SET_NULL)
    otp_code = models.CharField(max_length=6, null=True)
    otp_expiry = models.DateTimeField(null=True)

    USERNAME_FIELD = 'phone_number'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def clean(self):
        if self.email == '':
            self.email = None
        if self.email is not None:
            if CustomUser.objects.exclude(pk=self.pk).filter(email=self.email).exists():
                raise ValidationError({'email': 'Этот email уже используется'})

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.phone_number or self.email or self.username

    class Meta:
        db_table = 'Users'