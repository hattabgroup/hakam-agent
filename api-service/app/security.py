import os
import base64
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from cryptography.fernet import Fernet
from sqlalchemy.orm import Session
from . import database, models

# Configuration (must match Auth Service)
SECRET_KEY = os.getenv("JWT_SECRET", "supersecretkeyForPhase2DevelopmentOnly")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
TOKEN_ENCRYPTION_KEY = os.getenv("TOKEN_ENCRYPTION_KEY")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8001/auth/token")

# Encryption Helper
def get_fernet():
    if not TOKEN_ENCRYPTION_KEY:
        raise ValueError("TOKEN_ENCRYPTION_KEY env var not set")
    try:
        # Check if it's base64 encoded, Fernet needs 32 url-safe base64-encoded bytes
        # If user provides raw 32 bytes base64 encoded:
        return Fernet(TOKEN_ENCRYPTION_KEY)
    except Exception as e:
        print(f"Error initializing Fernet: {e}")
        raise e

def encrypt_token(token: str) -> str:
    f = get_fernet()
    return f.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token: str) -> str:
    f = get_fernet()
    return f.decrypt(encrypted_token.encode()).decode()

# Auth Dependency
def get_current_user_id(token: str = Depends(oauth2_scheme)) -> str:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return user_id, payload.get("email")
    except JWTError:
        raise credentials_exception

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)) -> models.UserLocal:
    auth_user_id, email = get_current_user_id(token)
    
    # Check if user exists in local DB
    user = db.query(models.UserLocal).filter(models.UserLocal.auth_user_id == auth_user_id).first()
    if not user:
        # Auto-create user in API DB on first access (sync from Auth)
        user = models.UserLocal(auth_user_id=auth_user_id, email=email)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user
