from __future__ import annotations

import logging
import uuid
from datetime import datetime, timedelta, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import settings
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
from app.services.meta_facebook_oauth import (
    FACEBOOK_PAGE_SCOPES,
    build_facebook_authorization_url,
    exchange_code_for_user_token,
    exchange_long_lived_user_token,
    facebook_oauth_redirect_uri,
    list_managed_pages,
    sign_oauth_state,
    subscribe_page_webhooks,
    verify_oauth_state,
)

logger = logging.getLogger(__name__)

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


class ConnectPlatformOut(BaseModel):
    oauth_url: str | None = None
    message: str | None = None


class FacebookSetupOut(BaseModel):
    meta_app_configured: bool
    oauth_redirect_uri: str
    webhook_callback_url_hint: str
    webhook_verify_token_set: bool
    page_scopes: list[str]
    app_review_note: str


@router.get("/facebook/setup", response_model=FacebookSetupOut)
def facebook_setup_info(
    current_user: User = Depends(get_current_user),
) -> FacebookSetupOut:
    """Local dev + Meta console checklist for Facebook Pages (Phase 3)."""
    redirect = facebook_oauth_redirect_uri()
    webhook_hint = f"{(settings.webhook_base_url or 'https://YOUR-PUBLIC-URL').rstrip('/')}/webhooks/meta"
    return FacebookSetupOut(
        meta_app_configured=bool(settings.meta_app_id and settings.meta_app_secret),
        oauth_redirect_uri=redirect,
        webhook_callback_url_hint=webhook_hint,
        webhook_verify_token_set=bool(settings.meta_verify_token),
        page_scopes=list(FACEBOOK_PAGE_SCOPES),
        app_review_note=(
            "For pages outside your Meta app roles, submit App Review for "
            "pages_messaging and pages_manage_posts. Until approved, use test pages only (beta)."
        ),
    )


@router.get("/connect/{platform}", response_model=ConnectPlatformOut)
def connect_platform(
    platform: str,
    current_user: User = Depends(get_current_user),
) -> ConnectPlatformOut:
    if platform not in ("whatsapp", "facebook"):
        raise HTTPException(
            status_code=400,
            detail="Only WhatsApp and Facebook are supported at this time.",
        )
    if platform == "whatsapp":
        return ConnectPlatformOut(
            oauth_url=None,
            message="Use POST /social/connect/whatsapp with phone_number_id, display_name, and access_token for manual testing.",
        )
    if not settings.meta_app_id or not settings.meta_app_secret:
        return ConnectPlatformOut(
            oauth_url=None,
            message="Set META_APP_ID and META_APP_SECRET on the API to enable Facebook OAuth.",
        )
    state = sign_oauth_state(current_user.organization_id, current_user.id)
    try:
        url = build_facebook_authorization_url(state)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    return ConnectPlatformOut(oauth_url=url)


@router.get("/callback/facebook")
async def facebook_oauth_callback(
    code: str | None = Query(None),
    state: str | None = Query(None),
    error: str | None = Query(None),
    error_description: str | None = Query(None),
    db: Session = Depends(get_db),
) -> RedirectResponse:
    """OAuth redirect from Meta — exchanges code and saves Page tokens."""
    frontend = settings.frontend_url.rstrip("/")
    fail_url = f"{frontend}/dashboard/accounts?facebook=error"
    ok_url = f"{frontend}/dashboard/accounts?facebook=connected"

    if error:
        logger.warning("Facebook OAuth error: %s %s", error, error_description)
        return RedirectResponse(f"{fail_url}&reason={error}")

    if not code or not state:
        return RedirectResponse(f"{fail_url}&reason=missing_code")

    try:
        org_id, _user_id = verify_oauth_state(state)
    except ValueError as e:
        logger.warning("Facebook OAuth state invalid: %s", e)
        return RedirectResponse(f"{fail_url}&reason=invalid_state")

    try:
        short_token = await exchange_code_for_user_token(code)
        long_token, user_expires = await exchange_long_lived_user_token(short_token)
        pages = await list_managed_pages(long_token)
    except ValueError as e:
        logger.exception("Facebook OAuth token exchange failed")
        return RedirectResponse(f"{fail_url}&reason=exchange_failed")

    if not pages:
        return RedirectResponse(f"{fail_url}&reason=no_pages")

    token_expires = user_expires or (datetime.now(timezone.utc) + timedelta(days=60))
    saved = 0
    for page in pages:
        page_id = str(page.get("id") or "")
        page_token = str(page.get("access_token") or "")
        page_name = page.get("name")
        if not page_id or not page_token:
            continue

        existing = (
            db.query(SocialAccount)
            .filter(
                SocialAccount.organization_id == org_id,
                SocialAccount.platform == "facebook",
                SocialAccount.platform_user_id == page_id,
            )
            .first()
        )
        encrypted = encrypt_token(page_token)
        if existing:
            existing.access_token = encrypted
            existing.display_name = page_name
            existing.is_active = True
            existing.token_expires_at = token_expires
            account = existing
        else:
            account = SocialAccount(
                organization_id=org_id,
                platform="facebook",
                platform_user_id=page_id,
                display_name=page_name,
                access_token=encrypted,
                is_active=True,
                token_expires_at=token_expires,
            )
            db.add(account)
            db.flush()

        ok, err = await subscribe_page_webhooks(page_id, page_token)
        if not ok:
            logger.warning("Page %s subscribed_apps failed: %s", page_id, err)
        saved += 1

    if saved == 0:
        return RedirectResponse(f"{fail_url}&reason=no_tokens")

    db.commit()
    return RedirectResponse(ok_url)
