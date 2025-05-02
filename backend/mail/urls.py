from django.urls import path
from .views import AddEmailAccountView, EmailServiceView

urlpatterns = [
    path('email-accounts/add/', AddEmailAccountView.as_view(), name='add-email-account'),
    path('email-services/', EmailServiceView.as_view(), name='email-services'),
]