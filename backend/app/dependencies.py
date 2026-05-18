import logging
from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException
from jwt import PyJWKClient
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.dev_auth import dev_auth_allowed, get_or_create_dev_user, is_dev_bearer

logger = logging.getLogger(__name__)

_jwk_client: PyJWKClient | None = None


def _jwks_client() -> PyJWKClient:
    global _jwk_client
    if _jwk_client is None:
        if not settings.clerk_domain:
            logger.error("CLERK_DOMAIN is not set — cannot verify JWTs")
            raise HTTPException(status_code=503, detail="Authentication is not configured on the API")
        jwks_url = f"https://{settings.clerk_domain}/.well-known/jwks.json"
        _jwk_client = PyJWKClient(jwks_url, cache_keys=True)
    return _jwk_client


def _decode_bearer_token(token: str) -> dict:
    try:
        signing_key = _jwks_client().get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as e:
        logger.warning("JWT verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Invalid token") from e


def get_current_user(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    db: Session = Depends(get_db),
) -> User:
    if not authorization:
        logger.warning("Auth rejected: missing Authorization header (client may need /auth/bootstrap first)")
        raise HTTPException(status_code=401, detail="Missing bearer token")
    if not authorization.startswith("Bearer "):
        logger.warning("Auth rejected: Authorization header is not Bearer scheme")
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization[7:].strip()
    if not token:
        logger.warning("Auth rejected: empty bearer token")
        raise HTTPException(status_code=401, detail="Missing bearer token")

    if is_dev_bearer(token):
        if not dev_auth_allowed():
            raise HTTPException(status_code=401, detail="Development auth is disabled")
        return get_or_create_dev_user(db)

    payload = _decode_bearer_token(token)
    clerk_user_id = payload.get("sub")
    if not clerk_user_id:
        logger.warning("Auth rejected: JWT missing sub claim")
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.clerk_user_id == clerk_user_id).first()
    if not user:
        logger.warning(
            "Auth rejected: no user row for clerk_user_id=%s (run POST /auth/bootstrap)",
            clerk_user_id,
        )
        raise HTTPException(status_code=404, detail="User not found — complete session bootstrap")
    return user


def get_clerk_jwt_payload(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
) -> dict:
    """Decode Clerk session JWT without requiring a row in `users` (used for /auth/bootstrap)."""
    if not authorization or not authorization.startswith("Bearer "):
        logger.warning("Bootstrap auth rejected: missing or invalid Authorization header")
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")
    payload = _decode_bearer_token(token)
    if not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return payload
