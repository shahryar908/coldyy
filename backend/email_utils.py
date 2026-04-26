import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

async def send_otp_email(to_email: str, otp: str, purpose: str = "verification"):
    SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
    SMTP_USER = os.environ["SMTP_USER"]
    SMTP_PASS = os.environ["SMTP_PASS"]
    FROM_NAME = os.environ.get("FROM_NAME", "Coldyy")
    subject_map = {
        "verification": "Verify your Coldyy account",
        "reset":        "Reset your Coldyy password",
    }
    subject = subject_map.get(purpose, "Your Coldyy OTP")

    body_html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;">
      <h2 style="color:#0a7ea4;margin-bottom:8px;">{'Verify your email' if purpose == 'verification' else 'Reset your password'}</h2>
      <p style="color:#444;font-size:15px;">Use the code below. It expires in <strong>10 minutes</strong>.</p>
      <div style="background:#f4f4f4;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
        <span style="font-size:40px;font-weight:700;letter-spacing:12px;color:#111;">{otp}</span>
      </div>
      <p style="color:#888;font-size:13px;">If you didn't request this, ignore this email.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(body_html, "html"))

    await aiosmtplib.send(
        msg,
        hostname=SMTP_HOST,
        port=SMTP_PORT,
        username=SMTP_USER,
        password=SMTP_PASS,
        start_tls=True,
    )
