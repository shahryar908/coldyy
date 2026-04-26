# Coldyy Backend — Architecture & API Reference

## Table of Contents
1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Database Schema](#database-schema)
4. [How the Code is Organized](#how-the-code-is-organized)
5. [Security Model](#security-model)
6. [Every Endpoint Explained](#every-endpoint-explained)
7. [Full User Journeys](#full-user-journeys)
8. [How to Reuse This for Any Product](#how-to-reuse-this-for-any-product)

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Web framework | FastAPI | Async, fast, auto-generates docs at `/docs` |
| ORM | Prisma (Python client) | Type-safe DB access, easy migrations |
| Database | SQLite (dev) → PostgreSQL (prod) | One-line change in `schema.prisma` |
| Password hashing | bcrypt | Industry standard, slow by design (resists brute force) |
| Auth tokens | PyJWT (HS256) | Stateless access tokens |
| OTP email | aiosmtplib + Gmail SMTP | Async email, works with any SMTP provider |
| Env config | python-dotenv | Secrets never in code |

---

## Project Structure

```
backend/
├── main.py           ← All API endpoints
├── models.py         ← Request/response shapes (Pydantic)
├── email_utils.py    ← OTP email sender
├── .env              ← Secrets (never commit this)
└── prisma/
    ├── schema.prisma ← Database structure
    └── dev.db        ← SQLite database file
```

---

## Database Schema

There are **3 tables**. Here is what each one stores and why.

### `User` — one row per registered person

```prisma
model User {
  userid          Int       @id @default(autoincrement())
  firstname       String
  lastname        String
  email           String    @unique     ← no duplicate accounts
  passwordhash    String                ← bcrypt hash, NEVER plain text
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt  ← auto-updates on every save
  isEmailVerified Boolean   @default(false)  ← must verify email before logging in
  sessions        Session[]             ← one user can have many sessions (devices)
  tokens          VerificationToken[]  ← one user can have pending OTPs
}
```

**Key rule:** `isEmailVerified = false` blocks login. This forces every user to prove they own the email before accessing the app.

---

### `Session` — one row per active login device

```prisma
model Session {
  sessionid   Int      @id @default(autoincrement())
  userid      Int                       ← which user owns this session
  token       String   @unique          ← the refresh token (random 40-byte string)
  createdAt   DateTime @default(now())
  expiresAt   DateTime                  ← 7 days from login
  user        User     @relation(...)
}
```

**Key rule:** This is your **refresh token store**. When a user logs in on their phone, one row is created here. When they log in on a second device, a second row is created. `/sessions` lets them see all rows. `/revoke-token` deletes one row (logout from one device). `/logout` deletes the current row.

---

### `VerificationToken` — one row per pending OTP

```prisma
model VerificationToken {
  tokenid     Int      @id @default(autoincrement())
  userid      Int
  token       String   @unique    ← the 6-digit OTP (or reset token after OTP verified)
  createdAt   DateTime @default(now())
  expiresAt   DateTime            ← 10 minutes from creation
  user        User     @relation(...)
}
```

**Key rule:** This table is reused for 3 different purposes:
- Email verification OTP after `/register`
- Login 2FA OTP after `/login`
- Password reset OTP after `/forgot-password`

Only one OTP per user exists at a time — `create_and_send_otp()` always deletes old ones first.

---

## How the Code is Organized

### `models.py` — Request shapes

Every endpoint that receives data has a matching Pydantic model here. Pydantic validates the request automatically — if the client sends wrong data, FastAPI returns a `422` error before your code even runs.

```python
class RegisterRequest(BaseModel):
    firstname: str
    lastname: str
    email: EmailStr      ← validates email format automatically
    password: str

    @field_validator("password")  ← custom rule: 8+ chars, letter, digit
    def validate_password(cls, value): ...
```

---

### `email_utils.py` — OTP email sender

One async function that builds an HTML email and sends it via SMTP.

```python
await send_otp_email(to_email, otp, purpose="verification")
# purpose can be: "verification", "reset", "login"
# Changes the subject line and heading text
```

Reads SMTP credentials from `.env` at call time (not at import time), so the server starts even before `.env` is fully loaded.

---

### `main.py` — The core

**Helpers at the top (not endpoints):**

```python
generate_otp()           → random 6-digit string
hash_password(plain)     → async bcrypt hash
verify_password(p, h)    → async bcrypt check
make_access_token(id, email) → signed JWT, expires in 60 min
decode_access_token(token)   → verify + decode JWT
get_current_user(authorization) → reads Bearer header, returns User object
create_and_send_otp(user_id, email, purpose) → deletes old OTP, creates new, emails it
```

**Pattern used by every protected endpoint:**

```python
@app.post("/change-password")
async def change_password(req: ChangePasswordRequest, authorization: str = Header(...)):
    user = await get_current_user(authorization)  ← verifies JWT, returns User
    # ... rest of logic using user.userid
```

---

## Security Model

```
┌─────────────────────────────────────────────────────────┐
│                    Two-Token System                      │
│                                                         │
│  Access Token (JWT)          Refresh Token (random)     │
│  ─────────────────           ──────────────────────     │
│  • Expires: 60 minutes       • Expires: 7 days          │
│  • Stored: memory only       • Stored: DB + AsyncStorage │
│  • Used: every API call      • Used: get new access token│
│  • Stateless (no DB lookup)  • Stateful (checked in DB) │
└─────────────────────────────────────────────────────────┘
```

**Why two tokens?**
- Access tokens are short-lived so a stolen token is useless after 60 min
- Refresh tokens are long-lived but stored in DB — you can revoke them instantly
- On app start, the frontend silently gets a new access token using the stored refresh token — user never sees a login screen again unless the refresh token expires

**OTP security:**
- OTP expires in 10 minutes
- Old OTP is always deleted before a new one is created (no stale OTPs)
- Login requires OTP every time (2FA) — even with correct password

---

## Every Endpoint Explained

### `POST /register`
**What it does:** Creates a new user account and sends a verification OTP.

**Flow:**
```
1. Check if email already exists → 409 if yes
2. Hash the password with bcrypt
3. Create User row (isEmailVerified = false)
4. Generate 6-digit OTP → save to VerificationToken → email it
5. Return { user_id, message }
```

**Frontend uses it:** Signup screen → routes to OTP verify screen

---

### `POST /verify-account`
**What it does:** Confirms ownership of the email using the OTP from `/register`.

**Flow:**
```
1. Find user by email
2. Find VerificationToken matching { userid, otp }
3. Check expiry
4. Set User.isEmailVerified = true
5. Delete the VerificationToken row
6. Return success
```

**Frontend uses it:** verify-otp screen (mode: register) → routes to login

---

### `POST /resend-verification`
**What it does:** Sends a fresh OTP to an unverified account.

**Flow:**
```
1. Find user by email (silent if not found — don't leak user existence)
2. Delete old OTP → create new OTP → email it
```

**Frontend uses it:** "Resend OTP" button on verify-otp screen

---

### `POST /login`
**What it does:** Validates password, then sends a 2FA OTP. Does NOT return tokens yet.

**Flow:**
```
1. Find user by email
2. bcrypt.checkpw(password, passwordhash)
3. Check isEmailVerified
4. Generate OTP → save → email it
5. Return { email, requires_otp: true }  ← no tokens yet
```

**Frontend uses it:** Login screen → routes to OTP verify screen (mode: login)

---

### `POST /verify-login-otp`
**What it does:** Verifies the login 2FA OTP and issues tokens.

**Flow:**
```
1. Find user by email
2. Find VerificationToken matching { userid, otp }
3. Check expiry
4. Delete the OTP row
5. Create JWT access token (60 min)
6. Create random refresh token → save to Session (7 days)
7. Return { access_token, refresh_token, user }
```

**Frontend uses it:** verify-otp screen (mode: login) → signIn() → routes to tabs

---

### `POST /forgot-password`
**What it does:** Sends a password reset OTP. Safe even if email doesn't exist (no leak).

**Flow:**
```
1. Find user by email (return generic message if not found)
2. Delete old OTP → create new OTP (10 min) → email it
```

**Frontend uses it:** Forgot password screen → routes to OTP verify screen (mode: reset)

---

### `POST /verify-reset-otp`
**What it does:** Validates the reset OTP, then upgrades it to a 15-minute reset token.

**Flow:**
```
1. Find user by email
2. Find VerificationToken matching { userid, otp }
3. Check expiry
4. Update the same DB row: replace 6-digit OTP with a secure random reset_token (15 min)
5. Return { reset_token }
```

**Why upgrade?** The frontend needs to carry a credential from this step to the next. The reset_token is cryptographically random (not guessable), so it's safe to pass as a URL param.

**Frontend uses it:** verify-otp screen (mode: reset) → routes to reset-password screen

---

### `POST /reset-password`
**What it does:** Sets a new password using the reset_token from `/verify-reset-otp`.

**Flow:**
```
1. Find VerificationToken by reset_token
2. Check expiry
3. Hash new password
4. Update User.passwordhash
5. Delete the VerificationToken row
6. Delete ALL Sessions for this user  ← security: force re-login everywhere
```

**Frontend uses it:** Reset password screen → routes to login

---

### `POST /change-password`  ← requires login
**What it does:** Changes password for a logged-in user who knows their current password.

**Flow:**
```
1. Verify Bearer token → get User
2. bcrypt.checkpw(old_password, user.passwordhash)
3. Hash new password
4. Update passwordhash
5. Delete ALL Sessions  ← force re-login everywhere
```

---

### `POST /refresh-token`
**What it does:** Exchanges a valid refresh token for a new access token.

**Flow:**
```
1. Find Session by refresh_token
2. Check expiry (delete + 401 if expired)
3. Find the user
4. Create new JWT access token
5. Return { access_token }
```

**Frontend uses it:** Called automatically by api.ts when any request returns 401

---

### `POST /logout`
**What it does:** Deletes the current session (logs out this device only).

**Flow:**
```
1. Find Session by refresh_token
2. Delete that Session row
```

**Frontend uses it:** signOut() in auth-context

---

### `POST /revoke-token`  ← requires login
**What it does:** Deletes any one session owned by the current user (remote logout).

**Flow:**
```
1. Verify Bearer token → get User
2. Find Session by session_token
3. Verify Session.userid === user.userid  ← can't revoke someone else's session
4. Delete that Session row
```

**Frontend uses it:** Sessions management screen (not built yet)

---

### `GET /sessions`  ← requires login
**What it does:** Lists all active login sessions for the current user.

**Flow:**
```
1. Verify Bearer token → get User
2. Find all Sessions where userid = user.userid
3. Return list with { session_id, created_at, expires_at, is_expired }
```

**Frontend uses it:** "Active sessions" screen — shows user all their logged-in devices

---

## Full User Journeys

### New user signs up
```
/register → email OTP arrives → /verify-account → /login → login OTP arrives → /verify-login-otp → inside app
```

### Returning user logs in
```
/login → login OTP arrives → /verify-login-otp → inside app
```

### App restart (already logged in)
```
AsyncStorage has refresh_token → /refresh-token → new access_token → inside app (no login screen)
```

### Forgot password
```
/forgot-password → reset OTP arrives → /verify-reset-otp → /reset-password → /login
```

### Token expires mid-session
```
API call → 401 → api.ts auto-calls /refresh-token → retries original request → user sees nothing
```

### User wants to log out all devices
```
GET /sessions → see all sessions → POST /revoke-token for each → all devices logged out
```

---

## How to Reuse This for Any Product

This auth system is self-contained. To plug it into a banking app, e-commerce app, or any product:

**Step 1 — Add your product models to `schema.prisma`**
```prisma
model Account {
  accountid   Int    @id @default(autoincrement())
  userid      Int
  balance     Float  @default(0)
  user        User   @relation(fields: [userid], references: [userid])
}
```

**Step 2 — Add product endpoints to `main.py`**
```python
@app.get("/account/balance")
async def get_balance(authorization: str = Header(...)):
    user = await get_current_user(authorization)  ← this one line handles all auth
    account = await prisma.account.find_first(where={"userid": user.userid})
    return {"balance": account.balance}
```

**Step 3 — That's it.** The `get_current_user()` helper handles token verification for every endpoint. Any endpoint that calls it is automatically protected.

**For banking specifically, also add:**
- Rate limiting (e.g. `slowapi`) on `/login` and `/verify-login-otp`
- Audit log table — record every login, logout, and sensitive action
- Switch SQLite → PostgreSQL in `schema.prisma` (`provider = "postgresql"`)
- HTTPS only (terminate at nginx or a cloud load balancer)
- Lock `allow_origins` in CORS to your frontend domain only
