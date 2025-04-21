"""
Django settings for mergius project.
"""

from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

STATIC_URL = '/static/'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]
STATIC_ROOT = BASE_DIR / 'staticfiles'

SECRET_KEY = 'django-insecure-k%l(hgmy_w%ti5-qdoqk@c%7w@0d&9)ch0xja)v-be!wb@mj*^'
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

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
    'Auth',
    'mail',
    'landing',
    'profile_user',
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
        'NAME': 'mergius',
        'USER': 'root',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '3306',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
}

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = False

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

CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
]

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

SOCIAL_AUTH_GOOGLE_OAUTH2_KEY = '305891857057-edl6smf463r24s9c1ec358nsvf2i0k79.apps.googleusercontent.com'
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET = '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'
SOCIAL_AUTH_YANDEX_OAUTH2_KEY = '44396cc4dfe94deabbb7f0292b8f156d'
SOCIAL_AUTH_YANDEX_OAUTH2_SECRET = '2b5342870386496fa71106dd1f9b9226'
SOCIAL_AUTH_MAILRU_OAUTH2_KEY = 'e42f6a45b608469a8baa432e4b96f803'
SOCIAL_AUTH_MAILRU_OAUTH2_SECRET = '4c9a0aceb1e84c0a99320a897b5d02fb'
SOCIAL_AUTH_APPLE_ID_CLIENT = 'your-apple-client-id'
SOCIAL_AUTH_APPLE_ID_KEY = 'your-apple-key'
SOCIAL_AUTH_YAHOO_OAUTH2_KEY = 'dj0yJmk9WkVoZ0JBa0V1UXVvJmQ9WVdrOWEzUkRXWE5EUlZVbWNHbzlNQT09JnM9Y29uc3VtZXJzZWNyZXQmc3Y9MCZ4PTI1'
SOCIAL_AUTH_YAHOO_OAUTH2_SECRET = '308c60ddb789fdb87f57c4aefd7409333c2580e4'
SOCIAL_AUTH_VK_OAUTH2_KEY = 'your-vk-client-id'
SOCIAL_AUTH_VK_OAUTH2_SECRET = 'your-vk-client-secret'
SOCIAL_AUTH_FACEBOOK_KEY = 'your-facebook-client-id'
SOCIAL_AUTH_FACEBOOK_SECRET = 'your-facebook-client-secret'

SOCIAL_AUTH_LOGIN_REDIRECT_URL = 'http://localhost:3000/auth/callback'
SOCIAL_AUTH_REDIRECT_IS_HTTPS = False

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

TWILIO_ACCOUNT_SID = 'ACf4a6f0e46efabcb6f55405d95835e32e'
TWILIO_AUTH_TOKEN = 'ca138f067d3536189653b11a40149c97'
TWILIO_PHONE_NUMBER = '+79508425370'

CSRF_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = False
SECURE_SSL_REDIRECT = False

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
    },
}