from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


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
    subscription_tier: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OrganizationUpdate(BaseModel):
    name: str | None = None
    ai_system_prompt: str | None = None
    ai_tone: str | None = None
    ai_language: str | None = None
    reply_delay_min: int | None = Field(None, ge=5, le=600)
    reply_delay_max: int | None = Field(None, ge=5, le=600)


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
    status: str
    sentiment: str | None
    is_human_takeover: bool
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
