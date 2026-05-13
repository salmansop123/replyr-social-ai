from fastapi import APIRouter, Depends

from app.schemas import ContactIn

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("")
def contact_form(body: ContactIn) -> dict:
    _ = body
    return {"ok": True, "message": "Contact email delivery not configured (set RESEND_API_KEY)."}
