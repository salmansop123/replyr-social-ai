import jwt
from fastapi import Depends, Header, HTTPException
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User

_jwk_client: PyJWKClient | None = None


def _jwks_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        jwks_url = f"https://{settings.clerk_domain}/.well-known/jwks.json"
        _jwk_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwk_client


def get_current_user(
    authorization: str = Header(..., description="Bearer <Clerk JWT>"),
    db: Session = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization[7:].strip()
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        clerk_user_id = payload.get("sub")
        if not clerk_user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


def get_clerk_jwt_payload(
    authorization: str = Header(..., description="Bearer <Clerk JWT>"),
) -> dict:
    """Decode Clerk session JWT without requiring a rows in `users` (used for /auth/bootstrap)."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization[7:].strip()
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
        if not payload.get("sub"):
            raise HTTPException(status_code=401, detail="Invalid token")
        return payload
    except jwt.PyJWTError as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e
