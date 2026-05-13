import hashlib
import hmac
import json

from fastapi import APIRouter, BackgroundTasks, HTTPException, Request

from app.config import settings
from app.workers.webhook_tasks import process_meta_event

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.get("/meta")
async def verify_meta_webhook(hub_mode: str, hub_challenge: str, hub_verify_token: str):
    if hub_verify_token != settings.meta_verify_token:
        raise HTTPException(status_code=403, detail="Invalid verify token")
    try:
        return int(hub_challenge)
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="Invalid challenge") from None


@router.post("/meta")
async def receive_meta_event(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    sig_header = request.headers.get("X-Hub-Signature-256", "")
    if settings.meta_app_secret:
        expected = "sha256=" + hmac.new(
            settings.meta_app_secret.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()
        if len(sig_header) != len(expected) or not hmac.compare_digest(sig_header, expected):
            raise HTTPException(status_code=403, detail="Invalid signature")
    try:
        payload = json.loads(body.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        payload = {}
    background_tasks.add_task(process_meta_event, payload)
    return {"status": "ok"}
