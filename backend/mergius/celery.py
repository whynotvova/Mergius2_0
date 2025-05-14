import os
from celery import Celery
from celery.schedules import crontab

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mergius.settings')

app = Celery('mergius')

# Load configuration from Django settings
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# Celery Beat schedule
app.conf.beat_schedule = {
    'fetch-all-emails-every-30-seconds': {
        'task': 'mail.tasks.fetch_all_emails_task',
        'schedule': 30.0,  # Every 30 seconds
    },
}