"""
SuperAdmin (CEO) panel endpoints.
All routes require SuperAdmin role — enforced in the RBAC middleware.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from backend.database import get_db
from backend.models.auth import User
from backend.models.permission import RolePermission, DEFAULT_PERMISSIONS, ALL_FEATURES
from backend.models.employee import Employee
from backend.auth_utils import get_password_hash

router = APIRouter(prefix="/api/admin", tags=["SuperAdmin Panel"])


# ── Helpers ────────────────────────────────────────────────────

def _ensure_permissions_seeded(db: Session):
    """Seed default permissions if table is empty."""
    for role, features in DEFAULT_PERMISSIONS.items():
        if not db.query(RolePermission).filter(RolePermission.role == role).first():
            db.add(RolePermission(role=role, allowed_features=features))
    db.commit()


# ── System stats ───────────────────────────────────────────────

@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    from backend.models.employee import Employee
    from backend.models.leave import LeaveApplication
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    total_employees = db.query(Employee).count()
    active_employees = db.query(Employee).filter(Employee.status == "Active").count()
    pending_leaves = db.query(LeaveApplication).filter(LeaveApplication.status == "Pending").count()

    role_breakdown = {}
    for u in db.query(User).all():
        role_breakdown[u.role] = role_breakdown.get(u.role, 0) + 1

    return {
        "total_users": total_users,
        "active_users": active_users,
        "inactive_users": total_users - active_users,
        "total_employees": total_employees,
        "active_employees": active_employees,
        "pending_leaves": pending_leaves,
        "role_breakdown": role_breakdown,
    }


# ── User management ────────────────────────────────────────────

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    result = []
    for u in users:
        emp = db.query(Employee).filter(Employee.email == u.email).first() if u.email else None
        result.append({
            "id": u.id,
            "username": u.username,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "created_at": u.created_at.strftime("%Y-%m-%d %H:%M") if u.created_at else None,
            "updated_at": u.updated_at.strftime("%Y-%m-%d %H:%M") if u.updated_at else None,
            "linked_employee": emp.full_name if emp else None,
            "linked_employee_id": emp.employee_id if emp else None,
        })
    return result


class UserCreateIn(BaseModel):
    username: str
    email: str
    full_name: str
    password: str
    role: str = "Admin"


class UserUpdateIn(BaseModel):
    username: Optional[str] = None
    full_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class ResetPasswordIn(BaseModel):
    new_password: str


@router.post("/users")
def create_user(data: UserCreateIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == data.username).first():
        raise HTTPException(400, "Username already taken")
    if data.email and db.query(User).filter(User.email == data.email).first():
        raise HTTPException(400, "Email already registered")
    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role=data.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"id": user.id, "username": user.username, "role": user.role}


@router.put("/users/{user_id}")
def update_user(user_id: int, data: UserUpdateIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if data.username is not None:
        existing = db.query(User).filter(User.username == data.username, User.id != user_id).first()
        if existing:
            raise HTTPException(400, "Username already taken by another user")
        user.username = data.username
    if data.full_name is not None:
        user.full_name = data.full_name
    if data.email is not None:
        existing = db.query(User).filter(User.email == data.email, User.id != user_id).first()
        if existing:
            raise HTTPException(400, "Email already taken by another user")
        user.email = data.email
    if data.role is not None:
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    user.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True}


@router.post("/users/{user_id}/reset-password")
def reset_password(user_id: int, data: ResetPasswordIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if len(data.new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"ok": True}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(404, "User not found")
    if user.role == "SuperAdmin":
        # Count how many SuperAdmins exist
        count = db.query(User).filter(User.role == "SuperAdmin").count()
        if count <= 1:
            raise HTTPException(400, "Cannot delete the last SuperAdmin account")
    db.delete(user)
    db.commit()
    return {"ok": True}


# ── Feature permissions ────────────────────────────────────────

@router.get("/permissions")
def get_permissions(db: Session = Depends(get_db)):
    _ensure_permissions_seeded(db)
    perms = db.query(RolePermission).all()
    return {
        "all_features": ALL_FEATURES,
        "permissions": {p.role: p.allowed_features or [] for p in perms},
    }


class PermissionsUpdateIn(BaseModel):
    permissions: dict  # {role: [feature_keys]}


@router.put("/permissions")
def update_permissions(data: PermissionsUpdateIn, db: Session = Depends(get_db)):
    _ensure_permissions_seeded(db)
    for role, features in data.permissions.items():
        rp = db.query(RolePermission).filter(RolePermission.role == role).first()
        if rp:
            rp.allowed_features = features
        else:
            db.add(RolePermission(role=role, allowed_features=features))
    db.commit()
    return {"ok": True}


@router.get("/permissions/{role}")
def get_role_permissions(role: str, db: Session = Depends(get_db)):
    _ensure_permissions_seeded(db)
    rp = db.query(RolePermission).filter(RolePermission.role == role).first()
    return {"role": role, "allowed_features": rp.allowed_features if rp else ALL_FEATURES}
