from fastapi import APIRouter, Depends, HTTPException

from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.social_account import SocialAccount
from app.models.user import User
from app.schemas import SocialAccountOut

router = APIRouter(prefix="/social", tags=["social"])


@router.get("/accounts", response_model=list[SocialAccountOut])
def list_social_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[SocialAccount]:
    return (
        db.query(SocialAccount)
        .filter(SocialAccount.organization_id == current_user.organization_id)
        .order_by(SocialAccount.created_at.desc())
        .all()
    )


@router.get("/connect/{platform}")
def connect_platform(
    platform: str,
    current_user: User = Depends(get_current_user),
) -> dict:
    _ = current_user
    if platform != "whatsapp":
        raise HTTPException(
            status_code=400,
            detail="Only WhatsApp is supported at this time.",
        )
    return {
        "oauth_url": None,
        "message": "WhatsApp Business Cloud OAuth is not wired yet — configure Meta app and Redis state store.",
    }
