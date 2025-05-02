from django.contrib import admin
from .models import AuditLog, EmailService, UserEmailAccount, UserFolder, MailFolder, User_Settings

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user', 'action', 'timestamp', 'ip_address')
    list_filter = ('action', 'timestamp')
    search_fields = ('action', 'details')

@admin.register(EmailService)
class EmailServiceAdmin(admin.ModelAdmin):
    list_display = ('service_name', 'imap_server', 'smtp_server')
    search_fields = ('service_name',)

@admin.register(UserEmailAccount)
class UserEmailAccountAdmin(admin.ModelAdmin):
    list_display = ('email_address', 'user', 'service', 'created_at')
    list_filter = ('service',)
    search_fields = ('email_address',)

@admin.register(UserFolder)
class UserFolderAdmin(admin.ModelAdmin):
    list_display = ('folder_name', 'user', 'sort_order')
    list_filter = ('user',)
    search_fields = ('folder_name',)

@admin.register(MailFolder)
class MailFolderAdmin(admin.ModelAdmin):
    list_display = ('folder_name', 'email_account', 'sort_order')
    list_filter = ('email_account',)
    search_fields = ('folder_name',)

@admin.register(User_Settings)
class UserSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'language', 'theme')
    list_filter = ('language', 'theme')
    search_fields = ('user__username',)