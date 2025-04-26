from django.contrib import admin
from .models import AccountTypes, AuditLog

@admin.register(AccountTypes)
class AccountTypesAdmin(admin.ModelAdmin):
    list_display = ('account_type_id', 'type_name')
    search_fields = ('type_name',)

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('log_id', 'user', 'action', 'timestamp', 'details')
    list_filter = ('action', 'timestamp')
    search_fields = ('action', 'details')
    raw_id_fields = ('user',)