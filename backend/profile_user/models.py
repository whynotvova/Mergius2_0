from django.db import models

class AccountTypes(models.Model):
    account_type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.type_name

    class Meta:
        db_table = 'AccountTypes'
        managed = True

class AuditLog(models.Model):
    log_id = models.AutoField(primary_key=True)
    user = models.ForeignKey('Auth.CustomUser', on_delete=models.CASCADE, related_name='audit_logs_set')
    action = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.action} by {self.user} at {self.timestamp}"

    class Meta:
        db_table = 'Audit_Logs'
        managed = True