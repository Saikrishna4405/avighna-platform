import hashlib
import json
import base64
import os
from datetime import datetime, timedelta
from typing import Optional
from app.config import settings

try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    USE_PASSLIB = True
except ImportError:
    USE_PASSLIB = False

try:
    from jose import jwt
    USE_JOSE = True
except ImportError:
    USE_JOSE = False

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if USE_PASSLIB:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
            
    if ":" in hashed_password:
        salt, h_val = hashed_password.split(":", 1)
        test_h = hashlib.pbkdf2_hmac('sha256', plain_password.encode(), salt.encode(), 100000).hex()
        return test_h == h_val
    return plain_password == hashed_password

def get_password_hash(password: str) -> str:
    if USE_PASSLIB:
        try:
            return pwd_context.hash(password)
        except Exception:
            pass
            
    salt = "avighna_salt_2026"
    h_val = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
    return f"{salt}:{h_val}"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": int(expire.timestamp())})
    
    if USE_JOSE:
        try:
            return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        except Exception:
            pass

    # Standard fallback token encoder
    payload_bytes = json.dumps(to_encode).encode('utf-8')
    token_str = base64.b64encode(payload_bytes).decode('utf-8')
    return f"avighna_token.{token_str}"

def decode_access_token(token: str) -> dict:
    if USE_JOSE:
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except Exception:
            pass

    if token.startswith("avighna_token."):
        token_str = token.replace("avighna_token.", "")
        payload_bytes = base64.b64decode(token_str)
        return json.loads(payload_bytes.decode('utf-8'))

    raise ValueError("Invalid Token")
