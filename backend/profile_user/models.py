from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.contrib.auth import get_user_model

User = get_user_model()


class EmailService(models.Model):
    service_id = models.AutoField(primary_key=True)
    service_name = models.CharField(max_length=50, unique=True)
    service_icon = models.CharField(max_length=255)
    imap_server = models.CharField(max_length=100, null=True, blank=True)
    imap_port = models.IntegerField(null=True, blank=True)
    smtp_server = models.CharField(max_length=100, null=True, blank=True)
    smtp_port = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.service_name

    class Meta:
        db_table = 'Email_Services'
        managed = True


class UserEmailAccount(models.Model):
    email_account_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_accounts', to_field='user_id')
    service = models.ForeignKey(EmailService, on_delete=models.CASCADE)
    email_address = models.EmailField(unique=True)
    oauth_token = models.CharField(max_length=255, null=True, blank=True)
    password = models.CharField(max_length=255, null=True, blank=True)
    avatar = models.CharField(max_length=255, null=True, blank=True, default='/images/mail/default-avatar.png')
    created_at = models.DateTimeField(auto_now_add=True)
    last_fetched = models.DateTimeField(null=True, blank=True)
    last_fetched_uid = models.BigIntegerField(default=0, null=True, blank=True)

    def set_password(self, raw_password):
        self.password = raw_password

    def __str__(self):
        return self.email_address

    class Meta:
        db_table = 'User_Email_Accounts'
        managed = True


class UserFolder(models.Model):
    folder_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='folders', to_field='user_id')
    folder_name = models.CharField(max_length=100)
    folder_icon = models.CharField(max_length=255, null=True, blank=True)
    sort_order = models.IntegerField(default=0)

    def __str__(self):
        return self.folder_name

    class Meta:
        db_table = 'User_Folders'
        managed = True


class MailFolder(models.Model):
    folder_id = models.AutoField(primary_key=True)
    email_account = models.ForeignKey(UserEmailAccount, on_delete=models.CASCADE, related_name='folders')
    folder_name = models.CharField(max_length=255)
    sort_order = models.IntegerField(default=0)
    folder_icon = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.folder_name

    class Meta:
        db_table = 'mail_folders'
        managed = True


class User_Settings(models.Model):
    settings_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings', to_field='user_id')
    language = models.CharField(max_length=10, default='ru')
    theme = models.CharField(max_length=50, default='light')

    def __str__(self):
        return f"Settings for {self.user.username}"

    class Meta:
        db_table = 'User_Settings'
        managed = True


class AuditLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='audit_logs', to_field='user_id')
    action = models.CharField(max_length=255)
    details = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.action} by {self.user.username} at {self.timestamp}"

    class Meta:
        db_table = 'Audit_Logs'
        managed = True


class Emails(models.Model):
    email_id = models.AutoField(primary_key=True)
    email_account = models.ForeignKey(UserEmailAccount, on_delete=models.CASCADE, related_name='emails')
    message_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    imap_id = models.CharField(max_length=255, null=True, blank=True)
    sender = models.CharField(max_length=255)
    subject = models.CharField(max_length=255, null=True, blank=True)
    body = models.TextField(null=True, blank=True)
    sent_date = models.DateTimeField(null=True, blank=True)
    received_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default='unread')

    class Meta:
        db_table = 'Emails'
        managed = True
        constraints = [
            models.UniqueConstraint(fields=['email_account', 'message_id'], name='unique_email_account_message_id')
        ]

    def __str__(self):
        return f"Email {self.subject} from {self.sender}"


class Email_Recipients(models.Model):
    recipient_id = models.AutoField(primary_key=True)
    email = models.ForeignKey(Emails, on_delete=models.CASCADE, related_name='recipients')
    recipient_address = models.EmailField()
    recipient_type = models.CharField(max_length=10, choices=[('TO', 'To'), ('CC', 'Cc'), ('BCC', 'Bcc')])

    def __str__(self):
        return f"{self.recipient_type}: {self.recipient_address}"

    class Meta:
        db_table = 'Email_Recipients'
        managed = True


class EmailFolderAssignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    email = models.ForeignKey(Emails, on_delete=models.CASCADE, related_name='folder_assignments')
    folder = models.ForeignKey(MailFolder, on_delete=models.CASCADE, related_name='email_assignments')

    class Meta:
        db_table = 'Email_Folder_Assignments'
        managed = True
        unique_together = ('email', 'folder')

    def __str__(self):
        return f"Email {self.email.subject} in folder {self.folder.folder_name}"


class EmailAttachment(models.Model):
    attachment_id = models.AutoField(primary_key=True)
    email = models.ForeignKey(Emails, on_delete=models.CASCADE, related_name='attachments')
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.file_name} ({self.file_size} bytes) for {self.email.subject}"

    class Meta:
        db_table = 'Email_Attachments'
        managed = True
