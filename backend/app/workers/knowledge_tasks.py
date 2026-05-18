"""Celery tasks for parsing uploaded knowledge documents."""

from __future__ import annotations

import uuid

from app.database import SessionLocal
from app.models.knowledge_source import KnowledgeSource
from app.services.knowledge_service import process_source
from app.workers.celery_app import celery


def enqueue_process_knowledge_source(source_id: str) -> None:
    """Queue Celery job; run synchronously if broker unavailable (local dev)."""
    try:
        process_knowledge_source.delay(source_id)
    except Exception:
        process_knowledge_source.run(source_id)


@celery.task(bind=True, max_retries=2, default_retry_delay=30)
def process_knowledge_source(self, source_id: str) -> None:
    db = SessionLocal()
    try:
        try:
            sid = uuid.UUID(source_id)
        except ValueError:
            return

        source = db.query(KnowledgeSource).filter(KnowledgeSource.id == sid).first()
        if not source:
            return

        process_source(db, source)
    except Exception as exc:
        db.rollback()
        raise self.retry(exc=exc) from exc
    finally:
        db.close()
