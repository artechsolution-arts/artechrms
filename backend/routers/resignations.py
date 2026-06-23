from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from backend.database import get_db
from backend.models.resignation import Resignation
from backend.models.employee import Employee
from backend.auth_utils import decode_token
from backend.models.auth import User
from backend.approval_utils import require_approval_rights

router = APIRouter(prefix="/api/resignations", tags=["Resignations"])


def _send_resignation_status_notif(db, r: "Resignation"):
    """Push in-app notification + email to the employee after approve/reject."""
    from backend.services import notification_service as _notif
    from backend.utils.email import send_email, resignation_status_email

    emp  = r.employee_rel
    if not emp:
        return
    emp_name = emp.full_name or f"{emp.first_name} {emp.last_name or ''}".strip()
    approved = r.status == "Approved"

    title = (f"Resignation Accepted — Last Working Day: {r.approved_last_working_date or r.last_working_date}"
             if approved else "Resignation Not Accepted")
    msg   = (f"Your resignation has been accepted. Last working day: {r.approved_last_working_date or r.last_working_date}."
             if approved else "Your resignation has not been accepted. Please connect with HR.")

    if emp.user_id:
        _notif.push(db, emp.user_id, "resignation", title, msg,
                    entity_id=r.id,
                    notif_type="info" if approved else "warning",
                    priority="high")
        db.commit()

    # Email to employee
    if emp.email:
        subj, html = resignation_status_email(
            employee_name=emp_name,
            status=r.status,
            last_working_date=r.last_working_date,
            approved_last_working_date=r.approved_last_working_date,
            hr_remarks=r.hr_remarks or "",
        )
        send_email(emp.email, subj, html)


def _get_user(request: Request, db: Session) -> User:
    auth = request.headers.get("Authorization", "")
    username = decode_token(auth[7:]) if auth.startswith("Bearer ") else None
    if not username:
        raise HTTPException(401, "Not authenticated")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(401, "User not found")
    return user


def _serialize(r: Resignation) -> dict:
    emp = r.employee_rel
    return {
        "id": r.id,
        "employee_id": emp.id if emp else None,
        "employee_name": emp.full_name if emp else None,
        "profile_photo": emp.profile_photo if emp else None,
        "employee_code": emp.employee_id if emp else None,
        "department": emp.department_rel.name if emp and emp.department_rel else None,
        "designation": emp.designation_rel.name if emp and emp.designation_rel else None,
        "date_of_joining": str(emp.date_of_joining) if emp and emp.date_of_joining else None,
        "reason": r.reason,
        "last_working_date": str(r.last_working_date) if r.last_working_date else None,
        "notice_period_days": r.notice_period_days,
        "status": r.status,
        "hr_remarks": r.hr_remarks,
        "approved_last_working_date": str(r.approved_last_working_date) if r.approved_last_working_date else None,
        "actioned_by": r.actioned_by_rel.full_name if r.actioned_by_rel else None,
        "actioned_at": str(r.actioned_at)[:10] if r.actioned_at else None,
        "created_at": str(r.created_at)[:10] if r.created_at else None,
    }


@router.get("")
def list_resignations(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Resignation).order_by(Resignation.created_at.desc())
    if status:
        q = q.filter(Resignation.status == status)
    return [_serialize(r) for r in q.all()]


class ActionIn(BaseModel):
    hr_remarks: Optional[str] = None
    approved_last_working_date: Optional[date] = None


@router.put("/{resignation_id}/approve")
def approve_resignation(resignation_id: int, data: ActionIn, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    r = db.query(Resignation).filter(Resignation.id == resignation_id).first()
    if not r:
        raise HTTPException(404, "Resignation not found")
    require_approval_rights(request, db, r.employee_id)
    if r.status != "Pending":
        raise HTTPException(400, f"Cannot approve a resignation with status '{r.status}'")
    r.status = "Approved"
    r.hr_remarks = data.hr_remarks
    r.approved_last_working_date = data.approved_last_working_date or r.last_working_date
    r.actioned_by = user.id
    r.actioned_at = datetime.utcnow()
    db.commit()

    _send_resignation_status_notif(db, r)
    return {"ok": True}


@router.put("/{resignation_id}/reject")
def reject_resignation(resignation_id: int, data: ActionIn, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    r = db.query(Resignation).filter(Resignation.id == resignation_id).first()
    if not r:
        raise HTTPException(404, "Resignation not found")
    require_approval_rights(request, db, r.employee_id)
    if r.status != "Pending":
        raise HTTPException(400, f"Cannot reject a resignation with status '{r.status}'")
    r.status = "Rejected"
    r.hr_remarks = data.hr_remarks
    r.actioned_by = user.id
    r.actioned_at = datetime.utcnow()
    db.commit()

    _send_resignation_status_notif(db, r)
    return {"ok": True}
