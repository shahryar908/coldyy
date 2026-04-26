from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from prisma import Prisma
from prisma.errors import UniqueViolationError
from contextlib import asynccontextmanager
from models import (
    RegisterRequest, LoginRequest, ForgotPasswordRequest,
    VerifyAccountRequest, VerifyResetOtpRequest, VerifyLoginOtpRequest,
    ResetPasswordRequest, ChangePasswordRequest, RefreshTokenRequest,
    ResendVerificationRequest, RevokeTokenRequest,
)
from email_utils import send_otp_email
import bcrypt
import jwt
import asyncio
import random
from datetime import datetime, timedelta, timezone
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.environ["SECRET_KEY"]
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7
OTP_EXPIRE_MINUTES = 10

prisma = Prisma()


@asynccontextmanager
async def lifespan(app: FastAPI):
    await prisma.connect()
    yield
    await prisma.disconnect()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")


# ── helpers ───────────────────────────────────────────────────────────────────

def generate_otp() -> str:
    """6-digit numeric OTP."""
    return str(random.randint(100000, 999999))


async def hash_password(plain: str) -> str:
    loop = asyncio.get_event_loop()
    hashed = await loop.run_in_executor(
        None, bcrypt.hashpw, plain.encode(), bcrypt.gensalt()
    )
    return hashed.decode()


async def verify_password(plain: str, hashed: str) -> bool:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, bcrypt.checkpw, plain.encode(), hashed.encode()
    )


def make_access_token(user_id: int, email: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_current_user(authorization: str):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    payload = decode_access_token(token)
    user = await prisma.user.find_unique(where={"userid": payload["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def create_and_send_otp(user_id: int, email: str, purpose: str) -> str:
    """Delete old OTPs, create a new one, and email it."""
    await prisma.verificationtoken.delete_many(where={"userid": user_id})
    otp = generate_otp()
    await prisma.verificationtoken.create(data={
        "userid": user_id,
        "token": otp,
        "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRE_MINUTES),
    })
    await send_otp_email(email, otp, purpose=purpose)
    return otp


# ── endpoints ─────────────────────────────────────────────────────────────────

@app.get("/")
async def root():
    return {"message": "Coldyy API is running"}


# POST /register
# Creates account and sends a 6-digit OTP to the user's email.
@app.post("/register", status_code=201)
async def register(req: RegisterRequest):
    existing = await prisma.user.find_unique(where={"email": req.email})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    hashed = await hash_password(req.password)
    try:
        user = await prisma.user.create(data={
            "firstname": req.firstname,
            "lastname": req.lastname,
            "email": req.email,
            "passwordhash": hashed,
        })
    except UniqueViolationError:
        raise HTTPException(status_code=409, detail="Email already registered")

    await create_and_send_otp(user.userid, user.email, purpose="verification")

    return {
        "message": "Account created. A 6-digit OTP has been sent to your email.",
        "user_id": user.userid,
    }


# POST /verify-account
# Verifies the 6-digit OTP sent after registration.
@app.post("/verify-account")
async def verify_account(req: VerifyAccountRequest):
    user = await prisma.user.find_unique(where={"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.isEmailVerified:
        return {"message": "Email already verified. You can log in."}

    record = await prisma.verificationtoken.find_first(
        where={"userid": user.userid, "token": req.otp}
    )
    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if record.expiresAt.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    await prisma.user.update(
        where={"userid": user.userid},
        data={"isEmailVerified": True},
    )
    await prisma.verificationtoken.delete(where={"tokenid": record.tokenid})

    return {"message": "Email verified successfully. You can now log in."}


# POST /resend-verification
# Sends a fresh OTP to an unverified account.
@app.post("/resend-verification")
async def resend_verification(req: ResendVerificationRequest):
    user = await prisma.user.find_unique(where={"email": req.email})
    if not user or user.isEmailVerified:
        # Don't leak whether email exists or is verified
        return {"message": "If that account exists and is unverified, a new OTP has been sent."}

    await create_and_send_otp(user.userid, user.email, purpose="verification")
    return {"message": "A new OTP has been sent to your email."}


# POST /login
# Validates credentials then sends a 2FA OTP — no tokens issued yet.
@app.post("/login")
async def login(req: LoginRequest):
    user = await prisma.user.find_unique(where={"email": req.email})
    if not user or not await verify_password(req.password, user.passwordhash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.isEmailVerified:
        raise HTTPException(status_code=403, detail="Email not verified. Check your inbox.")

    await create_and_send_otp(user.userid, user.email, purpose="login")
    return {"message": "OTP sent to your email.", "email": user.email, "requires_otp": True}


# POST /verify-login-otp
# Verifies the 2FA OTP and returns access + refresh tokens.
@app.post("/verify-login-otp")
async def verify_login_otp(req: VerifyLoginOtpRequest):
    user = await prisma.user.find_unique(where={"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    record = await prisma.verificationtoken.find_first(
        where={"userid": user.userid, "token": req.otp}
    )
    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if record.expiresAt.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired. Please log in again.")

    await prisma.verificationtoken.delete(where={"tokenid": record.tokenid})

    access_token = make_access_token(user.userid, user.email)
    import secrets
    refresh_raw = secrets.token_urlsafe(40)
    await prisma.session.create(data={
        "userid": user.userid,
        "token": refresh_raw,
        "expiresAt": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    })

    return {
        "access_token": access_token,
        "refresh_token": refresh_raw,
        "token_type": "Bearer",
        "user": {
            "id": user.userid,
            "email": user.email,
            "firstname": user.firstname,
            "lastname": user.lastname,
        },
    }


# POST /forgot-password
# Sends a 6-digit OTP to the email for password reset.
@app.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    user = await prisma.user.find_unique(where={"email": req.email})
    if not user:
        return {"message": "If that email exists, a reset OTP has been sent."}

    await create_and_send_otp(user.userid, user.email, purpose="reset")
    return {"message": "A 6-digit OTP has been sent to your email."}


# POST /verify-reset-otp
# Validates the OTP from forgot-password before allowing password reset.
@app.post("/verify-reset-otp")
async def verify_reset_otp(req: VerifyResetOtpRequest):
    user = await prisma.user.find_unique(where={"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    record = await prisma.verificationtoken.find_first(
        where={"userid": user.userid, "token": req.otp}
    )
    if not record:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if record.expiresAt.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired. Request a new one.")

    # Issue a short-lived reset JWT so /reset-password knows this user is verified
    import secrets as _s
    reset_token = _s.token_urlsafe(32)
    # Re-use the same record slot: update the token to a secure random value, expires in 15 min
    await prisma.verificationtoken.update(
        where={"tokenid": record.tokenid},
        data={
            "token": reset_token,
            "expiresAt": datetime.now(timezone.utc) + timedelta(minutes=15),
        },
    )
    return {"reset_token": reset_token, "message": "OTP verified. Use reset_token to set a new password."}


# POST /reset-password
# Sets a new password using the reset_token from /verify-reset-otp.
@app.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    record = await prisma.verificationtoken.find_unique(where={"token": req.token})
    if not record:
        raise HTTPException(status_code=404, detail="Invalid or expired reset token")
    if record.expiresAt.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token expired")

    hashed = await hash_password(req.new_password)
    await prisma.user.update(
        where={"userid": record.userid},
        data={"passwordhash": hashed},
    )
    await prisma.verificationtoken.delete(where={"tokenid": record.tokenid})
    await prisma.session.delete_many(where={"userid": record.userid})

    return {"message": "Password reset successfully. Please log in again."}


# POST /change-password
# Changes password for a logged-in user who knows their current password.
@app.post("/change-password")
async def change_password(req: ChangePasswordRequest, authorization: str = Header(...)):
    user = await get_current_user(authorization)
    if not await verify_password(req.old_password, user.passwordhash):
        raise HTTPException(status_code=401, detail="Current password is incorrect")

    hashed = await hash_password(req.new_password)
    await prisma.user.update(
        where={"userid": user.userid},
        data={"passwordhash": hashed},
    )
    await prisma.session.delete_many(where={"userid": user.userid})
    return {"message": "Password changed successfully. Please log in again."}


# POST /refresh-token
# Exchanges a valid refresh token for a new access token.
@app.post("/refresh-token")
async def refresh_token(req: RefreshTokenRequest):
    session = await prisma.session.find_unique(where={"token": req.refresh_token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    if session.expiresAt.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        await prisma.session.delete(where={"sessionid": session.sessionid})
        raise HTTPException(status_code=401, detail="Refresh token expired. Please log in again.")

    user = await prisma.user.find_unique(where={"userid": session.userid})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = make_access_token(user.userid, user.email)
    return {"access_token": access_token, "token_type": "Bearer"}


# POST /logout
# Deletes the session (refresh token).
@app.post("/logout")
async def logout(req: RefreshTokenRequest):
    session = await prisma.session.find_unique(where={"token": req.refresh_token})
    if session:
        await prisma.session.delete(where={"sessionid": session.sessionid})
    return {"message": "Logged out successfully"}


# POST /revoke-token
# Revokes a specific session owned by the current user.
@app.post("/revoke-token")
async def revoke_token(req: RevokeTokenRequest, authorization: str = Header(...)):
    user = await get_current_user(authorization)
    session = await prisma.session.find_unique(where={"token": req.session_token})
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.userid != user.userid:
        raise HTTPException(status_code=403, detail="Cannot revoke another user's session")
    await prisma.session.delete(where={"sessionid": session.sessionid})
    return {"message": "Session revoked"}


# GET /sessions
# Lists all active sessions for the current user.
@app.get("/sessions")
async def list_sessions(authorization: str = Header(...)):
    user = await get_current_user(authorization)
    sessions = await prisma.session.find_many(where={"userid": user.userid})
    now = datetime.now(timezone.utc)
    return {
        "sessions": [
            {
                "session_id": s.sessionid,
                "created_at": s.createdAt.isoformat(),
                "expires_at": s.expiresAt.isoformat(),
                "is_expired": s.expiresAt.replace(tzinfo=timezone.utc) < now,
            }
            for s in sessions
        ]
    }
