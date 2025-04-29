from rest_framework import serializers
from .models import AuditLog, MailFolder, UserEmailAccount, EmailService, User_Settings
from django.apps import apps

class AuditLogSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(format='%d.%m.%Y')

    class Meta:
        model = AuditLog
        fields = ['action', 'details', 'timestamp', 'ip_address']

class EmailServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailService
        fields = ['service_id', 'service_name', 'imap_server', 'smtp_server', 'imap_port', 'smtp_port']

class UserEmailAccountSerializer(serializers.ModelSerializer):
    service = EmailServiceSerializer()

    class Meta:
        model = UserEmailAccount
        fields = ['email_account_id', 'user', 'service', 'email_address', 'created_at']

class MailFolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = MailFolder
        fields = ['folder_id', 'email_account', 'folder_name', 'sort_order', 'folder_icon']

    def validate(self, data):
        email_account = data.get('email_account')
        folder_name = data.get('folder_name')
        if MailFolder.objects.filter(email_account=email_account, folder_name=folder_name).exists():
            raise serializers.ValidationError({'folder_name': 'Папка с таким именем уже существует'})
        return data

class UserSettingsSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=apps.get_model('Auth', 'CustomUser').objects.all())

    class Meta:
        model = User_Settings
        fields = ['setting_id', 'user', 'language', 'theme']

    def create(self, validated_data):
        user = validated_data.pop('user')
        return User_Settings.objects.create(user=user, **validated_data)

class UserProfileSerializer(serializers.ModelSerializer):
    audit_logs = AuditLogSerializer(many=True)
    date_of_birth = serializers.DateField(format='%d.%m.%Y', allow_null=True)
    account_type = serializers.CharField(source='account_type.type_name', allow_null=True, default='Не указан')
    email_accounts = UserEmailAccountSerializer(many=True)
    folders = serializers.SerializerMethodField()
    phone_number = serializers.CharField(allow_null=True, default='Не указан')
    user_id = serializers.IntegerField()  # Added user_id field

    class Meta:
        model = apps.get_model('Auth', 'CustomUser')
        fields = ['user_id', 'username', 'date_of_birth', 'country', 'phone_number', 'audit_logs', 'account_type', 'email_accounts', 'folders']

    def get_folders(self, obj):
        email_accounts = UserEmailAccount.objects.filter(user=obj)
        folders = MailFolder.objects.filter(email_account__in=email_accounts)
        return MailFolderSerializer(folders, many=True).data