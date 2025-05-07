from django.urls import path
from .views import AddEmailAccountView, EmailServiceView, FetchEmailView, EmailAccountListView, EmailDetailView, EmailFolderAssignmentView, \
    DeleteEmailAccountView, AssignCategoriesView, FolderCreateView, FolderDeleteView, TranslateEmailView, SendEmailView

urlpatterns = [
    path('email-accounts/add/', AddEmailAccountView.as_view(), name='add-email-account'),
    path('email-services/', EmailServiceView.as_view(), name='email-services'),
    path('fetch/', FetchEmailView.as_view(), name='fetch-emails'),
    path('email-accounts/', EmailAccountListView.as_view(), name='email-accounts'),
    path('emails/<int:email_id>/', EmailDetailView.as_view(), name='email-detail'),
    path('emails/assign-folder/', EmailFolderAssignmentView.as_view(), name='assign-folder'),
    path('emails/assign-categories/', AssignCategoriesView.as_view(), name='assign-categories'),
    path('email-accounts/<int:email_account_id>/', DeleteEmailAccountView.as_view(), name='delete-email-account'),
    path('folders/', FolderCreateView.as_view(), name='create-folder'),
    path('folders/<int:folder_id>/', FolderDeleteView.as_view(), name='delete-folder'),
    path('translate/', TranslateEmailView.as_view(), name='translate-email'),
    path('send/', SendEmailView.as_view(), name='send-email'),
]