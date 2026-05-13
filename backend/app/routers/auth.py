import re

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_clerk_jwt_payload
from app.models.organization import Organization
from app.models.user import User
from app.schemas import UserSyncIn

router = APIRouter(prefix="/auth", tags=["auth"])


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "org"


def apply_user_sync(db: Session, body: UserSyncIn) -> dict:
    """Create or update organization + user from Clerk identifiers."""
    org: Organization | None = None
    if body.clerk_org_id:
        org = db.query(Organization).filter(Organization.clerk_org_id == body.clerk_org_id).first()
    if not org:
        base_name = (body.name or body.email or "My business").split("@")[0]
        slug_base = _slugify(base_name)[:40]
        slug = slug_base
        n = 0
        while db.query(Organization).filter(Organization.slug == slug).first():
            n += 1
            slug = f"{slug_base}-{n}"
        org = Organization(
            clerk_org_id=body.clerk_org_id,
            name=body.name or body.email or "My business",
            slug=slug,
        )
        db.add(org)
        db.flush()

    user = db.query(User).filter(User.clerk_user_id == body.clerk_user_id).first()
    if user:
        user.email = body.email
        user.name = body.name
        user.organization_id = org.id
        db.commit()
        return {"ok": True, "created": False, "user_id": str(user.id), "organization_id": str(org.id)}

    user = User(
        clerk_user_id=body.clerk_user_id,
        organization_id=org.id,
        email=body.email,
        name=body.name,
        role="owner",
    )
    db.add(user)
    db.commit()
    return {"ok": True, "created": True, "user_id": str(user.id), "organization_id": str(org.id)}


def _claims_to_user_sync(payload: dict) -> UserSyncIn:
    sub = payload.get("sub")
    if not sub or not isinstance(sub, str):
        raise HTTPException(status_code=401, detail="Invalid token")
    email = payload.get("email")
    if email is not None and not isinstance(email, str):
        email = None
    name = payload.get("name")
    if not name or not isinstance(name, str):
        gn = str(payload.get("given_name") or "")
        fn = str(payload.get("family_name") or "")
        name = (gn + " " + fn).strip() or None
    org_id = payload.get("org_id") or payload.get("o") or payload.get("organization_id")
    if org_id is not None and not isinstance(org_id, str):
        org_id = str(org_id)
    return UserSyncIn(clerk_user_id=sub, clerk_org_id=org_id, email=email, name=name)


@router.post("/sync-user")
def sync_user(body: UserSyncIn, db: Session = Depends(get_db)) -> dict:
    """Create organization + user from Clerk (called from Next.js webhook)."""
    return apply_user_sync(db, body)


@router.post("/bootstrap")
def bootstrap_from_session(
    payload: dict = Depends(get_clerk_jwt_payload),
    db: Session = Depends(get_db),
) -> dict:
    """Provision the current Clerk user in Postgres on first dashboard visit (no webhook required)."""
    sub = payload.get("sub")
    if not sub or not isinstance(sub, str):
        raise HTTPException(status_code=401, detail="Invalid token")
    existing = db.query(User).filter(User.clerk_user_id == sub).first()
    if existing:
        return {"ok": True, "created": False, "user_id": str(existing.id), "organization_id": str(existing.organization_id)}
    body = _claims_to_user_sync(payload)
    return apply_user_sync(db, body)
