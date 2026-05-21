from fastapi import APIRouter, Request, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from backend.database import get_db
from backend.auth_utils import decode_token
from backend.models.auth import User
from backend.models.notice_period_config import NoticePeriodConfig, DEFAULT_RULES, EMPLOYMENT_TYPES

router = APIRouter(prefix="/api/hr", tags=["Notice Period Config"])


def _get_user(request: Request, db: Session):
    auth = request.headers.get("Authorization", "")
    username = decode_token(auth[7:]) if auth.startswith("Bearer ") else None
    if not username:
        return None
    return db.query(User).filter(User.username == username).first()


def _get_or_create(db: Session) -> NoticePeriodConfig:
    cfg = db.query(NoticePeriodConfig).filter(NoticePeriodConfig.id == 1).first()
    if not cfg:
        cfg = NoticePeriodConfig(id=1, rules=dict(DEFAULT_RULES))
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


@router.get("/notice-period-config")
def get_config(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user:
        raise HTTPException(401)
    cfg = _get_or_create(db)
    return {"rules": cfg.rules, "employment_types": EMPLOYMENT_TYPES}


class RulesIn(BaseModel):
    rules: dict


@router.put("/notice-period-config")
def update_config(data: RulesIn, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user or user.role not in ("HR", "SuperAdmin", "CEO"):
        raise HTTPException(403, "Insufficient permissions")
    for k, v in data.rules.items():
        try:
            if int(v) < 1:
                raise ValueError
        except (TypeError, ValueError):
            raise HTTPException(400, f"Invalid notice period for {k}: must be a positive integer")
    cfg = _get_or_create(db)
    cfg.rules = {k: int(v) for k, v in data.rules.items()}
    db.commit()
    return {"ok": True, "rules": cfg.rules}
