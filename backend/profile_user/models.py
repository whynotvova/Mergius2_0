from django.db import models

class AccountTypes(models.Model):
    account_type_id = models.AutoField(primary_key=True)
    type_name = models.CharField(max_length=50)

    def __str__(self):
        return self.type_name

    class Meta:
        db_table = 'AccountTypes'
        managed = True