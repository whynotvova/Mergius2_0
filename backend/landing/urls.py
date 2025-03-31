from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login_view, name='auth'),
    path('register/', views.register_view, name='register'),
    path('confirm-auth/', views.confirm_auth, name='confirm_auth'),
    path('confirm-reg/', views.confirm_reg, name='confirm_reg'),
    path('register-final/', views.register_final_view, name='register_final'),
    path('mail/', views.mail_view, name='mail'),
    path('', views.home_view, name='home'),
]