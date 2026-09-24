import logging
import uuid
from typing import Annotated

import jwt
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth_tokens import decode_access_token

logger = logging.getLogger(__name__)


def _extract_bearer_token(authorization: str | None) -> str:
    if not authorization:
        logger.warning("Auth rejected: missing Authorization header")
        raise HTTPException(status_code=401, detail="Missing bearer token")
    if not authorization.startswith("Bearer "):
        logger.warning("Auth rejected: Authorization header is not Bearer scheme")
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization[7:].strip()
    if not token:
        logger.warning("Auth rejected: empty bearer token")
        raise HTTPException(status_code=401, detail="Missing bearer token")
    return token


def get_current_user(
    authorization: Annotated[str | None, Header(alias="Authorization")] = None,
    db: Session = Depends(get_db),
) -> User:
    token = _extract_bearer_token(authorization)
    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError as e:
        logger.warning("JWT verification failed: %s", e)
        raise HTTPException(status_code=401, detail="Invalid or expired token") from e

    sub = payload.get("sub")
    if not sub or not isinstance(sub, str):
        logger.warning("Auth rejected: JWT missing sub claim")
        raise HTTPException(status_code=401, detail="Invalid token")

    try:
        user_id = uuid.UUID(sub)
    except ValueError as e:
        raise HTTPException(status_code=401, detail="Invalid token") from e

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.warning("Auth rejected: no user row for id=%s", user_id)
        raise HTTPException(status_code=404, detail="User not found")
    return user
