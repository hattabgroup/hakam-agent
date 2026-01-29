import os
import httpx
from fastapi import HTTPException, status

RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"
RECAPTCHA_SECRET_KEY = os.getenv("RECAPTCHA_SECRET_KEY")

async def verify_recaptcha(token: str):
    """
    Verifies the reCAPTCHA token with Google's API.
    Raises HTTPException if verification fails.
    """
    if not RECAPTCHA_SECRET_KEY:
        # If no key is configured, skip verification (or log warning)
        # For security, you might want to fail if key is missing in prod, 
        # but for dev/flexibility we'll skip.
        return True

    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="reCAPTCHA token missing"
        )

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                RECAPTCHA_VERIFY_URL,
                data={
                    "secret": RECAPTCHA_SECRET_KEY,
                    "response": token
                }
            )
            result = response.json()
        except Exception as e:
            # Log error
            print(f"reCAPTCHA verification error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail="Error verifying reCAPTCHA"
            )

    if not result.get("success"):
        # You can inspect result.get("error-codes") for more details
        print(f"reCAPTCHA failed: {result}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="reCAPTCHA verification failed"
        )

    return True
