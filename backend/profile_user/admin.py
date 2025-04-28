from django.contrib import admin
from Auth.models import AccountTypes
from .models import AuditLog, EmailService, UserEmailAccount, MailFolder


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


@admin.register(EmailService)
class EmailServiceAdmin(admin.ModelAdmin):
    list_display = ('service_id', 'service_name', 'imap_server', 'smtp_server')
    search_fields = ('service_name',)


@admin.register(UserEmailAccount)
class UserEmailAccountAdmin(admin.ModelAdmin):
    list_display = ('email_account_id', 'user', 'email_address', 'service', 'created_at')
    search_fields = ('email_address',)
    raw_id_fields = ('user', 'service')


@admin.register(MailFolder)
class MailFolderAdmin(admin.ModelAdmin):
    list_display = ('folder_id', 'email_account', 'folder_name', 'sort_order')
    search_fields = ('folder_name',)
    raw_id_fields = ('email_account',)
