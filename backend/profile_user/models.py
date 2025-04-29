from django.db import models

class EmailService(models.Model):
    service_id = models.AutoField(primary_key=True)
    service_name = models.CharField(max_length=100, unique=True)
    imap_server = models.CharField(max_length=255)
    smtp_server = models.CharField(max_length=255)
    imap_port = models.IntegerField()
    smtp_port = models.IntegerField()

    def __str__(self):
        return self.service_name

    class Meta:
        db_table = 'Email_Services'
        managed = True

class UserEmailAccount(models.Model):
    email_account_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Auth.CustomUser', on_delete=models.CASCADE, related_name='email_accounts', to_field='user_id')
    service = models.ForeignKey(EmailService, on_delete=models.CASCADE)
    email_address = models.EmailField(unique=True)
    oauth_token = models.CharField(max_length=255, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email_address

    class Meta:
        db_table = 'User_Email_Accounts'
        managed = True

class MailFolder(models.Model):
    folder_id = models.AutoField(primary_key=True)
    email_account = models.ForeignKey(UserEmailAccount, on_delete=models.CASCADE, related_name='folders')
    folder_name = models.CharField(max_length=100)
    sort_order = models.IntegerField(default=0)
    folder_icon = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.folder_name

    class Meta:
        db_table = 'Mail_Folders'
        managed = True

class AuditLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Auth.CustomUser', on_delete=models.CASCADE, related_name='audit_logs', to_field='user_id')
    action = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)  # Added IP address field

    def __str__(self):
        return f"{self.action} by {self.user} at {self.timestamp}"

    class Meta:
        db_table = 'Audit_Logs'
        managed = True

class User_Settings(models.Model):
    setting_id = models.AutoField(primary_key=True)
    user = models.OneToOneField('Auth.CustomUser', on_delete=models.CASCADE, related_name='settings', to_field='user_id')
    language = models.CharField(max_length=10, default='ru')
    theme = models.CharField(max_length=50, default='default')

    def __str__(self):
        return f"Settings for {self.user}"

    class Meta:
        db_table = 'User_Settings'
        managed = True