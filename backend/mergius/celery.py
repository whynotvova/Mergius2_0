import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mergius.settings')

app = Celery('mergius')

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

app.conf.beat_schedule = {
    'fetch-all-emails-every-30-seconds': {
        'task': 'mail.tasks.fetch_all_emails_task',
        'schedule': 30.0,
    },
}