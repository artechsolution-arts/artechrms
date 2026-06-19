"""
Central approval workflow API.
Covers: viewing pending approvals, acting on them, viewing history,
and managing workflow configurations.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.auth import User
from backend.models.approval import ApprovalWorkflow
from backend.auth_utils import decode_token
from backend import services

router = APIRouter(prefix="/api/approvals", tags=["Approvals"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _current_user(request: Request, db: Session) -> User:
    username = getattr(request.state, "username", None)
    if not username:
        raise HTTPException(401, "Not authenticated")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(401, "User not found")
    return user


class ActionIn(BaseModel):
    remarks: Optional[str] = ""


class WorkflowUpdateIn(BaseModel):
    levels: list       # [{level: 1, role: "HR"}, ...]
    cc_roles: list = []
    is_active: bool = True


# ── Pending approvals ──────────────────────────────────────────────────────────

@router.get("/pending")
def get_pending_approvals(request: Request, db: Session = Depends(get_db)):
    """List all approval requests pending action by the current user's role."""
    from backend.services.approval_service import pending_for_user
    user = _current_user(request, db)
    return pending_for_user(db, user)


# ── Act on an approval ─────────────────────────────────────────────────────────

@router.post("/{approval_id}/approve")
def approve_request(approval_id: int, body: ActionIn, request: Request, db: Session = Depends(get_db)):
    from backend.services.approval_service import process
    user = _current_user(request, db)
    try:
        req = process(db, approval_id, user, "approve", body.remarks or "")
    except PermissionError as e:
        raise HTTPException(403, str(e))
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"ok": True, "status": req.status, "module": req.module}


@router.post("/{approval_id}/reject")
def reject_request(approval_id: int, body: ActionIn, request: Request, db: Session = Depends(get_db)):
    from backend.services.approval_service import process
    user = _current_user(request, db)
    try:
        req = process(db, approval_id, user, "reject", body.remarks or "")
    except PermissionError as e:
        raise HTTPException(403, str(e))
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"ok": True, "status": req.status, "module": req.module}


# ── History ────────────────────────────────────────────────────────────────────

@router.get("/history")
def get_approval_history(
    module: Optional[str] = None,
    entity_id: Optional[int] = None,
    status: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    from backend.services.approval_service import get_history
    return get_history(db, module=module, entity_id=entity_id, status=status, limit=limit)


# ── Workflow configuration (HR/SuperAdmin) ─────────────────────────────────────

@router.get("/workflows")
def list_workflows(db: Session = Depends(get_db)):
    return db.query(ApprovalWorkflow).all()


@router.put("/workflows/{module}")
def update_workflow(module: str, data: WorkflowUpdateIn, request: Request, db: Session = Depends(get_db)):
    user = _current_user(request, db)
    if user.role not in ("HR", "SuperAdmin", "CEO"):
        raise HTTPException(403, "Only HR or SuperAdmin can update approval workflows")
    wf = db.query(ApprovalWorkflow).filter(ApprovalWorkflow.module == module).first()
    if not wf:
        wf = ApprovalWorkflow(module=module)
        db.add(wf)
    wf.levels = data.levels
    wf.cc_roles = data.cc_roles
    wf.is_active = data.is_active
    db.commit()
    return {"ok": True, "module": module}
