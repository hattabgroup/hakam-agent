import os
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
import secrets
from . import models, schemas, security, database
from .services import email as email_service, recaptcha

router = APIRouter(prefix="/auth", tags=["auth"])

EMAIL_VERIFICATION_REQUIRED = os.getenv("EMAIL_VERIFICATION_REQUIRED", "false").lower() in ("true", "1", "yes")

@router.post("/signup", response_model=schemas.UserResponse)
async def signup(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    # Verify reCAPTCHA
    await recaptcha.verify_recaptcha(user.recaptcha_token)
    
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = security.get_password_hash(user.password)
    verification_token = secrets.token_urlsafe(32) if EMAIL_VERIFICATION_REQUIRED else None
    
    new_user = models.User(
        email=user.email, 
        hashed_password=hashed_password,
        is_verified=not EMAIL_VERIFICATION_REQUIRED,
        verification_token=verification_token,
        last_verification_sent_at=datetime.now(timezone.utc) if EMAIL_VERIFICATION_REQUIRED else None
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    if EMAIL_VERIFICATION_REQUIRED and verification_token:
        # Send verification email in background
        background_tasks.add_task(email_service.send_verification_email, new_user.email, verification_token)
        new_user.requires_verification = True
        new_user.access_token = None
    else:
        new_user.requires_verification = False
        new_user.access_token = security.create_access_token(data={"sub": str(new_user.id), "email": new_user.email})
    
    return new_user

@router.post("/login", response_model=schemas.Token)
async def login(user_credentials: schemas.UserLogin, db: Session = Depends(database.get_db)):
    # Verify reCAPTCHA
    await recaptcha.verify_recaptcha(user_credentials.recaptcha_token)
    
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    if not security.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if EMAIL_VERIFICATION_REQUIRED and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Account not verified. Please check your email."
        )
    
    access_token = security.create_access_token(data={"sub": str(user.id), "email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

from fastapi.security import OAuth2PasswordRequestForm
@router.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    
    if not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if EMAIL_VERIFICATION_REQUIRED and not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Account not verified. Please check your email."
        )
    
    access_token = security.create_access_token(data={"sub": str(user.id), "email": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/verify")
def verify_email(token: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")
    
    if user.is_verified:
        return {"message": "Email already verified"}

    user.is_verified = True
    user.verification_token = None
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.post("/resend-verification")
def resend_verification(
    user_credentials: schemas.UserLogin, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.email == user_credentials.email).first()
    # Security: Don't reveal if user exists or not, but for UX we might need to handle this.
    # To prevent enumeration, we can return generic message, but we need to validate password first if we found user.
    
    if not user:
         # returning success to prevent enumeration
        return {"message": "If an account exists, a verification email has been sent."}

    if not security.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid email or password")

    if user.is_verified:
        return {"message": "Account already verified"}

    # Rate limiting (60 seconds)
    if user.last_verification_sent_at:
        # Ensure UTC comparison
        last_sent = user.last_verification_sent_at
        if last_sent.tzinfo is None:
            last_sent = last_sent.replace(tzinfo=timezone.utc)
            
        now = datetime.now(timezone.utc)
        if (now - last_sent) < timedelta(seconds=60):
            raise HTTPException(status_code=429, detail="Please wait before sending another verification email.")

    # Generate new token
    verification_token = secrets.token_urlsafe(32)
    user.verification_token = verification_token
    user.last_verification_sent_at = datetime.now(timezone.utc)
    db.commit()

    background_tasks.add_task(email_service.send_verification_email, user.email, verification_token)
    
    return {"message": "Verification email sent."}

@router.post("/forgot-password")
async def forgot_password(
    request: schemas.ForgotPasswordRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
    # Verify reCAPTCHA
    await recaptcha.verify_recaptcha(request.recaptcha_token)
    
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    # Security: Always return success to prevent email enumeration
    if not user:
        return {"message": "If an account exists with this email, you will receive a password reset link shortly."}
    
    # Generate reset token
    reset_token = secrets.token_urlsafe(32)
    user.reset_password_token = reset_token
    user.reset_password_expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()
    
    # Send email in background
    background_tasks.add_task(email_service.send_password_reset_email, user.email, reset_token)
    
    return {"message": "If an account exists with this email, you will receive a password reset link shortly."}

@router.get("/verify-reset-token")
def verify_reset_token(token: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.reset_password_token == token).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check expiration
    expires_at = user.reset_password_expires_at
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            
        if datetime.now(timezone.utc) > expires_at:
            user.reset_password_token = None
            user.reset_password_expires_at = None
            db.commit()
            raise HTTPException(status_code=400, detail="Reset token has expired")
    
    return {"valid": True}

@router.post("/reset-password")
async def reset_password(
    request: schemas.ResetPasswordRequest,
    db: Session = Depends(database.get_db)
):
    # Verify reCAPTCHA
    await recaptcha.verify_recaptcha(request.recaptcha_token)
    
    user = db.query(models.User).filter(models.User.reset_password_token == request.token).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check expiration
    expires_at = user.reset_password_expires_at
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
            
        if datetime.now(timezone.utc) > expires_at:
            user.reset_password_token = None
            user.reset_password_expires_at = None
            db.commit()
            raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Update password
    user.hashed_password = security.get_password_hash(request.new_password)
    user.reset_password_token = None
    user.reset_password_expires_at = None
    db.commit()
    
    return {"message": "Password reset successfully. You can now log in with your new password."}
