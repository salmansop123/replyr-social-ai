from app.workers.celery_app import celery


@celery.task(name="app.workers.beat_schedule.whatsapp_poll_tick")
def whatsapp_poll_tick() -> None:
    """Placeholder: poll WhatsApp Cloud API every minute (implement Meta calls here)."""
    return None
