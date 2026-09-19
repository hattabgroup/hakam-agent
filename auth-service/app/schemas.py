from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    recaptcha_token: str | None = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str
    recaptcha_token: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    is_verified: bool = True
    requires_verification: bool = False
    access_token: str | None = None

    class Config:
        from_attributes = True

class ForgotPasswordRequest(BaseModel):
    email: EmailStr
    recaptcha_token: str | None = None

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    recaptcha_token: str | None = None
