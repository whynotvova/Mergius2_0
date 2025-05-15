import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mergius.settings')

app = Celery('mergius')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

app.conf.beat_schedule = {
    'fetch-all-emails-every-30-seconds': {
        'task': 'mail.celery_tasks.fetch_emails_periodically',
        'schedule': 30.0,
    },
}