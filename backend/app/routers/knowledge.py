"""AI Training — upload and manage business knowledge documents."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas import KnowledgeSourceListOut, KnowledgeSourceOut
from app.services.document_parser import DocumentParseError, detect_file_type
from app.services.knowledge_service import delete_source, get_source, list_sources, save_upload
from app.workers.knowledge_tasks import enqueue_process_knowledge_source

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

ALLOWED_EXTENSIONS = {".pdf", ".xlsx", ".xls", ".csv"}


def _to_out(source) -> KnowledgeSourceOut:
    return KnowledgeSourceOut.model_validate(source)


@router.get("/sources", response_model=KnowledgeSourceListOut)
def list_knowledge_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> KnowledgeSourceListOut:
    items = list_sources(db, current_user.organization_id)
    ready = sum(1 for s in items if s.status == "ready")
    return KnowledgeSourceListOut(
        items=[_to_out(s) for s in items],
        ready_count=ready,
        total_count=len(items),
    )


@router.post("/sources/upload", response_model=KnowledgeSourceOut, status_code=201)
async def upload_knowledge_source(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> KnowledgeSourceOut:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    ext = "." + file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Supported formats: PDF, Excel (.xlsx), and CSV",
        )

    try:
        detect_file_type(file.filename)
    except DocumentParseError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        source = save_upload(db, current_user.organization_id, file.filename, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    enqueue_process_knowledge_source(str(source.id))
    db.refresh(source)
    return _to_out(source)


@router.delete("/sources/{source_id}", status_code=204)
def remove_knowledge_source(
    source_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    source = get_source(db, current_user.organization_id, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Knowledge source not found")
    delete_source(db, source)


@router.post("/sources/{source_id}/retrain", response_model=KnowledgeSourceOut)
def retrain_knowledge_source(
    source_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> KnowledgeSourceOut:
    source = get_source(db, current_user.organization_id, source_id)
    if not source:
        raise HTTPException(status_code=404, detail="Knowledge source not found")

    source.status = "pending"
    source.error_message = None
    db.add(source)
    db.commit()
    db.refresh(source)

    enqueue_process_knowledge_source(str(source.id))
    return _to_out(source)
