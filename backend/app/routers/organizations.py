import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.organization import Organization
from app.models.user import User
from app.schemas import OrganizationOut, OrganizationUpdate

router = APIRouter(prefix="/org", tags=["organizations"])

_TIME_RE = re.compile(r"^([01]\d|2[0-3]):([0-5]\d)$")


def _validate_time(label: str, value: str | None) -> None:
    if value is None:
        return
    if not _TIME_RE.match(value.strip()):
        raise HTTPException(status_code=400, detail=f"{label} must be HH:MM (24h), e.g. 09:00")


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

    if "business_hours_start" in data:
        _validate_time("business_hours_start", data.get("business_hours_start"))
    if "business_hours_end" in data:
        _validate_time("business_hours_end", data.get("business_hours_end"))

    if "reply_delay_min" in data or "reply_delay_max" in data:
        new_min = data.get("reply_delay_min", org.reply_delay_min)
        new_max = data.get("reply_delay_max", org.reply_delay_max)
        if new_min > new_max:
            new_min, new_max = new_max, new_min
        data["reply_delay_min"] = new_min
        data["reply_delay_max"] = new_max

    for k, v in data.items():
        setattr(org, k, v)

    db.add(org)
    db.commit()
    db.refresh(org)
    return org
