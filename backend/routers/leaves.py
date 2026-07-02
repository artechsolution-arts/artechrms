from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import date
from backend.database import get_db
from backend.models.leave import LeaveType, LeaveApplication, Attendance, LeavePolicy
from backend.models.hrm import LeaveBalance
from backend.approval_utils import require_approval_rights
from backend.utils.email import send_email, leave_status_email
from backend.services import notification_service as _notif
from backend.utils.audit import log_activity

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])


def _requester_email(request: Request, db: Session) -> str:
    """Return the email of the currently authenticated user (HR actioning a leave)."""
    try:
        from backend.auth_utils import decode_token
        from backend.models.auth import User
        auth = request.headers.get("Authorization", "")
        username = decode_token(auth[7:]) if auth.startswith("Bearer ") else None
        if not username:
            return ""
        user = db.query(User).filter(User.username == username).first()
        return user.email or "" if user else ""
    except Exception:
        return ""


class LeaveTypeIn(BaseModel):
    name: str
    max_leaves: float = 0
    is_carry_forward: bool = False
    is_paid: bool = True


class LeavePolicyIn(BaseModel):
    prorate_on_joining: bool = False
    prorate_cutoff_day: int = 15
    leaves_before_cutoff: float = 2.0
    leaves_after_cutoff: float = 1.0
    carry_forward_max: float = 0
    cf_joined_h1: float = 0
    cf_joined_h2: float = 0
    encashment_allowed: bool = False
    min_service_days: int = 0


class LeaveAppIn(BaseModel):
    employee_id: int
    leave_type_id: int
    from_date: date
    to_date: date
    half_day: bool = False
    reason: Optional[str] = None


class AttendanceIn(BaseModel):
    employee_id: int
    date: date
    status: str = "Present"
    in_time: Optional[str] = None
    out_time: Optional[str] = None


# ── Leave Types ────────────────────────────────────────────────
@router.get("/types")
def list_leave_types(db: Session = Depends(get_db)):
    return db.query(LeaveType).all()


@router.post("/types")
def create_leave_type(data: LeaveTypeIn, db: Session = Depends(get_db)):
    lt = LeaveType(**data.model_dump())
    db.add(lt)
    db.commit()
    db.refresh(lt)
    return lt


@router.put("/types/{type_id}")
def update_leave_type(type_id: int, data: LeaveTypeIn, db: Session = Depends(get_db)):
    lt = db.query(LeaveType).filter(LeaveType.id == type_id).first()
    if not lt:
        raise HTTPException(404, "Leave type not found")
    for k, v in data.model_dump().items():
        setattr(lt, k, v)
    db.commit()
    return {"ok": True}


@router.delete("/types/{type_id}")
def delete_leave_type(type_id: int, db: Session = Depends(get_db)):
    lt = db.query(LeaveType).filter(LeaveType.id == type_id).first()
    if not lt:
        raise HTTPException(404, "Leave type not found")
    db.delete(lt)
    db.commit()
    return {"ok": True}


@router.get("/types/{type_id}/policy")
def get_leave_policy(type_id: int, db: Session = Depends(get_db)):
    policy = db.query(LeavePolicy).filter(LeavePolicy.leave_type_id == type_id).first()
    if not policy:
        return {
            "leave_type_id": type_id,
            "cf_joined_h1": 0,
            "cf_joined_h2": 0,
            "prorate_on_joining": False,
            "prorate_cutoff_day": 15,
            "leaves_before_cutoff": 2.0,
            "leaves_after_cutoff": 1.0,
            "carry_forward_max": 0,
            "encashment_allowed": False,
            "min_service_days": 0,
        }
    return {
        "leave_type_id": policy.leave_type_id,
        "prorate_on_joining": policy.prorate_on_joining,
        "prorate_cutoff_day": policy.prorate_cutoff_day,
        "leaves_before_cutoff": policy.leaves_before_cutoff,
        "leaves_after_cutoff": policy.leaves_after_cutoff,
        "carry_forward_max": policy.carry_forward_max,
        "cf_joined_h1": policy.cf_joined_h1 or 0,
        "cf_joined_h2": policy.cf_joined_h2 or 0,
        "encashment_allowed": policy.encashment_allowed,
        "min_service_days": policy.min_service_days,
    }


@router.put("/types/{type_id}/policy")
def upsert_leave_policy(type_id: int, data: LeavePolicyIn, db: Session = Depends(get_db)):
    lt = db.query(LeaveType).filter(LeaveType.id == type_id).first()
    if not lt:
        raise HTTPException(404, "Leave type not found")
    policy = db.query(LeavePolicy).filter(LeavePolicy.leave_type_id == type_id).first()
    if policy:
        for k, v in data.model_dump().items():
            setattr(policy, k, v)
    else:
        policy = LeavePolicy(leave_type_id=type_id, **data.model_dump())
        db.add(policy)
    db.commit()
    return {"ok": True}


# ── Leave Applications ─────────────────────────────────────────
@router.get("")
def list_leaves(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(LeaveApplication)
    if employee_id:
        q = q.filter(LeaveApplication.employee_id == employee_id)
    if status:
        q = q.filter(LeaveApplication.status == status)
    leaves = q.order_by(LeaveApplication.from_date.desc()).all()
    # Map employee_id → requester role (one query)
    from backend.models.employee import Employee as _Emp
    from backend.models.auth import User as _User
    emp_user = dict(db.query(_Emp.id, _User.role).join(_User, _Emp.user_id == _User.id).all())
    result = []
    for lv in leaves:
        result.append({
            "id": lv.id,
            "employee_id": lv.employee_id,
            "requester_role": emp_user.get(lv.employee_id, "Employee"),
            "employee_name": lv.employee_rel.full_name if lv.employee_rel else "",
            "leave_type": lv.leave_type_rel.name if lv.leave_type_rel else "",
            "from_date": str(lv.from_date),
            "to_date": str(lv.to_date),
            "total_days": lv.total_days,
            "half_day": lv.half_day,
            "leave_category": lv.leave_category or "Planned",
            "status": lv.status,
            "reason": lv.reason,
            "cancellation_reason": lv.cancellation_reason if hasattr(lv, 'cancellation_reason') else None,
            "pending_from_date": str(lv.pending_from_date) if getattr(lv, 'pending_from_date', None) else None,
            "pending_to_date": str(lv.pending_to_date) if getattr(lv, 'pending_to_date', None) else None,
            "pending_total_days": getattr(lv, 'pending_total_days', None),
            "edit_reason": getattr(lv, 'edit_reason', None),
        })
    return result


@router.post("")
def create_leave(data: LeaveAppIn, db: Session = Depends(get_db)):
    delta = (data.to_date - data.from_date).days + 1
    total = 0.5 if data.half_day else float(delta)
    leave = LeaveApplication(**data.model_dump(), total_days=total)
    db.add(leave)
    db.commit()
    db.refresh(leave)
    # Notify HR (TO) and CEO (CC) of the new leave request
    try:
        from backend.models.employee import Employee
        from backend.approval_utils import get_requester_role
        emp = db.query(Employee).filter(Employee.id == leave.employee_id).first()
        emp_name       = emp.full_name if emp else "An employee"
        days_label     = f"{total:.1f} day{'s' if total != 1 else ''}"
        requester_role = get_requester_role(db, leave.employee_id)
        lt             = db.query(LeaveType).filter(LeaveType.id == leave.leave_type_id).first()
        leave_type_name = lt.name if lt else "Leave"
        notif_msg = f"{emp_name} applied for {days_label} {leave_type_name} ({leave.from_date} – {leave.to_date})."

        if requester_role == "HR":
            _notif.push_to_role(
                db, "CEO", "leave", f"Leave Request — {emp_name}",
                notif_msg,
                entity_id=leave.id, notif_type="approval_request", action="leaves", priority="high",
                dedup_key=f"leave_req_{leave.id}",
            )
        else:
            _notif.push_to_role(
                db, "HR", "leave", f"Leave Request — {emp_name}",
                notif_msg,
                entity_id=leave.id, notif_type="approval_request", action="leaves", priority="high",
                dedup_key=f"leave_req_{leave.id}",
            )
            _notif.push_to_role(
                db, "CEO", "leave", f"[CC] Leave Request — {emp_name}",
                notif_msg,
                entity_id=leave.id, notif_type="info", action="leaves", priority="low", is_cc=True,
                dedup_key=f"leave_req_cc_{leave.id}",
            )
        db.commit()

        _notif.fire_leave_request_emails(
            db,
            employee_name=emp_name,
            leave_type=leave_type_name,
            from_date=leave.from_date,
            to_date=leave.to_date,
            days=total,
            reason=getattr(data, "reason", "") or "",
            requester_role=requester_role,
            employee_email=getattr(emp, "email", "") or "",
        )
    except Exception:
        pass
    return {"id": leave.id, "total_days": leave.total_days}


@router.put("/{leave_id}/approve")
def approve_leave(leave_id: int, request: Request, db: Session = Depends(get_db)):
    from backend.models.work_mode_entry import WorkModeEntry
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    require_approval_rights(request, db, leave.employee_id)
    leave.status = "Approved"
    db.query(WorkModeEntry).filter(WorkModeEntry.leave_id == leave_id).update({"status": "Approved"})
    # Deduct from leave balance
    year = leave.from_date.year if leave.from_date else date.today().year
    bal = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == leave.employee_id,
        LeaveBalance.leave_type_id == leave.leave_type_id,
        LeaveBalance.year == year,
    ).first()
    if bal:
        bal.used = round(bal.used + leave.total_days, 2)
    from backend.models.employee import Employee as _Emp
    _leave_emp = db.query(_Emp).filter(_Emp.id == leave.employee_id).first()
    _leave_name = f"{_leave_emp.full_name if _leave_emp else leave.employee_id} — {leave.leave_type} ({leave.total_days}d)"
    log_activity(db, request, "APPROVE", "Leave",
                 entity_id=leave.id,
                 entity_name=_leave_name,
                 changes={"status": {"old": "Pending", "new": "Approved"},
                          "dates": {"old": None, "new": f"{leave.from_date} to {leave.to_date}"}})
    db.commit()
    # Notify employee — FROM the HR user who approved
    _notify_leave_status(leave, "Approved", db, actioned_by_email=_requester_email(request, db))
    return {"ok": True}


@router.put("/{leave_id}/reject")
def reject_leave(leave_id: int, request: Request, db: Session = Depends(get_db)):
    from backend.models.work_mode_entry import WorkModeEntry
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    require_approval_rights(request, db, leave.employee_id)
    leave.status = "Rejected"
    db.query(WorkModeEntry).filter(WorkModeEntry.leave_id == leave_id).delete()
    from backend.models.employee import Employee as _Emp
    _leave_emp = db.query(_Emp).filter(_Emp.id == leave.employee_id).first()
    _leave_name = f"{_leave_emp.full_name if _leave_emp else leave.employee_id} — {leave.leave_type} ({leave.total_days}d)"
    log_activity(db, request, "REJECT", "Leave",
                 entity_id=leave.id,
                 entity_name=_leave_name,
                 changes={"status": {"old": "Pending", "new": "Rejected"},
                          "dates": {"old": None, "new": f"{leave.from_date} to {leave.to_date}"}})
    db.commit()
    # Notify employee — FROM the HR user who rejected
    _notify_leave_status(leave, "Rejected", db, actioned_by_email=_requester_email(request, db))
    return {"ok": True}


@router.put("/{leave_id}/approve-cancel")
def approve_leave_cancellation(leave_id: int, request: Request, db: Session = Depends(get_db)):
    from backend.models.work_mode_entry import WorkModeEntry
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    require_approval_rights(request, db, leave.employee_id)
    if leave.status != "Cancellation Requested":
        raise HTTPException(400, "Leave is not in Cancellation Requested state")
    # Restore balance
    year = leave.from_date.year if leave.from_date else date.today().year
    bal = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == leave.employee_id,
        LeaveBalance.leave_type_id == leave.leave_type_id,
        LeaveBalance.year == year,
    ).first()
    if bal:
        bal.used = max(0, round(bal.used - leave.total_days, 2))
    # Remove work mode entries
    db.query(WorkModeEntry).filter(WorkModeEntry.leave_id == leave_id).delete()
    leave.status = "Cancelled"
    db.commit()
    return {"ok": True}


@router.put("/{leave_id}/reject-cancel")
def reject_leave_cancellation(leave_id: int, request: Request, db: Session = Depends(get_db)):
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    require_approval_rights(request, db, leave.employee_id)
    if leave.status != "Cancellation Requested":
        raise HTTPException(400, "Leave is not in Cancellation Requested state")
    leave.status = "Approved"
    leave.cancellation_reason = None
    db.commit()
    return {"ok": True}


@router.put("/{leave_id}/approve-edit")
def approve_leave_edit(leave_id: int, request: Request, db: Session = Depends(get_db)):
    from backend.models.work_mode_entry import WorkModeEntry
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    require_approval_rights(request, db, leave.employee_id)
    if leave.status != "Edit Requested":
        raise HTTPException(400, "Leave is not in Edit Requested state")
    old_days = leave.total_days
    new_from = leave.pending_from_date
    new_to = leave.pending_to_date
    new_days = leave.pending_total_days
    # Adjust leave balance: refund old days, charge new days
    year = new_from.year if new_from else date.today().year
    bal = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == leave.employee_id,
        LeaveBalance.leave_type_id == leave.leave_type_id,
        LeaveBalance.year == year,
    ).first()
    if bal:
        bal.used = max(0, round(bal.used - old_days + new_days, 2))
    # Remove old work mode entries and re-sync with new dates
    db.query(WorkModeEntry).filter(WorkModeEntry.leave_id == leave_id).delete()
    # Apply new dates
    leave.from_date = new_from
    leave.to_date = new_to
    leave.total_days = new_days
    leave.pending_from_date = None
    leave.pending_to_date = None
    leave.pending_total_days = None
    leave.edit_reason = None
    leave.status = "Approved"
    db.commit()
    # Re-sync work mode entries for new date range
    from backend.routers.portal import _sync_work_mode_for_leave
    db.refresh(leave)
    _sync_work_mode_for_leave(leave, db)
    # Mark new entries as Approved
    db.query(WorkModeEntry).filter(WorkModeEntry.leave_id == leave_id).update({"status": "Approved"})
    db.commit()
    return {"ok": True}


@router.put("/{leave_id}/reject-edit")
def reject_leave_edit(leave_id: int, request: Request, db: Session = Depends(get_db)):
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    require_approval_rights(request, db, leave.employee_id)
    if leave.status != "Edit Requested":
        raise HTTPException(400, "Leave is not in Edit Requested state")
    leave.status = "Approved"
    leave.pending_from_date = None
    leave.pending_to_date = None
    leave.pending_total_days = None
    leave.edit_reason = None
    db.commit()
    return {"ok": True}


def _notify_leave_status(leave, status: str, db: Session, actioned_by_email: str = "") -> None:
    """Email + in-app notification to the employee when their leave is approved/rejected."""
    try:
        from backend.models.employee import Employee
        emp = db.query(Employee).filter(Employee.id == leave.employee_id).first()
        if not emp:
            return
        leave_type_name = leave.leave_type_rel.name if leave.leave_type_rel else "Leave"
        days_label = f"{leave.total_days:.1f} day{'s' if leave.total_days != 1 else ''}"

        # In-app persistent notification
        if emp.user_id:
            _notif.push(
                db, emp.user_id, "leave",
                f"Leave {status}",
                f"Your {leave_type_name} ({days_label}, {leave.from_date} – {leave.to_date}) was {status.lower()}.",
                entity_id=leave.id,
                notif_type="approval_result",
                action="emp-leaves",
                priority="high" if status == "Rejected" else "medium",
                dedup_key=f"leave_result_{leave.id}_{status.lower()}",
            )
            db.commit()

        # Email — FROM the HR user who actioned, TO the employee
        if emp.email:
            subject, html = leave_status_email(
                employee_name=emp.full_name or emp.email,
                leave_type=leave_type_name,
                from_date=leave.from_date,
                to_date=leave.to_date,
                days=leave.total_days,
                status=status,
            )
            send_email(emp.email, subject, html, from_email=actioned_by_email)
    except Exception:
        pass  # notification errors must never break the API response


@router.delete("/{leave_id}")
def delete_leave(leave_id: int, request: Request, db: Session = Depends(get_db)):
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    from backend.models.employee import Employee as _Emp
    _leave_emp = db.query(_Emp).filter(_Emp.id == leave.employee_id).first()
    log_activity(db, request, "DELETE", "Leave",
                 entity_id=leave.id,
                 entity_name=f"{_leave_emp.full_name if _leave_emp else leave.employee_id} — {leave.from_date} to {leave.to_date}")
    db.delete(leave)
    db.commit()
    return {"ok": True}


# ── Attendance ─────────────────────────────────────────────────
@router.get("/attendance")
def list_attendance(
    employee_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Attendance)
    if employee_id:
        q = q.filter(Attendance.employee_id == employee_id)
    if year and month:
        import calendar as _cal
        last_day = _cal.monthrange(year, month)[1]
        from datetime import date as _date
        q = q.filter(Attendance.date >= _date(year, month, 1), Attendance.date <= _date(year, month, last_day))
    records = q.order_by(Attendance.date.asc()).limit(400).all()
    result = []
    for a in records:
        result.append({
            "id": a.id,
            "employee_id": a.employee_id,
            "employee_name": a.employee_rel.full_name if a.employee_rel else "",
            "date": str(a.date),
            "status": a.status,
            "in_time": a.in_time,
            "out_time": a.out_time,
            "working_hours": a.working_hours,
        })
    return result


@router.post("/attendance")
def mark_attendance(data: AttendanceIn, db: Session = Depends(get_db)):
    existing = db.query(Attendance).filter(
        Attendance.employee_id == data.employee_id,
        Attendance.date == data.date,
    ).first()
    if existing:
        raise HTTPException(400, "Attendance already marked for this date")
    hours = 0.0
    if data.in_time and data.out_time:
        try:
            ih, im = map(int, data.in_time.split(":"))
            oh, om = map(int, data.out_time.split(":"))
            hours = round((oh * 60 + om - ih * 60 - im) / 60, 2)
        except Exception:
            pass
    att = Attendance(**data.model_dump(), working_hours=hours)
    db.add(att)
    db.commit()
    db.refresh(att)
    return {"id": att.id}


class AttendanceUpdateIn(BaseModel):
    status: Optional[str] = None
    in_time: Optional[str] = None
    out_time: Optional[str] = None


@router.put("/attendance/{att_id}")
def update_attendance(att_id: int, data: AttendanceUpdateIn, db: Session = Depends(get_db)):
    att = db.query(Attendance).filter(Attendance.id == att_id).first()
    if not att:
        raise HTTPException(404, "Attendance record not found")
    if data.status is not None:
        att.status = data.status
    if data.in_time is not None:
        att.in_time = data.in_time or None
    if data.out_time is not None:
        att.out_time = data.out_time or None
    hours = 0.0
    if att.in_time and att.out_time:
        try:
            ih, im = map(int, att.in_time.split(":"))
            oh, om = map(int, att.out_time.split(":"))
            hours = round((oh * 60 + om - ih * 60 - im) / 60, 2)
        except Exception:
            pass
    att.working_hours = hours
    db.commit()
    return {"ok": True}
