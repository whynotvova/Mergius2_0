from django.urls import path
from .views import PhoneAuthView, OTPView, SocialAuthView, ProfileView, PhoneUpdateView, CheckUsernameView

urlpatterns = [
    path('phone/', PhoneAuthView.as_view(), name='phone_auth'),
    path('otp/', OTPView.as_view(), name='otp'),
    path('social/<str:backend>/', SocialAuthView.as_view(), name='social_auth'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('phone/update/', PhoneUpdateView.as_view(), name='phone_update'),
    path('username/check/', CheckUsernameView.as_view(), name='check_username'),
]