from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.static import serve
from Auth.views import GetCSRFTokenView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

class HealthCheckView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({'status': 'OK'}, status=status.HTTP_200_OK)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('Auth.urls')),
    path('api/profile/', include('profile_user.urls')),
    path('api/mail/', include('mail.urls')),
    path('api/', include('landing.urls')),
    path('auth/', include('social_django.urls', namespace='social')),
    path('api/get-csrf-token/', GetCSRFTokenView.as_view(), name='get_csrf_token'),
    path('health/', HealthCheckView.as_view(), name='health_check'),
    re_path(r'^.*$', serve, {'document_root': settings.STATICFILES_DIRS[0], 'path': 'index.html'}),
] + static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])