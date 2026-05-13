import base64
import hashlib

from cryptography.fernet import Fernet

from app.config import settings


def _fernet() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.encryption_key.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_token(plain: str) -> str:
    if not plain:
        return plain
    return _fernet().encrypt(plain.encode("utf-8")).decode("utf-8")


def decrypt_token(token: str) -> str:
    if not token:
        return token
    return _fernet().decrypt(token.encode("utf-8")).decode("utf-8")
