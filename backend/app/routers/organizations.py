from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.organization import Organization
from app.models.user import User
from app.schemas import OrganizationOut, OrganizationUpdate

router = APIRouter(prefix="/org", tags=["organizations"])

_ALLOWED_TONES = frozenset({"friendly", "professional", "casual"})


@router.get("/me", response_model=OrganizationOut)
def get_my_org(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Organization:
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org


@router.patch("/me", response_model=OrganizationOut)
def update_my_org(
    body: OrganizationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Organization:
    org = db.query(Organization).filter(Organization.id == current_user.organization_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    data = body.model_dump(exclude_unset=True)
    if "ai_tone" in data and data["ai_tone"] is not None and data["ai_tone"] not in _ALLOWED_TONES:
        raise HTTPException(
            status_code=400,
            detail="ai_tone must be one of: friendly, professional, casual",
        )
    new_min = data.get("reply_delay_min", org.reply_delay_min)
    new_max = data.get("reply_delay_max", org.reply_delay_max)
    if new_min > new_max:
        raise HTTPException(
            status_code=400,
            detail="reply_delay_min must be less than or equal to reply_delay_max",
        )
    for k, v in data.items():
        setattr(org, k, v)
    db.add(org)
    db.commit()
    db.refresh(org)
    return org
