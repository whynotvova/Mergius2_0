from django.urls import path, include
from .views import PhoneAuthView, OTPView, ProfileView, PhoneUpdateView, CheckUsernameView, VKCallbackView, GetCSRFTokenView

urlpatterns = [
    path('phone/', PhoneAuthView.as_view(), name='phone_auth'),
    path('otp/', OTPView.as_view(), name='otp'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('phone/update/', PhoneUpdateView.as_view(), name='phone_update'),
    path('username/check/', CheckUsernameView.as_view(), name='check_username'),
    path('auth/', include('social_django.urls', namespace='social')),
    path('vk/callback/', VKCallbackView.as_view(), name='vk_callback'),
    path('get-csrf-token/', GetCSRFTokenView.as_view(), name='get_csrf_token'),
]