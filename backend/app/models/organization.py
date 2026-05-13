from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    clerk_org_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    ai_system_prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_tone: Mapped[str] = mapped_column(String(32), default="friendly")
    ai_language: Mapped[str] = mapped_column(String(16), default="en")
    reply_delay_min: Mapped[int] = mapped_column(Integer, default=30)
    reply_delay_max: Mapped[int] = mapped_column(Integer, default=90)
    subscription_tier: Mapped[str] = mapped_column(String(32), default="starter")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    users: Mapped[list["User"]] = relationship(back_populates="organization")
    social_accounts: Mapped[list["SocialAccount"]] = relationship(back_populates="organization")
    conversations: Mapped[list["Conversation"]] = relationship(back_populates="organization")
    leads: Mapped[list["Lead"]] = relationship(back_populates="organization")
    subscription: Mapped["Subscription | None"] = relationship(back_populates="organization", uselist=False)
