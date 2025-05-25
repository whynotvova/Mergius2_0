"""
Django settings for mergius project.
"""

from pathlib import Path
import os
import logging

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).resolve().parent.parent

STATIC_URL = '/static/'
STATICFILES_DIRS = [BASE_DIR / 'static']
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

SECRET_KEY = os.getenv('SECRET_KEY', 'django-insecure-k%l(hgmy_w%ti5-qdoqk@c%7w@0d&9)ch0xja)v-be!wb@mj*^')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,backend,mergius.ru').split(',')
CSRF_TRUSTED_ORIGINS = os.getenv('CSRF_TRUSTED_ORIGINS', 'https://mergius.ru,https://www.mergius.ru,http://mergius.ru').split(',')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework.authtoken',
    'social_django',
    'corsheaders',
    'django_celery_beat',
    'Auth.apps.AuthConfig',
    'profile_user.apps.ProfileUserConfig',
    'mail.apps.MailConfig',
    'landing.apps.LandingConfig',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'mergius.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'social_django.context_processors.backends',
                'social_django.context_processors.login_redirect',
            ],
        },
    },
]

WSGI_APPLICATION = 'mergius.wsgi.application'
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('MYSQL_DATABASE'),
        'USER': os.getenv('MYSQL_USER'),
        'PASSWORD': os.getenv('MYSQL_PASSWORD'),
        'HOST': os.getenv('MYSQL_HOST'),
        'PORT': os.getenv('MYSQL_PORT'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'; SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED",
            'charset': 'utf8mb4',
        },
    }
}
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

AUTH_USER_MODEL = 'Auth.CustomUser'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
AUTHENTICATION_BACKENDS = (
    'Auth.backends.CustomAuthBackend',
    'social_core.backends.google.GoogleOAuth2',
    'social_core.backends.yandex.YandexOAuth2',
    'social_core.backends.mailru.MailruOAuth2',
    'social_core.backends.apple.AppleIdAuth',
    'social_core.backends.yahoo.YahooOAuth2',
    'social_core.backends.vk.VKOAuth2',
    'social_core.backends.facebook.FacebookOAuth2',
)

CORS_ALLOWED_ORIGINS = os.getenv('CORS_ALLOWED_ORIGINS', 'https://mergius.ru,https://www.mergius.ru').split(',')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

SOCIAL_AUTH_PIPELINE = (
    'social_core.pipeline.social_auth.social_details',
    'social_core.pipeline.social_auth.social_uid',
    'social_core.pipeline.social_auth.auth_allowed',
    'social_core.pipeline.social_auth.social_user',
    'social_core.pipeline.user.get_username',
    'Auth.pipeline.create_user',
    'social_core.pipeline.social_auth.associate_user',
    'social_core.pipeline.social_auth.load_extra_data',
    'social_core.pipeline.user.user_details',
    'Auth.pipeline.save_token',
)
SMSC_LOGIN = os.getenv('SMSC_LOGIN')
SMSC_PASSWORD = os.getenv('SMSC_PASSWORD')
YANDEX_GPT_API_KEY = os.getenv('YANDEX_GPT_API_KEY')
YANDEX_TRANSLATE_API_KEY = os.getenv('YANDEX_TRANSLATE_API_KEY')
YANDEX_CLOUD_FOLDER_ID = os.getenv('YANDEX_CLOUD_FOLDER_ID')
GOOGLE_OAUTH_CREDENTIALS = {
    'client_id': os.getenv('GOOGLE_OAUTH_CLIENT_ID'),
    'client_secret': os.getenv('GOOGLE_OAUTH_CLIENT_SECRET'),
    'redirect_uri': os.getenv('GOOGLE_OAUTH_REDIRECT_URI', 'https://mergius.ru/oauth2callback'),
}
SOCIAL_AUTH_VK_OAUTH2_KEY = os.getenv('VK_CLIENT_ID')
SOCIAL_AUTH_VK_OAUTH2_SECRET = os.getenv('VK_CLIENT_SECRET')
SOCIAL_AUTH_VK_OAUTH2_REDIRECT_URI = os.getenv('VK_REDIRECT_URI', 'https://mergius.ru/vk/callback/')
SOCIAL_AUTH_VK_OAUTH2_SCOPE = ['phone', 'first_name']
SOCIAL_AUTH_VK_OAUTH2_AUTH_EXTRA_ARGUMENTS = {'v': '5.199'}
CSRF_COOKIE_SECURE = os.getenv('CSRF_COOKIE_SECURE', 'True') == 'True'
SESSION_COOKIE_SECURE = os.getenv('SESSION_COOKIE_SECURE', 'True') == 'True'
SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True') == 'True'

# Log VK OAuth settings for debugging
logger.debug(f"VK_CLIENT_ID: {SOCIAL_AUTH_VK_OAUTH2_KEY}")
logger.debug(f"VK_REDIRECT_URI: {SOCIAL_AUTH_VK_OAUTH2_REDIRECT_URI}")

# Celery settings
CELERY_IMPORTS = (
    'mail.tasks',
    'mail.celery_tasks',
)
CELERY_BROKER_URL = 'redis://redis:6379/0'
CELERY_RESULT_BACKEND = 'redis://redis:6379/0'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_WORKER_CONCURRENCY = os.getenv('CELERY_WORKER_CONCURRENCY', 4)
CELERYD_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_TRACK_STARTED = True

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'debug.log',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        '': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': True,
        },
        'celery': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'celery.task': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}