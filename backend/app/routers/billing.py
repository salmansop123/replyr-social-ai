from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/create-checkout")
def create_checkout(
    current_user: User = Depends(get_current_user),
) -> dict:
    _ = current_user
    return {"checkout_url": None, "message": "Stripe checkout not configured"}
