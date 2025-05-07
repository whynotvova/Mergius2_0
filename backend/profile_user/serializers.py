from rest_framework import serializers
from .models import AuditLog, MailFolder, UserEmailAccount, EmailService, User_Settings, Emails, Email_Recipients, \
    EmailFolderAssignment, EmailAttachment
from django.contrib.auth import get_user_model

User = get_user_model()


class AuditLogSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(format='%d.%m.%Y')

    class Meta:
        model = AuditLog
        fields = ['action', 'details', 'timestamp', 'ip_address']


class EmailServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailService
        fields = ['service_id', 'service_name', 'imap_server', 'smtp_server', 'imap_port', 'smtp_port', 'service_icon']


class UserEmailAccountSerializer(serializers.ModelSerializer):
    service = EmailServiceSerializer(read_only=True)
    service_name = serializers.CharField(write_only=True)

    class Meta:
        model = UserEmailAccount
        fields = [
            'email_account_id', 'user', 'service', 'service_name', 'email_address',
            'avatar', 'created_at', 'last_fetched'
        ]

    def create(self, validated_data):
        service_name = validated_data.pop('service_name')
        try:
            service = EmailService.objects.get(service_name=service_name)
        except EmailService.DoesNotExist:
            raise serializers.ValidationError({'service_name': f"Email service '{service_name}' not found"})
        validated_data['service'] = service
        return super().create(validated_data)


class MailFolderSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='folder_id', read_only=True)

    class Meta:
        model = MailFolder
        fields = ['id', 'email_account', 'folder_name', 'sort_order', 'folder_icon']
        extra_kwargs = {
            'id': {'read_only': True},
        }

    def validate(self, data):
        email_account = data.get('email_account')
        folder_name = data.get('folder_name')
        if MailFolder.objects.filter(email_account=email_account, folder_name=folder_name).exists():
            raise serializers.ValidationError({'folder_name': 'Папка с таким именем уже существует'})
        return data


class EmailRecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Email_Recipients
        fields = ['recipient_address', 'recipient_type']


class EmailAttachmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailAttachment
        fields = ['attachment_id', 'file_name', 'file_size', 'created_at']


class EmailFolderAssignmentSerializer(serializers.ModelSerializer):
    folder_id = serializers.IntegerField(source='folder.folder_id')
    folder_name = serializers.CharField(source='folder.folder_name')

    class Meta:
        model = EmailFolderAssignment
        fields = ['folder_id', 'folder_name']


class EmailSerializer(serializers.ModelSerializer):
    recipients = EmailRecipientSerializer(many=True, read_only=True)
    email_account = UserEmailAccountSerializer(read_only=True)
    folder_assignments = EmailFolderAssignmentSerializer(many=True, read_only=True)
    attachments = EmailAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Emails
        fields = [
            'email_id', 'email_account', 'message_id', 'imap_id', 'sender', 'subject',
            'body', 'sent_date', 'received_date', 'status', 'recipients', 'folder_assignments', 'attachments'
        ]


class AssignCategoriesSerializer(serializers.Serializer):
    email_id = serializers.IntegerField(required=True, error_messages={
        'required': 'Поле email_id обязательно для назначения категории.'
    })
    folder_id = serializers.IntegerField(required=True, error_messages={
        'required': 'Поле folder_id обязательно для назначения категории.'
    })


class TranslateEmailSerializer(serializers.Serializer):
    text = serializers.CharField(required=True, allow_blank=False, error_messages={
        'required': 'Поле text обязательно для перевода.',
        'blank': 'Текст не может быть пустым.'
    })
    target_language = serializers.CharField(required=True, max_length=10, error_messages={
        'required': 'Поле target_language обязательно для перевода.'
    })

    def validate_target_language(self, value):
        valid_languages = [
            'ru', 'en', 'fr', 'de', 'es', 'it', 'zh', 'ja', 'ko', 'ar', 'pt', 'tr', 'nl', 'pl', 'fi', 'sv',
            'he', 'cs', 'el', 'hu', 'no', 'da', 'uk', 'bg', 'ro', 'sk', 'sl', 'sr', 'et', 'lv', 'lt', 'vi', 'th',
            'id', 'hi', 'bn', 'ta', 'te', 'ml', 'ur', 'fa', 'sw', 'am', 'zu', 'ha', 'ps', 'my', 'km', 'si', 'lo',
            'ka', 'hy', 'az', 'be', 'ky', 'kk', 'uz', 'tk', 'mn', 'tt', 'ba', 'cv', 'ce', 'udm', 'sah', 'mhr', 'mrj',
            'alt', 'bxr', 'tyv', 'evn', 'mdf', 'myv', 'koi', 'kv', 'chm'
        ]
        if value.lower() not in valid_languages:
            raise serializers.ValidationError(
                f"Недопустимый код языка: {value}. Допустимые значения: {', '.join(valid_languages)}"
            )
        return value.lower()


class SendEmailSerializer(serializers.Serializer):
    email_account_id = serializers.IntegerField(required=True, error_messages={
        'required': 'Поле email_account_id обязательно.'
    })
    recipient = serializers.EmailField(required=True, error_messages={
        'required': 'Поле recipient обязательно.',
        'invalid': 'Введите корректный email адрес.'
    })
    subject = serializers.CharField(max_length=255, required=True, allow_blank=True)
    body = serializers.CharField(required=True, allow_blank=True)
    attachments = serializers.ListField(
        child=serializers.FileField(),
        required=False,
        allow_empty=True
    )

    def validate_attachments(self, value):
        max_file_size = 10 * 1024 * 1024  # 10MB
        for file in value:
            if file.size > max_file_size:
                raise serializers.ValidationError(f"Файл {file.name} превышает лимит в 10MB.")
        total_size = sum(file.size for file in value)
        max_total_size = 25 * 1024 * 1024  # 25MB
        if total_size > max_total_size:
            raise serializers.ValidationError("Общий размер вложений превышает лимит в 25MB.")
        return value


class UserSettingsSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())

    class Meta:
        model = User_Settings
        fields = ['settings_id', 'user', 'language', 'theme']

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
    user_id = serializers.IntegerField()

    class Meta:
        model = User
        fields = ['user_id', 'username', 'date_of_birth', 'country', 'phone_number', 'audit_logs', 'account_type',
                  'email_accounts', 'folders']

    def get_folders(self, obj):
        email_accounts = UserEmailAccount.objects.filter(user=obj)
        folders = MailFolder.objects.filter(email_account__in=email_accounts)
        return MailFolderSerializer(folders, many=True).data
