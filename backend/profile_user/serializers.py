from rest_framework import serializers
from .models import AuditLog, MailFolder, UserEmailAccount, EmailService
from django.apps import apps


class AuditLogSerializer(serializers.ModelSerializer):
    ip_address = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(format='%d.%m.%Y')

    class Meta:
        model = AuditLog
        fields = ['action', 'details', 'timestamp', 'ip_address']

    def get_ip_address(self, obj):
        details = obj.details or ''
        if 'с IP' in details:
            return details.split('с IP ')[-1]
        return 'Unknown'


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


class UserProfileSerializer(serializers.ModelSerializer):
    audit_logs = AuditLogSerializer(many=True)
    date_of_birth = serializers.DateField(format='%d.%m.%Y', allow_null=True)
    account_type = serializers.CharField(source='account_type.type_name', allow_null=True, default='Не указан')
    email_accounts = UserEmailAccountSerializer(many=True)
    folders = serializers.SerializerMethodField()

    class Meta:
        model = apps.get_model('Auth', 'CustomUser')
        fields = ['username', 'date_of_birth', 'country', 'audit_logs', 'account_type', 'email_accounts', 'folders']

    def get_folders(self, obj):
        email_accounts = UserEmailAccount.objects.filter(user=obj)
        folders = MailFolder.objects.filter(email_account__in=email_accounts)
        return MailFolderSerializer(folders, many=True).data
