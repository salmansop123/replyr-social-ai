"""Post AI-generated replies to social platforms (Meta / TikTok)."""

from sqlalchemy.orm import Session

from app.models.conversation import Conversation


async def post_reply_to_platform(convo: Conversation, reply_text: str, db: Session) -> None:
    """Send outbound message via platform API. Stub until OAuth + Graph API wiring."""
    _ = (convo, reply_text, db)
    # TODO: decrypt social account token, call Meta / TikTok send message APIs
