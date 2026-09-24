import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.organization import Organization
from app.models.user import User
from app.services.auth_tokens import create_access_token
from app.services.passwords import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s or "org"


class SignUpIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str | None = Field(None, max_length=255)
    business_name: str | None = Field(None, max_length=255)


class SignInIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class AuthTokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    organization_id: str
    email: str | None
    name: str | None


class UserOut(BaseModel):
    id: str
    email: str | None
    name: str | None
    role: str
    organization_id: str

    model_config = {"from_attributes": True}


def _auth_response(user: User) -> AuthTokenOut:
    token = create_access_token(str(user.id))
    return AuthTokenOut(
        access_token=token,
        user_id=str(user.id),
        organization_id=str(user.organization_id),
        email=user.email,
        name=user.name,
    )


def _create_org_with_slug(db: Session, name: str) -> Organization:
    slug_base = _slugify(name)[:40]
    slug = slug_base
    n = 0
    while db.query(Organization).filter(Organization.slug == slug).first():
        n += 1
        slug = f"{slug_base}-{n}"
    org = Organization(
        name=name,
        slug=slug,
        escalation_keywords=[],
    )
    db.add(org)
    db.flush()
    return org


@router.post("/sign-up", response_model=AuthTokenOut)
def sign_up(body: SignUpIn, db: Session = Depends(get_db)) -> AuthTokenOut:
    email = body.email.strip().lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=409, detail="An account with this email already exists")

    display_name = (body.name or email.split("@")[0]).strip()
    org_name = (body.business_name or display_name or "My business").strip()
    org = _create_org_with_slug(db, org_name)

    user = User(
        organization_id=org.id,
        email=email,
        name=body.name or display_name,
        password_hash=hash_password(body.password),
        role="owner",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _auth_response(user)


@router.post("/sign-in", response_model=AuthTokenOut)
def sign_in(body: SignInIn, db: Session = Depends(get_db)) -> AuthTokenOut:
    email = body.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return _auth_response(user)


@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)) -> UserOut:
    return UserOut(
        id=str(current_user.id),
        email=current_user.email,
        name=current_user.name,
        role=current_user.role,
        organization_id=str(current_user.organization_id),
    )
