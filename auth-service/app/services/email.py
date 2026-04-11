import os
import aiosmtplib
from email.message import EmailMessage

ZEPTOMAIL_SMTP_HOST = os.getenv("ZEPTOMAIL_SMTP_HOST", "smtp.zeptomail.com")
ZEPTOMAIL_SMTP_PORT = int(os.getenv("ZEPTOMAIL_SMTP_PORT", 587))
ZEPTOMAIL_USERNAME = os.getenv("ZEPTOMAIL_USERNAME")
ZEPTOMAIL_PASSWORD = os.getenv("ZEPTOMAIL_PASSWORD")
ZEPTOMAIL_FROM_EMAIL = os.getenv("ZEPTOMAIL_FROM_EMAIL")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

async def send_verification_email(to_email: str, token: str):
    """
    Sends a verification email using ZeptoMail SMTP.
    """
    if not ZEPTOMAIL_USERNAME or not ZEPTOMAIL_PASSWORD or not ZEPTOMAIL_FROM_EMAIL:
        print("Warning: ZeptoMail credentials not set. Skipping email send.")
        return

    verification_link = f"{FRONTEND_BASE_URL}/verify-email?token={token}"

    message = EmailMessage()
    message["From"] = f"Hakam <{ZEPTOMAIL_FROM_EMAIL}>"
    message["To"] = to_email
    message["Subject"] = "Verify your Hakam account"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to Hakam!</h2>
        <p>Please click the button below to verify your email address and activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{verification_link}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can click this link: <a href="{verification_link}">{verification_link}</a></p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
    </div>
    """
    
    message.set_content("Please verify your email: " + verification_link)
    message.add_alternative(html_content, subtype="html")

    # Determine TLS settings based on port
    use_tls = ZEPTOMAIL_SMTP_PORT == 465
    start_tls = ZEPTOMAIL_SMTP_PORT != 465

    try:
        await aiosmtplib.send(
            message,
            hostname=ZEPTOMAIL_SMTP_HOST,
            port=ZEPTOMAIL_SMTP_PORT,
            username=ZEPTOMAIL_USERNAME,
            password=ZEPTOMAIL_PASSWORD,
            use_tls=use_tls,
            start_tls=start_tls,
            timeout=20 # Higher timeout for reliability
        )
        print(f"Verification email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
        # In production, you might want to log this to a proper logging service or raise headers

async def send_password_reset_email(to_email: str, token: str):
    """
    Sends a password reset email using ZeptoMail SMTP.
    """
    if not ZEPTOMAIL_USERNAME or not ZEPTOMAIL_PASSWORD or not ZEPTOMAIL_FROM_EMAIL:
        print("Warning: ZeptoMail credentials not set. Skipping email send.")
        return

    reset_link = f"{FRONTEND_BASE_URL}/reset-password?token={token}"

    message = EmailMessage()
    message["From"] = f"Hakam <{ZEPTOMAIL_FROM_EMAIL}>"
    message["To"] = to_email
    message["Subject"] = "Reset your Hakam password"
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Please click the button below to set a new password.</p>
        <p>This link will expire in 1 hour.</p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_link}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can click this link: <a href="{reset_link}">{reset_link}</a></p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
    </div>
    """
    
    message.set_content("Please reset your password: " + reset_link)
    message.add_alternative(html_content, subtype="html")

    # Determine TLS settings based on port
    use_tls = ZEPTOMAIL_SMTP_PORT == 465
    start_tls = ZEPTOMAIL_SMTP_PORT != 465

    try:
        await aiosmtplib.send(
            message,
            hostname=ZEPTOMAIL_SMTP_HOST,
            port=ZEPTOMAIL_SMTP_PORT,
            username=ZEPTOMAIL_USERNAME,
            password=ZEPTOMAIL_PASSWORD,
            use_tls=use_tls,
            start_tls=start_tls,
            timeout=20 # Higher timeout for reliability
        )
        print(f"Password reset email sent to {to_email}")
    except Exception as e:
        print(f"Failed to send email to {to_email}: {e}")
