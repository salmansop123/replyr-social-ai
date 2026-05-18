from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator


class UserSyncIn(BaseModel):
    clerk_user_id: str
    clerk_org_id: str | None = None
    email: str | None = None
    name: str | None = None


class OrganizationOut(BaseModel):
    id: UUID
    name: str
    slug: str | None
    ai_system_prompt: str | None
    ai_tone: str
    ai_language: str
    reply_delay_min: int
    reply_delay_max: int
    auto_reply_enabled: bool
    escalation_keywords: list[str]
    business_hours_enabled: bool
    business_hours_start: str
    business_hours_end: str
    business_hours_timezone: str
    outside_hours_message: str | None
    subscription_tier: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrganizationUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    ai_system_prompt: str | None = Field(None, max_length=2000)
    ai_tone: str | None = None
    ai_language: str | None = Field(None, max_length=32)
    reply_delay_min: int | None = Field(None, ge=10, le=300)
    reply_delay_max: int | None = Field(None, ge=10, le=300)
    auto_reply_enabled: bool | None = None
    escalation_keywords: list[str] | None = None
    business_hours_enabled: bool | None = None
    business_hours_start: str | None = Field(None, max_length=8)
    business_hours_end: str | None = Field(None, max_length=8)
    business_hours_timezone: str | None = Field(None, max_length=64)
    outside_hours_message: str | None = Field(None, max_length=2000)

    model_config = {"extra": "forbid"}

    @field_validator("escalation_keywords")
    @classmethod
    def limit_keywords(cls, v: list[str] | None) -> list[str] | None:
        if v is None:
            return v
        if len(v) > 20:
            raise ValueError("escalation_keywords must have at most 20 items")
        cleaned: list[str] = []
        seen: set[str] = set()
        for item in v:
            s = str(item).strip().lower()
            if not s or s in seen:
                continue
            if len(s) > 80:
                raise ValueError("each escalation keyword must be 80 characters or less")
            seen.add(s)
            cleaned.append(s)
        return cleaned

    @field_validator("ai_tone")
    @classmethod
    def tone_allowed(cls, v: str | None) -> str | None:
        if v is None:
            return v
        allowed = frozenset({"friendly", "professional", "casual", "formal"})
        if v not in allowed:
            raise ValueError("ai_tone must be one of: friendly, professional, casual, formal")
        return v


class MessageOut(BaseModel):
    id: UUID
    direction: str
    content: str
    ai_generated: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ConversationOut(BaseModel):
    id: UUID
    platform: str
    customer_name: str | None
    customer_platform_id: str | None = None
    status: str
    sentiment: str | None
    is_human_takeover: bool
    facebook_thread_type: str | None = None
    post_context: str | None = None
    facebook_post_id: str | None = None
    created_at: datetime
    updated_at: datetime
    last_message_preview: str | None = None

    model_config = {"from_attributes": True}


class ConversationDetailOut(ConversationOut):
    messages: list[MessageOut] = []


class TakeoverUpdate(BaseModel):
    is_human_takeover: bool


class ContactIn(BaseModel):
    name: str
    email: str
    company: str | None = None
    message: str


class ManualMessageIn(BaseModel):
    content: str = Field(..., min_length=1, max_length=8000)


class SocialAccountOut(BaseModel):
    id: UUID
    platform: str
    platform_user_id: str
    display_name: str | None
    is_active: bool
    token_expires_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class WhatsAppManualConnectIn(BaseModel):
    phone_number_id: str = Field(..., min_length=1, max_length=64)
    display_name: str = Field(..., min_length=1, max_length=255)
    access_token: str = Field(..., min_length=1)


class SocialAccountListItemOut(BaseModel):
    """Public list shape — never includes tokens."""

    id: UUID
    platform: str
    platform_user_id: str
    display_name: str | None
    is_active: bool
    token_expires_at: datetime | None = None
    last_webhook_received_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeSourceOut(BaseModel):
    id: UUID
    filename: str
    file_type: str
    status: str
    error_message: str | None
    file_size_bytes: int
    char_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class KnowledgeSourceListOut(BaseModel):
    items: list[KnowledgeSourceOut]
    ready_count: int
    total_count: int


class SocialAccountCreatedOut(BaseModel):
    """After manual connect — token never returned."""

    id: UUID
    platform: str
    platform_user_id: str
    display_name: str | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
