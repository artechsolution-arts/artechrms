from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.models.auth import User
from backend.auth_utils import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class UserCreate(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str = "HR User"


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user:
        user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    token = create_access_token(user.username)
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
    token = create_access_token(user.username)
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
