from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from django.views.static import serve

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('landing.urls')),
    re_path(r'^.*$', serve, {'document_root': settings.STATICFILES_DIRS[0], 'path': 'index.html'}),
] + static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
