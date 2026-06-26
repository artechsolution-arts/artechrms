import os, json
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
import httpx
from backend.database import get_db
from backend.models.auth import User
from backend.auth_utils import get_password_hash, verify_password, create_access_token

MS_CLIENT_ID     = os.getenv("MS_CLIENT_ID", "")
MS_CLIENT_SECRET = os.getenv("MS_CLIENT_SECRET", "")
MS_TENANT_ID     = os.getenv("MS_TENANT_ID", "common")
MS_REDIRECT_URI  = os.getenv("MS_REDIRECT_URI", "http://localhost:8000/api/auth/microsoft/callback")

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str = "HR"


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str


@router.post("/change-password")
def change_password(data: ChangePasswordIn, request: Request, db: Session = Depends(get_db)):
    """Logged-in user changes their own password."""
    username = getattr(request.state, "username", None)
    if not username:
        raise HTTPException(401, "Not authenticated")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(404, "User not found")
    if not verify_password(data.current_password.strip(), user.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    if len(data.new_password.strip()) < 6:
        raise HTTPException(400, "New password must be at least 6 characters")
    user.hashed_password = get_password_hash(data.new_password.strip())
    db.commit()
    return {"ok": True}


@router.post("/login")
def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    # Rate limit: 10 attempts per minute per IP (enforced by middleware in main.py)
    login_input = form_data.username.strip()
    password_input = form_data.password.strip()
    user = db.query(User).filter(User.username == login_input).first()
    if not user:
        user = db.query(User).filter(User.email.ilike(login_input)).first()
    if not user or not verify_password(password_input, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    token = create_access_token(user.username, role=user.role)

    try:
        from backend.models.activity_log import ActivityLog
        ip = request.client.host if request.client else None
        db.add(ActivityLog(actor=user.username, actor_role=user.role,
                           action="LOGIN", entity_type="Auth",
                           entity_name=user.full_name or user.username, ip_address=ip))
        db.commit()
    except Exception:
        pass

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "email": user.email,
        },
    }


@router.post("/setup")
def initial_setup(data: UserCreate, db: Session = Depends(get_db)):
    """Create first admin user. Only works when no users exist."""
    if db.query(User).count() > 0:
        raise HTTPException(400, "Setup already completed. Use login instead.")
    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role="SuperAdmin",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = create_access_token(user.username, role=user.role)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "email": user.email,
        },
    }


@router.get("/me")
def get_me(db: Session = Depends(get_db), token: str = None):
    from fastapi import Request
    return {"message": "use /api/auth/verify"}


@router.post("/verify")
def verify_token_endpoint(db: Session = Depends(get_db)):
    """Used by frontend to check if a token is still valid (via middleware)."""
    return {"valid": True}


@router.post("/create-user")
def create_user(data: UserCreate, db: Session = Depends(get_db)):
    """Admin endpoint to create additional users."""
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "Username already exists")
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already exists")
    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role=data.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role}


@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).all()
    return [
        {"id": u.id, "username": u.username, "full_name": u.full_name,
         "email": u.email, "role": u.role, "is_active": u.is_active}
        for u in users
    ]


@router.get("/needs-setup")
def check_setup(db: Session = Depends(get_db)):
    return {"needs_setup": db.query(User).count() == 0}


# ── Microsoft SSO ──────────────────────────────────────────────────────────

@router.get("/microsoft")
def ms_login():
    """Redirect user to Microsoft login page."""
    if not MS_CLIENT_ID:
        raise HTTPException(500, "Microsoft SSO is not configured")
    params = (
        f"client_id={MS_CLIENT_ID}"
        f"&response_type=code"
        f"&redirect_uri={MS_REDIRECT_URI}"
        f"&scope=openid+profile+email+User.Read"
        f"&response_mode=query"
        f"&prompt=select_account"
    )
    url = f"https://login.microsoftonline.com/{MS_TENANT_ID}/oauth2/v2.0/authorize?{params}"
    return RedirectResponse(url)


@router.get("/microsoft/callback")
def ms_callback(code: str = None, error: str = None, db: Session = Depends(get_db)):
    """Exchange Microsoft auth code for our JWT."""
    if error or not code:
        return RedirectResponse(f"/?sso_error={error or 'no_code'}")

    # Exchange code for tokens
    token_url = f"https://login.microsoftonline.com/{MS_TENANT_ID}/oauth2/v2.0/token"
    with httpx.Client() as client:
        token_resp = client.post(token_url, data={
            "client_id":     MS_CLIENT_ID,
            "client_secret": MS_CLIENT_SECRET,
            "code":          code,
            "redirect_uri":  MS_REDIRECT_URI,
            "grant_type":    "authorization_code",
        })
        if not token_resp.is_success:
            return RedirectResponse("/?sso_error=token_exchange_failed")

        access_token = token_resp.json().get("access_token")

        # Fetch user profile from Microsoft Graph
        graph_resp = client.get(
            "https://graph.microsoft.com/v1.0/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if not graph_resp.is_success:
            return RedirectResponse("/?sso_error=graph_api_failed")

        profile = graph_resp.json()

    email = (profile.get("mail") or profile.get("userPrincipalName") or "").lower().strip()
    if not email:
        return RedirectResponse("/?sso_error=no_email")

    # Match to existing user by email
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user:
        return RedirectResponse(f"/?sso_error=user_not_found&email={email}")

    if not user.is_active:
        return RedirectResponse("/?sso_error=account_deactivated")

    jwt_token = create_access_token(user.username, role=user.role)
    user_json  = json.dumps({
        "id": user.id, "username": user.username,
        "full_name": user.full_name, "role": user.role, "email": user.email,
    })
    import urllib.parse
    return RedirectResponse(
        f"/?sso_token={urllib.parse.quote(jwt_token)}"
        f"&sso_user={urllib.parse.quote(user_json)}"
    )
