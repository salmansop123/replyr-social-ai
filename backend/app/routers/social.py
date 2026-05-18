from __future__ import annotations

import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.social_account import SocialAccount
from app.models.user import User
from app.schemas import (
    SocialAccountCreatedOut,
    SocialAccountListItemOut,
    WhatsAppManualConnectIn,
)
from app.services.encryption import encrypt_token

router = APIRouter(prefix="/social", tags=["social"])


class BulkDisconnectAccountsOut(BaseModel):
    disconnected: int

META_GRAPH = "https://graph.facebook.com/v18.0"


async def _verify_whatsapp_credentials(phone_number_id: str, access_token: str) -> bool:
    url = f"{META_GRAPH}/{phone_number_id}"
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.get(
            url,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        return r.status_code == 200


async def _subscribe_whatsapp_webhook(phone_number_id: str, access_token: str) -> tuple[bool, str]:
    """POST subscribed_apps — register app to receive WABA webhooks."""
    url = f"{META_GRAPH}/{phone_number_id}/subscribed_apps"
    async with httpx.AsyncClient(timeout=20.0) as client:
        r = await client.post(
            url,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            json={},
        )
        if r.status_code == 200:
            return True, ""
        return False, r.text[:500]


@router.post(
    "/connect/whatsapp",
    response_model=SocialAccountCreatedOut,
    status_code=201,
)
async def connect_whatsapp_manual(
    body: WhatsAppManualConnectIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SocialAccount:
    phone_number_id = body.phone_number_id.strip()
    display_name = body.display_name.strip()
    access_token = body.access_token.strip()

    if not await _verify_whatsapp_credentials(phone_number_id, access_token):
        raise HTTPException(
            status_code=400,
            detail="Invalid token or phone number ID",
        )

    existing = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.organization_id == current_user.organization_id,
            SocialAccount.platform == "whatsapp",
            SocialAccount.platform_user_id == phone_number_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="This WhatsApp number is already connected to your organization")

    encrypted = encrypt_token(access_token)
    account = SocialAccount(
        organization_id=current_user.organization_id,
        platform="whatsapp",
        platform_user_id=phone_number_id,
        display_name=display_name,
        access_token=encrypted,
        is_active=True,
    )
    db.add(account)
    db.flush()

    ok, err_body = await _subscribe_whatsapp_webhook(phone_number_id, access_token)
    if not ok:
        db.rollback()
        raise HTTPException(
            status_code=502,
            detail=f"Connected in DB but Meta subscribed_apps failed: {err_body}",
        )

    db.commit()
    db.refresh(account)
    return account


@router.get("/accounts", response_model=list[SocialAccountListItemOut])
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


@router.delete("/accounts/all", response_model=BulkDisconnectAccountsOut)
def disconnect_all_social_accounts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BulkDisconnectAccountsOut:
    q = db.query(SocialAccount).filter(SocialAccount.organization_id == current_user.organization_id)
    n = 0
    for acc in q.all():
        acc.is_active = False
        n += 1
    db.commit()
    return BulkDisconnectAccountsOut(disconnected=n)


@router.delete("/accounts/{account_id}", status_code=204)
def delete_social_account(
    account_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Response:
    account = (
        db.query(SocialAccount)
        .filter(
            SocialAccount.id == account_id,
            SocialAccount.organization_id == current_user.organization_id,
        )
        .first()
    )
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    account.is_active = False
    db.commit()
    return Response(status_code=204)


@router.get("/connect/{platform}")
def connect_platform(
    platform: str,
    current_user: User = Depends(get_current_user),
) -> dict:
    _ = current_user
    if platform not in ("whatsapp", "facebook"):
        raise HTTPException(
            status_code=400,
            detail="Only WhatsApp and Facebook are supported at this time.",
        )
    if platform == "whatsapp":
        return {
            "oauth_url": None,
            "message": "Use POST /social/connect/whatsapp with phone_number_id, display_name, and access_token for manual testing.",
        }
    return {
        "oauth_url": None,
        "message": "Facebook Pages OAuth opens here once META_APP_ID, META_APP_SECRET, and META_OAUTH_REDIRECT_URI are configured on the API.",
    }
