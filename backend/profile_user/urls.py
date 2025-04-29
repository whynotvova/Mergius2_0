from django.urls import path
from .views import UserProfileView, MailFolderView, UserSettingsView

urlpatterns = [
    path('', UserProfileView.as_view(), name='user_profile'),
    path('folders/', MailFolderView.as_view(), name='mail_folders'),
    path('folders/<int:folder_id>/', MailFolderView.as_view(), name='mail_folder_detail'),
    path('profile/settings/', UserSettingsView.as_view(), name='user_settings'),
]