from django.urls import path
from . import views

urlpatterns = [
    path('phone/', views.PhoneAuthView.as_view(), name='phone_auth'),
    path('phone-update/', views.PhoneUpdateView.as_view(), name='phone_update'),
    path('otp/', views.OTPView.as_view(), name='otp'),
    path('social/<str:backend>/', views.SocialAuthView.as_view(), name='social_auth'),
    path('profile/', views.ProfileView.as_view(), name='profile'),
    path('check-username/', views.CheckUsernameView.as_view(), name='check_username'),
]