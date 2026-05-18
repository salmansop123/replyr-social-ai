"""Business knowledge sources: upload, parse, and context for AI replies."""

from __future__ import annotations

import uuid
from pathlib import Path

from sqlalchemy.orm import Session

from app.config import settings
from app.models.knowledge_source import KnowledgeSource
from app.services.document_parser import DocumentParseError, detect_file_type, parse_document

# Cap injected knowledge per org (chars) — expandable to RAG later
MAX_KNOWLEDGE_CONTEXT_CHARS = 12_000
MAX_EXTRACTED_CHARS_PER_SOURCE = 50_000


def knowledge_storage_root() -> Path:
    root = Path(settings.knowledge_storage_dir)
    root.mkdir(parents=True, exist_ok=True)
    return root


def org_storage_dir(organization_id: uuid.UUID) -> Path:
    d = knowledge_storage_root() / str(organization_id)
    d.mkdir(parents=True, exist_ok=True)
    return d


def list_sources(db: Session, organization_id: uuid.UUID) -> list[KnowledgeSource]:
    return (
        db.query(KnowledgeSource)
        .filter(KnowledgeSource.organization_id == organization_id)
        .order_by(KnowledgeSource.created_at.desc())
        .all()
    )


def get_source(db: Session, organization_id: uuid.UUID, source_id: uuid.UUID) -> KnowledgeSource | None:
    return (
        db.query(KnowledgeSource)
        .filter(
            KnowledgeSource.id == source_id,
            KnowledgeSource.organization_id == organization_id,
        )
        .first()
    )


def save_upload(
    db: Session,
    organization_id: uuid.UUID,
    filename: str,
    file_bytes: bytes,
) -> KnowledgeSource:
    if len(file_bytes) > settings.knowledge_max_upload_bytes:
        raise ValueError(f"File exceeds maximum size of {settings.knowledge_max_upload_mb} MB")

    file_type = detect_file_type(filename)
    source_id = uuid.uuid4()
    safe_name = Path(filename).name
    dest_dir = org_storage_dir(organization_id)
    dest_path = dest_dir / f"{source_id}_{safe_name}"

    dest_path.write_bytes(file_bytes)

    source = KnowledgeSource(
        id=source_id,
        organization_id=organization_id,
        filename=safe_name,
        file_type=file_type,
        storage_path=str(dest_path),
        status="pending",
        file_size_bytes=len(file_bytes),
    )
    db.add(source)
    db.commit()
    db.refresh(source)
    return source


def process_source(db: Session, source: KnowledgeSource) -> KnowledgeSource:
    """Parse file and store extracted text. Called from Celery or sync fallback."""
    source.status = "processing"
    source.error_message = None
    db.add(source)
    db.commit()

    try:
        path = Path(source.storage_path)
        if not path.is_file():
            raise DocumentParseError("Stored file not found on disk")

        text = parse_document(path, source.file_type)
        if len(text) > MAX_EXTRACTED_CHARS_PER_SOURCE:
            text = text[:MAX_EXTRACTED_CHARS_PER_SOURCE] + "\n\n[Content truncated for storage]"

        source.extracted_text = text
        source.char_count = len(text)
        source.status = "ready"
        source.error_message = None
    except Exception as e:
        source.status = "failed"
        source.error_message = str(e)[:2000]
        source.extracted_text = None
        source.char_count = 0

    db.add(source)
    db.commit()
    db.refresh(source)
    return source


def delete_source(db: Session, source: KnowledgeSource) -> None:
    path = Path(source.storage_path)
    if path.is_file():
        try:
            path.unlink()
        except OSError:
            pass
    db.delete(source)
    db.commit()


def get_knowledge_context(db: Session, organization_id: uuid.UUID) -> str:
    """Concatenate ready sources into a prompt block for the AI agent."""
    sources = (
        db.query(KnowledgeSource)
        .filter(
            KnowledgeSource.organization_id == organization_id,
            KnowledgeSource.status == "ready",
            KnowledgeSource.extracted_text.isnot(None),
        )
        .order_by(KnowledgeSource.updated_at.desc())
        .all()
    )
    if not sources:
        return ""

    parts: list[str] = []
    total = 0
    for src in sources:
        header = f"### {src.filename}\n"
        body = (src.extracted_text or "").strip()
        if not body:
            continue
        chunk = header + body
        if total + len(chunk) > MAX_KNOWLEDGE_CONTEXT_CHARS:
            remaining = MAX_KNOWLEDGE_CONTEXT_CHARS - total
            if remaining > 200:
                parts.append(chunk[:remaining] + "\n[Additional documents omitted]")
            break
        parts.append(chunk)
        total += len(chunk)

    if not parts:
        return ""
    return "Business knowledge from uploaded documents:\n\n" + "\n\n".join(parts)
