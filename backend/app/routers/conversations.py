from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.conversation import Conversation
from app.models.message import Message
from app.models.user import User
from app.schemas import ConversationDetailOut, ConversationOut, ManualMessageIn, MessageOut, TakeoverUpdate

router = APIRouter(prefix="/conversations", tags=["conversations"])


class BulkDeleteConversationsOut(BaseModel):
    deleted_conversations: int


@router.delete("/all", response_model=BulkDeleteConversationsOut)
def delete_all_org_conversations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkDeleteConversationsOut:
    org_id = current_user.organization_id
    n = (
        db.query(Conversation)
        .filter(Conversation.organization_id == org_id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return BulkDeleteConversationsOut(deleted_conversations=int(n))


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _org_conversation(db: Session, org_id: UUID, convo_id: UUID) -> Conversation | None:
    return (
        db.query(Conversation)
        .filter(Conversation.id == convo_id, Conversation.organization_id == org_id)
        .first()
    )


def _last_preview(db: Session, convo_id: UUID) -> str | None:
    last = (
        db.query(Message)
        .filter(Message.conversation_id == convo_id)
        .order_by(desc(Message.created_at))
        .first()
    )
    if not last:
        return None
    return last.content[:80] + "…" if len(last.content) > 80 else last.content


def _to_conversation_out(c: Conversation, preview: str | None) -> ConversationOut:
    return ConversationOut(
        id=c.id,
        platform=c.platform,
        customer_name=c.customer_name,
        customer_platform_id=c.customer_platform_id,
        status=c.status,
        sentiment=c.sentiment,
        is_human_takeover=c.is_human_takeover,
        created_at=c.created_at,
        updated_at=c.updated_at,
        last_message_preview=preview,
    )


@router.get("", response_model=list[ConversationOut])
def list_conversations(
    status: str | None = None,
    platform: str | None = None,
    q: str | None = Query(None, description="Search customer name or message content (case-insensitive)"),
    updated_from: datetime | None = Query(None),
    updated_to: datetime | None = Query(None),
    offset: int = Query(0, ge=0, le=100_000),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ConversationOut]:
    query = db.query(Conversation).filter(Conversation.organization_id == current_user.organization_id)
    if status:
        query = query.filter(Conversation.status == status)
    if platform:
        query = query.filter(Conversation.platform == platform)
    if updated_from is not None:
        query = query.filter(Conversation.updated_at >= updated_from)
    if updated_to is not None:
        query = query.filter(Conversation.updated_at <= updated_to)
    if q and q.strip():
        pattern = f"%{_escape_like(q.strip())}%"
        query = query.filter(
            or_(
                Conversation.customer_name.ilike(pattern, escape="\\"),
                Conversation.id.in_(
                    db.query(Message.conversation_id)
                    .filter(Message.content.ilike(pattern, escape="\\"))
                    .distinct()
                ),
            )
        )
    rows = query.order_by(desc(Conversation.updated_at)).offset(offset).limit(limit).all()
    return [_to_conversation_out(c, _last_preview(db, c.id)) for c in rows]


@router.get("/{convo_id}", response_model=ConversationDetailOut)
def get_conversation(
    convo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationDetailOut:
    c = _org_conversation(db, current_user.organization_id, convo_id)
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = db.query(Message).filter(Message.conversation_id == c.id).order_by(Message.created_at.asc()).all()
    last = msgs[-1] if msgs else None
    preview = (last.content[:80] + "…") if last and len(last.content) > 80 else (last.content if last else None)
    return ConversationDetailOut(
        id=c.id,
        platform=c.platform,
        customer_name=c.customer_name,
        status=c.status,
        sentiment=c.sentiment,
        is_human_takeover=c.is_human_takeover,
        created_at=c.created_at,
        updated_at=c.updated_at,
        last_message_preview=preview,
        messages=[MessageOut.model_validate(m) for m in msgs],
    )


@router.patch("/{convo_id}/takeover", response_model=ConversationOut)
def set_takeover(
    convo_id: UUID,
    body: TakeoverUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationOut:
    c = _org_conversation(db, current_user.organization_id, convo_id)
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
    c.is_human_takeover = body.is_human_takeover
    db.add(c)
    db.commit()
    db.refresh(c)
    return _to_conversation_out(c, _last_preview(db, c.id))


@router.post("/{convo_id}/ignore", response_model=ConversationOut)
def ignore_conversation(
    convo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationOut:
    c = _org_conversation(db, current_user.organization_id, convo_id)
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
    c.status = "ignored"
    db.add(c)
    db.commit()
    db.refresh(c)
    return _to_conversation_out(c, _last_preview(db, c.id))


@router.post("/{convo_id}/reopen", response_model=ConversationOut)
def reopen_conversation(
    convo_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ConversationOut:
    c = _org_conversation(db, current_user.organization_id, convo_id)
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
    c.status = "pending"
    db.add(c)
    db.commit()
    db.refresh(c)
    return _to_conversation_out(c, _last_preview(db, c.id))


@router.post("/{convo_id}/messages", response_model=MessageOut)
def post_manual_message(
    convo_id: UUID,
    body: ManualMessageIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    c = _org_conversation(db, current_user.organization_id, convo_id)
    if not c:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msg = Message(
        conversation_id=c.id,
        direction="outbound",
        content=body.content,
        ai_generated=False,
        ai_model=None,
    )
    db.add(msg)
    c.status = "answered"
    db.add(c)
    db.commit()
    db.refresh(msg)
    return MessageOut.model_validate(msg)
