from celery import Celery
from celery.schedules import crontab

from app.config import settings

celery = Celery(
    "replyr",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.ai_tasks", "app.workers.webhook_tasks", "app.workers.beat_schedule"],
)

celery.conf.beat_schedule = {
    "whatsapp-poll-placeholder": {
        "task": "app.workers.beat_schedule.whatsapp_poll_tick",
        "schedule": crontab(minute="*"),
    },
}

celery.conf.timezone = "UTC"
