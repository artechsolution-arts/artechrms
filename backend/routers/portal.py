"""Employee Self-Service Portal — endpoints return data scoped to the logged-in employee."""
import time, uuid
from fastapi import APIRouter, Request, HTTPException, UploadFile, File
from backend import storage
from sqlalchemy.orm import Session
from fastapi import Depends
from pydantic import BaseModel
from datetime import date as _date, date, timedelta, datetime as _datetime
from typing import Optional
from backend.database import get_db
from backend.models.employee import Employee
from backend.models.leave import LeaveApplication, LeaveType, Attendance
from backend.models.payroll import SalarySlip
from backend.models.appraisal import Appraisal
from backend.models.hrm import ExpenseClaim, EmergencyContact, EmployeeAsset
from backend.auth_utils import decode_token
from backend.models.auth import User

router = APIRouter(prefix="/api/portal", tags=["Employee Portal"])


def _get_user(request: Request, db: Session) -> User:
    auth = request.headers.get("Authorization", "")
    username = decode_token(auth[7:]) if auth.startswith("Bearer ") else None
    if not username:
        raise HTTPException(401, "Not authenticated")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(401, "User not found")
    return user


# ── My permissions (readable by any authenticated user) ────────
@router.get("/my-permissions")
def get_my_permissions(request: Request, db: Session = Depends(get_db)):
    from backend.models.permission import RolePermission, DEFAULT_PERMISSIONS, ALL_FEATURES
    user = _get_user(request, db)
    if user.role == "SuperAdmin":
        return {"role": user.role, "allowed_features": ALL_FEATURES}
    rp = db.query(RolePermission).filter(RolePermission.role == user.role).first()
    if rp and rp.allowed_features is not None:
        return {"role": user.role, "allowed_features": rp.allowed_features}
    return {"role": user.role, "allowed_features": DEFAULT_PERMISSIONS.get(user.role, [])}


def _get_employee(request: Request, db: Session) -> Employee:
    """Resolve the logged-in user → their employee record (matched by email)."""
    auth = request.headers.get("Authorization", "")
    username = decode_token(auth[7:]) if auth.startswith("Bearer ") else None
    if not username:
        raise HTTPException(401, "Not authenticated")
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(401, "User not found")
    emp = db.query(Employee).filter(Employee.email == user.email).first()
    if not emp:
        raise HTTPException(404, "No employee record linked to this account. Contact HR.")
    return emp


# ── Dashboard ──────────────────────────────────────────────────
@router.get("/dashboard")
def portal_dashboard(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    today = date.today()

    pending_leaves = db.query(LeaveApplication).filter(
        LeaveApplication.employee_id == emp.id,
        LeaveApplication.status == "Pending"
    ).count()

    approved_leaves = db.query(LeaveApplication).filter(
        LeaveApplication.employee_id == emp.id,
        LeaveApplication.status == "Approved"
    ).count()

    attendance_this_month = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= today.replace(day=1),
    ).count()

    present_this_month = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= today.replace(day=1),
        Attendance.status == "Present",
    ).count()

    latest_slip = db.query(SalarySlip).filter(
        SalarySlip.employee_id == emp.id
    ).order_by(SalarySlip.year.desc(), SalarySlip.month.desc()).first()

    recent_attendance = db.query(Attendance).filter(
        Attendance.employee_id == emp.id
    ).order_by(Attendance.date.desc()).limit(7).all()

    return {
        "employee": {
            "id": emp.id,
            "employee_id": emp.employee_id,
            "full_name": emp.full_name,
            "email": emp.email,
            "department": emp.department_rel.name if emp.department_rel else None,
            "designation": emp.designation_rel.name if emp.designation_rel else None,
            "date_of_joining": str(emp.date_of_joining) if emp.date_of_joining else None,
            "status": emp.status,
            "profile_photo": emp.profile_photo,
        },
        "stats": {
            "pending_leaves": pending_leaves,
            "approved_leaves": approved_leaves,
            "attendance_this_month": attendance_this_month,
            "present_this_month": present_this_month,
            "latest_net_pay": latest_slip.net_pay if latest_slip else None,
            "latest_slip_month": f"{latest_slip.month}/{latest_slip.year}" if latest_slip else None,
        },
        "recent_attendance": [
            {"date": str(a.date), "status": a.status, "in_time": a.in_time, "out_time": a.out_time, "hours": a.working_hours}
            for a in recent_attendance
        ],
    }


# ── Profile ────────────────────────────────────────────────────
@router.get("/profile")
def portal_profile(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    ec = db.query(EmergencyContact).filter(EmergencyContact.employee_id == emp.id).first()
    assets = db.query(EmployeeAsset).filter(
        EmployeeAsset.employee_id == emp.id,
        EmployeeAsset.status == "Allocated",
    ).all()
    return {
        "id": emp.id,
        "employee_id": emp.employee_id,
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "full_name": emp.full_name,
        "email": emp.email,
        "mobile": emp.mobile,
        "gender": emp.gender,
        "date_of_birth": str(emp.date_of_birth) if emp.date_of_birth else None,
        "date_of_joining": str(emp.date_of_joining) if emp.date_of_joining else None,
        "status": emp.status,
        "employment_type": emp.employment_type,
        "department": emp.department_rel.name if emp.department_rel else None,
        "designation": emp.designation_rel.name if emp.designation_rel else None,
        "reporting_manager": emp.reports_to_rel.full_name if getattr(emp, "reports_to_rel", None) else None,
        "notice_period_days": emp.notice_period_days,
        "probation_period_days": emp.probation_period_days,
        "office_address": emp.office_address,
        "residential_address": emp.residential_address,
        "bank_name": emp.bank_name,
        "bank_account_no": emp.bank_account_no,
        "bank_ifsc": emp.bank_ifsc,
        "bank_branch": emp.bank_branch,
        "aadhar_no": emp.aadhar_no,
        "pan_no": emp.pan_no,
        "basic_salary": emp.basic_salary,
        "hra_percent": emp.hra_percent if emp.hra_percent is not None else 40.0,
        "special_allowance": emp.special_allowance or 0.0,
        "pf_applicable": bool(emp.pf_applicable if emp.pf_applicable is not None else 1),
        "esi_applicable": bool(emp.esi_applicable if emp.esi_applicable is not None else 1),
        "pt_state": emp.pt_state or "Karnataka",
        "profile_photo": emp.profile_photo,
        "education": emp.education or [],
        "experience": emp.experience or [],
        "_ec": {
            "name": ec.name,
            "relationship_type": ec.relationship_type,
            "phone": ec.phone,
            "email": ec.email,
        } if ec else None,
        "_assets": [
            {
                "id": a.id,
                "asset_name": a.asset_name,
                "asset_type": a.asset_type,
                "serial_number": a.serial_number,
                "allocated_date": str(a.allocated_date) if a.allocated_date else None,
                "condition": a.condition,
                "status": a.status,
            }
            for a in assets
        ],
    }


# ── Leaves ─────────────────────────────────────────────────────
@router.get("/leaves")
def portal_leaves(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    leaves = db.query(LeaveApplication).filter(
        LeaveApplication.employee_id == emp.id
    ).order_by(LeaveApplication.from_date.desc()).all()
    return [
        {
            "id": lv.id,
            "leave_type": lv.leave_type_rel.name if lv.leave_type_rel else "",
            "from_date": str(lv.from_date),
            "to_date": str(lv.to_date),
            "total_days": lv.total_days,
            "half_day": lv.half_day,
            "leave_category": lv.leave_category or "Planned",
            "status": lv.status,
            "reason": lv.reason,
            "cancellation_reason": lv.cancellation_reason,
            "pending_from_date": str(lv.pending_from_date) if lv.pending_from_date else None,
            "pending_to_date": str(lv.pending_to_date) if lv.pending_to_date else None,
            "pending_total_days": lv.pending_total_days,
            "edit_reason": lv.edit_reason,
        }
        for lv in leaves
    ]


class PortalLeaveIn(BaseModel):
    leave_type_id: int
    from_date: date
    to_date: date
    reason: Optional[str] = None
    half_day: bool = False
    leave_category: str = "Planned"


def _leave_type_to_work_mode(leave_type_name: str, half_day: bool) -> str:
    """Map a leave type name to the closest WorkModeEntry work_mode value."""
    if half_day:
        return "HALF DAY LEAVE"
    name = (leave_type_name or "").lower()
    if "sick" in name or "medical" in name:
        return "SICK LEAVE"
    if "casual" in name:
        return "CASUAL LEAVE"
    return "PLANNED LEAVE"


def _sync_work_mode_for_leave(leave, db: Session):
    """Create one WorkModeEntry per calendar day covered by the leave."""
    from backend.models.work_mode_entry import WorkModeEntry
    leave_type_name = leave.leave_type_rel.name if leave.leave_type_rel else ""
    work_mode = _leave_type_to_work_mode(leave_type_name, leave.half_day)
    duration = "HALF-DAY (Morning)" if leave.half_day else "FULL-DAY"
    current = leave.from_date
    while current <= leave.to_date:
        existing = db.query(WorkModeEntry).filter(
            WorkModeEntry.employee_id == leave.employee_id,
            WorkModeEntry.entry_date == current,
            WorkModeEntry.leave_id == leave.id,
        ).first()
        if not existing:
            db.add(WorkModeEntry(
                employee_id=leave.employee_id,
                leave_id=leave.id,
                entry_date=current,
                work_mode=work_mode,
                duration=duration,
                reason=leave.reason or leave_type_name,
                status="Pending",
            ))
        current += timedelta(days=1)
    db.commit()


def _remove_work_mode_for_leave(leave_id: int, db: Session):
    """Delete all WorkModeEntry rows that were auto-created from this leave."""
    from backend.models.work_mode_entry import WorkModeEntry
    db.query(WorkModeEntry).filter(WorkModeEntry.leave_id == leave_id).delete()
    db.commit()


@router.post("/leaves")
def portal_apply_leave(data: PortalLeaveIn, request: Request, db: Session = Depends(get_db)):
    from backend.services import notification_service as _notif
    from backend.approval_utils import get_requester_role
    from backend.models.leave import LeaveType

    emp = _get_employee(request, db)
    delta = (data.to_date - data.from_date).days + 1
    total = 0.5 if data.half_day else float(delta)
    leave = LeaveApplication(
        employee_id=emp.id,
        leave_type_id=data.leave_type_id,
        from_date=data.from_date,
        to_date=data.to_date,
        half_day=data.half_day,
        leave_category=data.leave_category,
        reason=data.reason,
        total_days=total,
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    _sync_work_mode_for_leave(leave, db)

    # ── In-app notifications + email ──────────────────────────────
    try:
        requester_role = get_requester_role(db, emp.id)
        lt = db.query(LeaveType).filter(LeaveType.id == data.leave_type_id).first()
        leave_type_name = lt.name if lt else "Leave"
        emp_name   = emp.full_name or "An employee"
        days_label = f"{total:.1f} day{'s' if total != 1 else ''}"
        notif_msg  = f"{emp_name} applied for {days_label} {leave_type_name} ({leave.from_date} – {leave.to_date})."

        if requester_role == "HR":
            # HR leave → notify CEO only (no CC)
            _notif.push_to_role(
                db, "CEO", "leave", f"Leave Request — {emp_name}",
                notif_msg,
                entity_id=leave.id, notif_type="approval_request", action="leaves", priority="high",
            )
        else:
            # Employee leave → HR (TO) + CEO (CC)
            _notif.push_to_role(
                db, "HR", "leave", f"Leave Request — {emp_name}",
                notif_msg,
                entity_id=leave.id, notif_type="approval_request", action="leaves", priority="high",
            )
            _notif.push_to_role(
                db, "CEO", "leave", f"[CC] Leave Request — {emp_name}",
                notif_msg,
                entity_id=leave.id, notif_type="info", action="leaves", priority="low", is_cc=True,
            )
        db.commit()

        # Email
        _notif.fire_leave_request_emails(
            db,
            employee_name=emp_name,
            leave_type=leave_type_name,
            from_date=leave.from_date,
            to_date=leave.to_date,
            days=total,
            reason=data.reason or "",
            requester_role=requester_role,
            employee_email=emp.email or "",
        )
    except Exception:
        pass

    return {"id": leave.id, "total_days": leave.total_days}


@router.delete("/leaves/{leave_id}")
def portal_cancel_leave(leave_id: int, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    leave = db.query(LeaveApplication).filter(
        LeaveApplication.id == leave_id,
        LeaveApplication.employee_id == emp.id,
    ).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    if leave.status != "Pending":
        raise HTTPException(400, "Only pending leaves can be cancelled")
    _remove_work_mode_for_leave(leave_id, db)
    db.delete(leave)
    db.commit()
    return {"ok": True}


class CancelRequestIn(BaseModel):
    reason: str


@router.post("/leaves/{leave_id}/cancel-request")
def portal_request_leave_cancellation(leave_id: int, data: CancelRequestIn, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    leave = db.query(LeaveApplication).filter(
        LeaveApplication.id == leave_id,
        LeaveApplication.employee_id == emp.id,
    ).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    if leave.status != "Approved":
        raise HTTPException(400, "Only approved leaves can request cancellation")
    if not data.reason or not data.reason.strip():
        raise HTTPException(400, "Reason is required")
    leave.status = "Cancellation Requested"
    leave.cancellation_reason = data.reason.strip()
    db.commit()
    return {"ok": True}


class EditRequestIn(BaseModel):
    from_date: date
    to_date: date
    reason: str


@router.post("/leaves/{leave_id}/edit-request")
def portal_request_leave_edit(leave_id: int, data: EditRequestIn, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    leave = db.query(LeaveApplication).filter(
        LeaveApplication.id == leave_id,
        LeaveApplication.employee_id == emp.id,
    ).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    if leave.status != "Approved":
        raise HTTPException(400, "Only approved leaves can request a date change")
    if data.from_date > data.to_date:
        raise HTTPException(400, "From date must be before to date")
    if not data.reason or not data.reason.strip():
        raise HTTPException(400, "Reason is required")
    delta = (data.to_date - data.from_date).days + 1
    pending_days = 0.5 if leave.half_day else float(delta)
    leave.pending_from_date = data.from_date
    leave.pending_to_date = data.to_date
    leave.pending_total_days = pending_days
    leave.edit_reason = data.reason.strip()
    leave.status = "Edit Requested"
    db.commit()
    return {"ok": True}


# ── Attendance ─────────────────────────────────────────────────
@router.get("/attendance")
def portal_attendance(request: Request, db: Session = Depends(get_db),
                      year: Optional[int] = None, month: Optional[int] = None):
    emp = _get_employee(request, db)
    q = db.query(Attendance).filter(Attendance.employee_id == emp.id)
    if year and month:
        from sqlalchemy import extract
        q = q.filter(extract('year', Attendance.date) == year,
                     extract('month', Attendance.date) == month)
    else:
        q = q.order_by(Attendance.date.desc()).limit(90)
    records = q.order_by(Attendance.date.desc()).all()
    return [
        {"id": a.id, "date": str(a.date), "status": a.status,
         "in_time": a.in_time, "out_time": a.out_time, "working_hours": a.working_hours}
        for a in records
    ]


# ── Salary Slips ───────────────────────────────────────────────
@router.get("/salary-slips")
def portal_salary_slips(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    slips = db.query(SalarySlip).filter(
        SalarySlip.employee_id == emp.id
    ).order_by(SalarySlip.year.desc(), SalarySlip.month.desc()).all()
    return [
        {"id": s.id, "slip_id": s.slip_id, "month": s.month, "year": s.year,
         "gross_pay": s.gross_pay, "total_deduction": s.total_deduction,
         "net_pay": s.net_pay, "status": s.status}
        for s in slips
    ]


@router.get("/salary-slips/{slip_id}")
def portal_get_slip(slip_id: int, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    slip = db.query(SalarySlip).filter(
        SalarySlip.id == slip_id,
        SalarySlip.employee_id == emp.id,
    ).first()
    if not slip:
        raise HTTPException(404, "Salary slip not found")
    return {
        "id": slip.id, "slip_id": slip.slip_id,
        "employee_id": emp.employee_id,
        "employee_name": emp.full_name,
        "designation": emp.designation_rel.name if emp.designation_rel else "",
        "department": emp.department_rel.name if emp.department_rel else "",
        "month": slip.month, "year": slip.year,
        "gross_pay": slip.gross_pay, "total_deduction": slip.total_deduction,
        "net_pay": slip.net_pay, "status": slip.status,
        "earnings": slip.earnings, "deductions": slip.deductions,
    }


# ── Appraisals ─────────────────────────────────────────────────
@router.get("/appraisals")
def portal_appraisals(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    rows = db.query(Appraisal).filter(
        Appraisal.employee_id == emp.id
    ).order_by(Appraisal.created_at.desc()).all()
    return [{
        "id": a.id,
        "period": a.period,
        "status": a.status,
        "goals": a.goals or [],
        "self_eval":     a.self_eval,
        "manager_eval":  a.manager_eval,
        "business_eval": a.business_eval,
        "biz_head_eval": a.biz_head_eval,
        "self_score":     a.self_score,
        "manager_score":  a.manager_score,
        "business_score": a.business_score,
        "biz_head_score": a.biz_head_score,
        "total_score": a.total_score,
        "perf_documents": a.perf_documents or [],
        "created_at": str(a.created_at)[:10] if a.created_at else "",
    } for a in rows]


class SelfEvalIn(BaseModel):
    scores: list           # [{idx, score, comments}]
    overall_comments: str = ""


@router.put("/appraisals/{appraisal_id}/self-eval", status_code=200)
def portal_self_eval(appraisal_id: int, data: SelfEvalIn, request: Request, db: Session = Depends(get_db)):
    from backend.routers.appraisals import _weighted_score, _total
    emp = _get_employee(request, db)
    a = db.query(Appraisal).filter(
        Appraisal.id == appraisal_id,
        Appraisal.employee_id == emp.id,
    ).first()
    if not a:
        raise HTTPException(404, "Appraisal not found")
    if a.status != "Goals Set":
        raise HTTPException(400, "Self evaluation already submitted")
    from datetime import datetime as _dt
    a.self_eval = {
        "scores": data.scores,
        "overall_comments": data.overall_comments,
        "submitted_at": _dt.utcnow().isoformat(),
    }
    a.self_score = _weighted_score(a.goals or [], a.self_eval)
    a.status = "Self Evaluated"
    a.total_score = _total(a)
    db.commit()
    return {"ok": True}


@router.post("/appraisals/{appraisal_id}/documents/upload")
async def portal_upload_perf_doc(
    appraisal_id: int,
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
):
    emp = _get_employee(request, db)
    a = db.query(Appraisal).filter(
        Appraisal.id == appraisal_id,
        Appraisal.employee_id == emp.id,
    ).first()
    if not a:
        raise HTTPException(404, "Appraisal not found")
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "doc", "docx", "jpg", "jpeg", "png", "xlsx", "pptx"):
        raise HTTPException(400, "Unsupported file type")
    fname = f"appraisal_{appraisal_id}_{int(time.time())}.{ext}"
    url = storage.upload_file(await file.read(), "documents", fname)
    docs = list(a.perf_documents or [])
    docs.append({
        "id": str(uuid.uuid4())[:8],
        "name": file.filename,
        "url": url,
        "uploaded_by": emp.full_name,
        "uploaded_at": _datetime.utcnow().isoformat(),
        "type": ext.upper(),
    })
    a.perf_documents = docs
    db.commit()
    return {"ok": True}


@router.delete("/appraisals/{appraisal_id}/documents/{doc_id}")
def portal_delete_perf_doc(
    appraisal_id: int,
    doc_id: str,
    request: Request,
    db: Session = Depends(get_db),
):
    emp = _get_employee(request, db)
    a = db.query(Appraisal).filter(
        Appraisal.id == appraisal_id,
        Appraisal.employee_id == emp.id,
    ).first()
    if not a:
        raise HTTPException(404, "Appraisal not found")
    a.perf_documents = [d for d in (a.perf_documents or []) if d.get("id") != doc_id]
    db.commit()
    return {"ok": True}


# ── Team leaves for a month (read-only, visible to all employees) ──
@router.get("/team-leaves")
def portal_team_leaves(month: str, request: Request, db: Session = Depends(get_db)):
    """Return all approved/pending leaves for every employee in the given month (YYYY-MM)."""
    _get_employee(request, db)  # auth check only
    try:
        year, mon = map(int, month.split("-"))
    except Exception:
        raise HTTPException(400, "Use YYYY-MM format")
    from calendar import monthrange
    last_day = monthrange(year, mon)[1]
    start = _date(year, mon, 1)
    end   = _date(year, mon, last_day)
    leaves = (
        db.query(LeaveApplication)
        .join(Employee, LeaveApplication.employee_id == Employee.id)
        .filter(
            Employee.status == "Active",
            LeaveApplication.status.in_(["Pending", "Approved"]),
            LeaveApplication.from_date <= end,
            LeaveApplication.to_date   >= start,
        )
        .order_by(LeaveApplication.from_date.asc())
        .all()
    )
    return [
        {
            "id":             lv.id,
            "employee_name":  lv.employee_rel.full_name if lv.employee_rel else "",
            "profile_photo":  lv.employee_rel.profile_photo if lv.employee_rel else None,
            "leave_type":     lv.leave_type_rel.name if lv.leave_type_rel else "",
            "from_date":      str(lv.from_date),
            "to_date":        str(lv.to_date),
            "total_days":     lv.total_days,
            "half_day":       lv.half_day,
            "leave_category": lv.leave_category or "Planned",
            "status":         lv.status,
            "reason":         lv.reason,
        }
        for lv in leaves
    ]


# ── Leave Types (for apply form) ───────────────────────────────
@router.get("/leave-types")
def portal_leave_types(request: Request, db: Session = Depends(get_db)):
    _get_employee(request, db)  # auth check
    return db.query(LeaveType).all()


# ── Leave Balances (for employee dashboard + apply form) ────────
@router.get("/leave-balances")
def portal_leave_balances(request: Request, db: Session = Depends(get_db)):
    from backend.models.hrm import LeaveBalance
    emp = _get_employee(request, db)
    year = _datetime.utcnow().year
    balances = (
        db.query(LeaveBalance)
        .filter(LeaveBalance.employee_id == emp.id, LeaveBalance.year == year)
        .all()
    )
    return [
        {
            "leave_type_id": b.leave_type_id,
            "leave_type":    b.leave_type_rel.name if b.leave_type_rel else "",
            "allocated":     b.allocated,
            "used":          b.used,
            "carried_forward": b.carried_forward,
            "available":     round(b.allocated + b.carried_forward - b.used, 2),
        }
        for b in balances
    ]


# ── Expenses ───────────────────────────────────────────────────

class PortalExpenseIn(BaseModel):
    claim_date: date
    expense_type: str
    amount: float
    description: Optional[str] = None


@router.get("/expenses")
def portal_expenses(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    expenses = db.query(ExpenseClaim).filter(
        ExpenseClaim.employee_id == emp.id
    ).order_by(ExpenseClaim.claim_date.desc()).all()
    return [
        {
            "id": e.id,
            "claim_date": str(e.claim_date),
            "expense_type": e.expense_type,
            "amount": e.amount,
            "description": e.description,
            "status": e.status,
            "remarks": e.remarks,
        }
        for e in expenses
    ]


@router.post("/expenses", status_code=201)
def portal_submit_expense(data: PortalExpenseIn, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    expense = ExpenseClaim(
        employee_id=emp.id,
        claim_date=data.claim_date,
        expense_type=data.expense_type,
        amount=data.amount,
        description=data.description,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {"id": expense.id, "ok": True}


# ── Profile Photo Upload ────────────────────────────────────────
@router.post("/profile/photo")
async def upload_portal_photo(request: Request, file: UploadFile = File(...), db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        raise HTTPException(400, "Only JPG, PNG, WebP or GIF allowed")
    fname = f"emp_{emp.id}_{int(time.time())}.{ext}"
    url = storage.upload_file(await file.read(), "profiles", fname)
    emp.profile_photo = url
    db.commit()
    return {"profile_photo": url}


# ── Profile self-edit ──────────────────────────────────────────

class ProfileUpdateIn(BaseModel):
    email: Optional[str] = None
    mobile: Optional[str] = None
    residential_address: Optional[str] = None


@router.patch("/profile")
def update_portal_profile(data: ProfileUpdateIn, request: Request, db: Session = Depends(get_db)):
    from backend.models.profile_update_log import ProfileUpdateLog
    emp = _get_employee(request, db)

    LABELS = {"email": "Email", "mobile": "Mobile", "residential_address": "Residential Address"}
    changes = {}

    if data.email is not None:
        new_val = data.email.strip()
        if new_val and new_val != emp.email:
            changes["email"] = {"label": LABELS["email"], "old": emp.email, "new": new_val}
            emp.email = new_val

    if data.mobile is not None:
        new_val = data.mobile.strip() or None
        if new_val != emp.mobile:
            changes["mobile"] = {"label": LABELS["mobile"], "old": emp.mobile, "new": new_val}
            emp.mobile = new_val

    if data.residential_address is not None:
        new_val = data.residential_address.strip() or None
        if new_val != emp.residential_address:
            changes["residential_address"] = {
                "label": LABELS["residential_address"],
                "old": emp.residential_address,
                "new": new_val,
            }
            emp.residential_address = new_val

    if changes:
        db.add(ProfileUpdateLog(employee_id=emp.id, changes=changes))

    db.commit()
    return {"ok": True, "changed": list(changes.keys())}


# ── Document Requests ──────────────────────────────────────────

from backend.models.document_request import DocumentRequest

DOC_TYPES = [
    "Salary Certificate",
    "Experience Letter",
    "Offer Letter",
    "Relieving Letter",
    "No Objection Certificate (NOC)",
    "Bank Verification Letter",
    "Payslip Copy",
    "Other",
]


class DocRequestIn(BaseModel):
    doc_type: str
    remarks: Optional[str] = None


@router.get("/documents")
def list_doc_requests(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    rows = db.query(DocumentRequest).filter(
        DocumentRequest.employee_id == emp.id
    ).order_by(DocumentRequest.requested_at.desc()).all()
    return [
        {
            "id": r.id,
            "doc_type": r.doc_type,
            "remarks": r.remarks,
            "status": r.status,
            "requested_at": str(r.requested_at)[:10],
            "fulfilled_at": str(r.fulfilled_at)[:10] if r.fulfilled_at else None,
            "file_url": r.file_url,
            "file_name": r.file_name,
        }
        for r in rows
    ]


@router.post("/documents", status_code=201)
def create_doc_request(data: DocRequestIn, request: Request, db: Session = Depends(get_db)):
    if data.doc_type not in DOC_TYPES:
        raise HTTPException(400, "Invalid document type")
    emp = _get_employee(request, db)
    req = DocumentRequest(
        employee_id=emp.id,
        doc_type=data.doc_type,
        remarks=data.remarks,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"id": req.id, "ok": True}


# ── Daily Status Sheet ─────────────────────────────────────────

from calendar import monthrange as _monthrange
from backend.models.status_entry import StatusEntry


def _status_dict(e: "StatusEntry", employee_name: str = "") -> dict:
    return {
        "id": e.id,
        "task_id": e.task_id,
        "entry_date": str(e.entry_date),
        "task_name": e.task_name,
        "due_date": str(e.due_date) if e.due_date else None,
        "status": e.status,
        "percent_complete": e.percent_complete or 0,
        "employee_name": employee_name,
    }


class StatusEntryUpdate(BaseModel):
    task_name: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    percent_complete: Optional[int] = None


@router.get("/status")
def portal_get_status(month: str, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    try:
        year, mon = map(int, month.split("-"))
    except Exception:
        raise HTTPException(400, "Use YYYY-MM format")

    today = date.today()
    start = date(year, mon, 1)
    end = date(year, mon, _monthrange(year, mon)[1])

    existing = {
        e.entry_date: e
        for e in db.query(StatusEntry).filter(
            StatusEntry.employee_id == emp.id,
            StatusEntry.entry_date >= start,
            StatusEntry.entry_date <= end,
        ).all()
    }

    # Auto-generate empty weekday rows for the full month (Mon-Fri only)
    is_past_or_current = (year < today.year) or (year == today.year and mon <= today.month)
    if is_past_or_current:
        limit_date = end
        task_counter = len(existing)  # reset to 0 each month so IDs start at 01
        d = start
        while d <= min(limit_date, end):
            if d.weekday() < 5 and d not in existing:
                task_counter += 1
                entry = StatusEntry(
                    employee_id=emp.id,
                    task_id=f"TSK{task_counter:03d}",
                    entry_date=d,
                    status="In Progress",
                    percent_complete=0,
                )
                db.add(entry)
                db.flush()
                existing[d] = entry
            d += timedelta(days=1)
        db.commit()

    entries = sorted(existing.values(), key=lambda e: e.entry_date)
    return [_status_dict(e, emp.full_name) for e in entries]


@router.put("/status/{entry_id}")
def portal_update_status_entry(
    entry_id: int, data: StatusEntryUpdate, request: Request, db: Session = Depends(get_db)
):
    emp = _get_employee(request, db)
    entry = db.query(StatusEntry).filter(
        StatusEntry.id == entry_id,
        StatusEntry.employee_id == emp.id,
    ).first()
    if not entry:
        raise HTTPException(404, "Entry not found")

    today = date.today()
    if entry.entry_date.year != today.year or entry.entry_date.month != today.month:
        raise HTTPException(403, "Only current month entries can be edited")

    if data.task_name is not None:
        entry.task_name = data.task_name
    if data.due_date is not None:
        entry.due_date = data.due_date
    if data.status is not None:
        entry.status = data.status
    if data.percent_complete is not None:
        entry.percent_complete = max(0, min(100, data.percent_complete))

    entry.updated_at = _datetime.utcnow()
    db.commit()
    db.refresh(entry)
    return _status_dict(entry, emp.full_name)


# ── Work Mode Sheet ────────────────────────────────────────────

from backend.models.work_mode_entry import WorkModeEntry

WORK_MODES = ["WFH", "PLANNED LEAVE", "SICK LEAVE", "CASUAL LEAVE", "HALF DAY LEAVE", "OTHER"]
DURATIONS  = ["FULL-DAY", "HALF-DAY (Morning)", "HALF-DAY (Afternoon)"]


def _wm_dict(e: "WorkModeEntry") -> dict:
    return {
        "id":         e.id,
        "entry_date": str(e.entry_date),
        "work_mode":  e.work_mode,
        "reason":     e.reason,
        "duration":   e.duration,
        "status":     e.status,
        "hr_remarks": e.hr_remarks,
        "created_at": str(e.created_at)[:10],
    }


class WorkModeIn(BaseModel):
    entry_date: date
    work_mode:  str
    reason:     Optional[str] = None
    duration:   str = "FULL-DAY"


@router.get("/work-mode")
def portal_list_work_mode(month: str, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    try:
        year, mon = map(int, month.split("-"))
    except Exception:
        raise HTTPException(400, "Use YYYY-MM format")
    from calendar import monthrange as _mr
    start = date(year, mon, 1)
    end   = date(year, mon, _mr(year, mon)[1])
    rows = (
        db.query(WorkModeEntry)
        .filter(WorkModeEntry.employee_id == emp.id,
                WorkModeEntry.entry_date >= start,
                WorkModeEntry.entry_date <= end)
        .order_by(WorkModeEntry.entry_date.asc())
        .all()
    )
    return [_wm_dict(r) for r in rows]


@router.post("/work-mode", status_code=201)
def portal_create_work_mode(data: WorkModeIn, request: Request, db: Session = Depends(get_db)):
    if data.work_mode not in WORK_MODES:
        raise HTTPException(400, "Invalid work mode type")
    if data.duration not in DURATIONS:
        raise HTTPException(400, "Invalid duration")
    emp = _get_employee(request, db)
    entry = WorkModeEntry(
        employee_id=emp.id,
        entry_date=data.entry_date,
        work_mode=data.work_mode,
        reason=data.reason,
        duration=data.duration,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return _wm_dict(entry)


@router.delete("/work-mode/{entry_id}")
def portal_delete_work_mode(entry_id: int, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    entry = db.query(WorkModeEntry).filter(
        WorkModeEntry.id == entry_id,
        WorkModeEntry.employee_id == emp.id,
    ).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    if entry.status != "Pending":
        raise HTTPException(400, "Only pending entries can be cancelled")
    db.delete(entry)
    db.commit()
    return {"ok": True}


# ── Edit / Correction Requests ─────────────────────────────────

from backend.models.edit_request import EditRequest
from datetime import datetime as _now_dt

EDIT_REQUEST_TYPES = [
    "Leave Entry",
    "Status Sheet",
    "Attendance",
    "Other",
]


class EditRequestIn(BaseModel):
    request_type: str
    target_date: date
    description: str
    reason: str


@router.get("/edit-requests")
def portal_list_edit_requests(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    rows = db.query(EditRequest).filter(
        EditRequest.employee_id == emp.id
    ).order_by(EditRequest.created_at.desc()).all()
    return [
        {
            "id":           r.id,
            "request_type": r.request_type,
            "target_date":  str(r.target_date),
            "description":  r.description,
            "reason":       r.reason,
            "status":       r.status,
            "hr_remarks":   r.hr_remarks,
            "created_at":   str(r.created_at)[:10],
            "resolved_at":  str(r.resolved_at)[:10] if r.resolved_at else None,
        }
        for r in rows
    ]


@router.post("/edit-requests", status_code=201)
def portal_create_edit_request(data: EditRequestIn, request: Request, db: Session = Depends(get_db)):
    if data.request_type not in EDIT_REQUEST_TYPES:
        raise HTTPException(400, f"request_type must be one of: {', '.join(EDIT_REQUEST_TYPES)}")
    emp = _get_employee(request, db)
    req = EditRequest(
        employee_id=emp.id,
        request_type=data.request_type,
        target_date=data.target_date,
        description=data.description,
        reason=data.reason,
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"id": req.id, "ok": True}


# ── Resignation ────────────────────────────────────────────────

from backend.models.resignation import Resignation
from backend.models.notice_period_config import NoticePeriodConfig, DEFAULT_RULES


@router.get("/notice-period-rules")
def portal_notice_period_rules(request: Request, db: Session = Depends(get_db)):
    """Returns the configured notice period rules — readable by any authenticated user."""
    _get_user(request, db)
    cfg = db.query(NoticePeriodConfig).filter(NoticePeriodConfig.id == 1).first()
    return cfg.rules if cfg else DEFAULT_RULES

class ResignationIn(BaseModel):
    reason: str
    last_working_date: Optional[date] = None
    notice_period_days: Optional[int] = None


@router.get("/resignation")
def portal_get_resignation(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    r = db.query(Resignation).filter(
        Resignation.employee_id == emp.id
    ).order_by(Resignation.created_at.desc()).first()
    if not r:
        return None
    return {
        "id": r.id,
        "reason": r.reason,
        "last_working_date": str(r.last_working_date) if r.last_working_date else None,
        "notice_period_days": r.notice_period_days,
        "status": r.status,
        "hr_remarks": r.hr_remarks,
        "approved_last_working_date": str(r.approved_last_working_date) if r.approved_last_working_date else None,
        "created_at": str(r.created_at)[:10] if r.created_at else None,
        "actioned_at": str(r.actioned_at)[:10] if r.actioned_at else None,
    }


@router.post("/resignation", status_code=201)
def portal_submit_resignation(data: ResignationIn, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    existing = db.query(Resignation).filter(
        Resignation.employee_id == emp.id,
        Resignation.status == "Pending",
    ).first()
    if existing:
        raise HTTPException(400, "You already have a pending resignation request")
    cfg = db.query(NoticePeriodConfig).filter(NoticePeriodConfig.id == 1).first()
    rules = cfg.rules if cfg else DEFAULT_RULES
    emp_type = emp.employment_type or ''
    notice_days = rules.get(emp_type) or rules.get('Part-time', 15)
    r = Resignation(
        employee_id=emp.id,
        reason=data.reason.strip(),
        last_working_date=data.last_working_date,
        notice_period_days=notice_days,
    )
    db.add(r)
    db.commit()
    db.refresh(r)

    # Notifications + email
    from backend.services import notification_service as _notif
    from backend.approval_utils import get_requester_role
    from backend.utils.email import send_email, new_resignation_email
    from backend.models.auth import User as _User

    emp_name      = emp.full_name or f"{emp.first_name} {emp.last_name or ''}".strip()
    requester_role = get_requester_role(db, emp.id)
    notif_msg = (f"{emp_name} has submitted a resignation. "
                 f"Last working day: {data.last_working_date}.")

    if requester_role == "HR":
        _notif.push_to_role(db, "CEO", "resignation", f"Resignation — {emp_name}", notif_msg,
                            entity_id=r.id, notif_type="approval_request", priority="high")
    else:
        _notif.push_to_role(db, "HR", "resignation", f"Resignation — {emp_name}", notif_msg,
                            entity_id=r.id, notif_type="approval_request", priority="high")
        _notif.push_to_role(db, "CEO", "resignation", f"[CC] Resignation — {emp_name}", notif_msg,
                            entity_id=r.id, notif_type="info", priority="low", is_cc=True)
    db.commit()

    # Email
    hr_users  = db.query(_User).filter(_User.role == "HR",  _User.is_active == True).all()  # noqa: E712
    ceo_users = db.query(_User).filter(_User.role == "CEO", _User.is_active == True).all()  # noqa: E712
    ceo_emails = [u.email for u in ceo_users if u.email]

    emp_email = emp.email or ""
    if requester_role == "HR":
        for u in ceo_users:
            if u.email:
                subj, html = new_resignation_email(u.full_name or u.email, emp_name,
                                                   data.last_working_date, data.reason or "", is_cc=False)
                send_email(u.email, subj, html, from_email=emp_email)
    else:
        cc_str = ",".join(ceo_emails)
        for u in hr_users:
            if u.email:
                subj, html = new_resignation_email(u.full_name or u.email, emp_name,
                                                   data.last_working_date, data.reason or "", is_cc=False)
                send_email(u.email, subj, html, cc=cc_str, from_email=emp_email)
        for u in ceo_users:
            if u.email:
                subj, html = new_resignation_email(u.full_name or u.email, emp_name,
                                                   data.last_working_date, data.reason or "", is_cc=True)
                send_email(u.email, subj, html, from_email=emp_email)

    return {"id": r.id, "ok": True}


@router.delete("/resignation/{resignation_id}")
def portal_withdraw_resignation(resignation_id: int, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    r = db.query(Resignation).filter(
        Resignation.id == resignation_id,
        Resignation.employee_id == emp.id,
        Resignation.status == "Pending",
    ).first()
    if not r:
        raise HTTPException(404, "No pending resignation found")
    r.status = "Withdrawn"
    db.commit()
    return {"ok": True}


# ── Start Journey (Employee Onboarding Self-Service) ───────────

import json as _json
from backend.models.onboarding import OnboardingChecklist

JOURNEY_STEPS = [
    # group, key, label, has_upload, has_fields
    ("Documents to Sign",    "offer_letter",       "Offer Letter",                       True,  True),
    ("Documents to Sign",    "employment_agreement","Employment Agreement",               True,  False),
    ("Documents to Sign",    "nda",                "NDA / Confidentiality Agreement",    True,  False),
    ("Documents to Sign",    "hr_policy",          "HR Policy Handbook",                 False, True),
    ("Documents to Sign",    "code_of_conduct",    "Code of Conduct",                    False, True),
    ("Documents to Sign",    "it_policy",          "IT Security Policy",                 False, True),
    ("Personal Documents",   "aadhaar",            "Aadhaar Card",                       True,  True),
    ("Personal Documents",   "pan",                "PAN Card",                           True,  True),
    ("Personal Documents",   "passport",           "Passport Copy",                      True,  True),
    ("Personal Documents",   "education_certs",    "Educational Certificates",           True,  False),
    ("Personal Documents",   "prev_employment",    "Previous Employment Letter",         True,  False),
    ("Personal Documents",   "salary_slips",       "Last 3 Months Salary Slips",         True,  False),
    ("Bank & Statutory",     "bank_details",       "Bank Account Details",               False, True),
    ("Bank & Statutory",     "pf_form",            "PF Nomination Form",                 True,  False),
    ("Personal Information", "emergency_contact",  "Emergency Contact Details",          False, True),
    ("Personal Information", "personal_info",      "Personal & Address Details",         False, True),
]


def _get_journey(emp_id: int, db: Session):
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == emp_id).first()
    if not checklist:
        return {}
    payload = _json.loads(checklist.items)
    return payload.get("__journey__", {})


def _save_journey(emp_id: int, journey: dict, db: Session):
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == emp_id).first()
    if not checklist:
        checklist = OnboardingChecklist(employee_id=emp_id, items=_json.dumps({"__journey__": journey}))
        db.add(checklist)
    else:
        payload = _json.loads(checklist.items)
        payload["__journey__"] = journey
        checklist.items = _json.dumps(payload)
    db.commit()


@router.get("/start-journey")
def get_start_journey(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    journey = _get_journey(emp.id, db)
    steps = []
    for group, key, label, has_upload, has_fields in JOURNEY_STEPS:
        step_data = journey.get(key, {})
        steps.append({
            "group": group,
            "key": key,
            "label": label,
            "has_upload": has_upload,
            "has_fields": has_fields,
            "status": step_data.get("status", "pending"),
            "data": step_data.get("data", {}),
            "file_url": step_data.get("file_url"),
            "file_name": step_data.get("file_name"),
            "submitted_at": step_data.get("submitted_at"),
        })
    completed = sum(1 for s in steps if s["status"] in ("submitted", "verified"))
    return {
        "employee": {
            "id": emp.id,
            "full_name": emp.full_name,
            "employee_id": emp.employee_id,
            "designation": emp.designation_rel.name if emp.designation_rel else None,
            "department": emp.department_rel.name if emp.department_rel else None,
            "date_of_joining": str(emp.date_of_joining) if emp.date_of_joining else None,
            "profile_photo": emp.profile_photo,
        },
        "steps": steps,
        "completed": completed,
        "total": len(steps),
    }


class JourneyStepData(BaseModel):
    key: str
    data: dict = {}


@router.put("/start-journey/step")
def save_journey_step(body: JourneyStepData, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    journey = _get_journey(emp.id, db)
    step = journey.get(body.key, {})
    step["data"] = body.data
    step["status"] = "submitted"
    step["submitted_at"] = _datetime.utcnow().isoformat()
    journey[body.key] = step
    _save_journey(emp.id, journey, db)
    return {"ok": True, "status": "submitted"}


@router.post("/start-journey/upload/{step_key}")
async def upload_journey_doc(step_key: str, file: UploadFile = File(...), request: Request = None, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "jpg", "jpeg", "png", "doc", "docx"):
        raise HTTPException(400, "Allowed: PDF, JPG, PNG, DOC, DOCX")
    fname = f"journey_{emp.id}_{step_key}_{int(time.time())}.{ext}"
    url = storage.upload_file(await file.read(), "documents", fname)
    journey = _get_journey(emp.id, db)
    step = journey.get(step_key, {})
    step["file_url"] = url
    step["file_name"] = file.filename
    step["status"] = "submitted"
    step["submitted_at"] = _datetime.utcnow().isoformat()
    journey[step_key] = step
    _save_journey(emp.id, journey, db)
    return {"ok": True, "file_url": url, "file_name": file.filename}


@router.get("/start-journey/download/{step_key}")
def download_journey_template(step_key: str, request: Request, db: Session = Depends(get_db)):
    """Return a downloadable template — serve HR's uploaded file if available, else auto-generate."""
    from fastapi.responses import HTMLResponse, RedirectResponse
    from backend.models.onboarding import OnboardingChecklist
    emp = _get_employee(request, db)

    # ── Check if HR uploaded a custom document for this employee ──
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == emp.id).first()
    if checklist:
        try:
            payload = _json.loads(checklist.items)
            hr_docs = payload.get("__hr_docs__", {})
            if step_key in hr_docs and hr_docs[step_key].get("file_url"):
                return RedirectResponse(url=hr_docs[step_key]["file_url"], status_code=302)
        except Exception:
            pass
    if step_key == "offer_letter":
        html = f"""<!DOCTYPE html><html><head><title>Offer Letter</title>
<style>body{{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:40px;border:1px solid #ccc}}
h1{{color:#0D1F4E}}p{{line-height:1.8}}.sig{{margin-top:60px}}</style></head>
<body>
<h2>ARTECH SOLUTIONS</h2>
<h1>Offer Letter</h1>
<p>Date: {_datetime.utcnow().strftime('%d %B %Y')}</p>
<p>Dear <strong>{emp.full_name}</strong>,</p>
<p>We are pleased to offer you the position of <strong>{emp.designation_rel.name if emp.designation_rel else 'Associate'}</strong>
in our <strong>{emp.department_rel.name if emp.department_rel else ''}</strong> department,
effective from <strong>{emp.date_of_joining}</strong>.</p>
<p>This offer is subject to the terms and conditions of employment as communicated by HR.
Please sign and return this letter as your acceptance.</p>
<p>We look forward to having you on board.</p>
<p>Warm regards,<br><strong>HR Team</strong><br>Artech Solutions</p>
<div class="sig">
<p>I, <strong>{emp.full_name}</strong>, accept the terms of this offer.</p>
<p>Signature: _____________________________ &nbsp;&nbsp;&nbsp; Date: _______________</p>
</div></body></html>"""
        return HTMLResponse(content=html, headers={"Content-Disposition": f"attachment; filename=Offer_Letter_{emp.employee_id}.html"})
    elif step_key == "pf_form":
        html = f"""<!DOCTYPE html><html><head><title>PF Nomination Form</title>
<style>body{{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:40px;border:1px solid #ccc}}table{{width:100%;border-collapse:collapse}}td,th{{border:1px solid #ccc;padding:8px}}</style></head>
<body><h2>PF Nomination Form - Form 2</h2>
<p>Employee Name: {emp.full_name} &nbsp;&nbsp; Employee ID: {emp.employee_id}</p>
<table><tr><th>Nominee Name</th><th>Relationship</th><th>Date of Birth</th><th>Share %</th></tr>
<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></table>
<p style="margin-top:40px">Signature: _____________________________ Date: _______________</p>
</body></html>"""
        return HTMLResponse(content=html, headers={"Content-Disposition": "attachment; filename=PF_Nomination_Form.html"})

    elif step_key == "employment_agreement":
        html = f"""<!DOCTYPE html><html><head><title>Employment Agreement</title>
<style>body{{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:40px;border:1px solid #ccc}}h1{{color:#0D1F4E}}p{{line-height:1.8}}ol li{{margin-bottom:10px}}</style></head>
<body><h2>ARTECH SOLUTIONS</h2><h1>Employment Agreement</h1>
<p>This Employment Agreement is entered into between <strong>Artech Solutions</strong> and <strong>{emp.full_name}</strong> (Employee ID: {emp.employee_id}), effective <strong>{emp.date_of_joining}</strong>.</p>
<ol>
<li><b>Position:</b> {emp.designation_rel.name if emp.designation_rel else 'Associate'} in {emp.department_rel.name if emp.department_rel else 'the Company'}.</li>
<li><b>Employment Type:</b> {emp.employment_type or 'Full-time'}. The employment is subject to a probation period as communicated by HR.</li>
<li><b>Confidentiality:</b> The Employee agrees to maintain strict confidentiality of all proprietary information.</li>
<li><b>Compliance:</b> The Employee agrees to comply with all company policies, codes of conduct, and applicable laws.</li>
<li><b>Termination:</b> Either party may terminate this agreement as per the notice period policy communicated separately.</li>
<li><b>Intellectual Property:</b> All work produced during employment remains the property of Artech Solutions.</li>
</ol>
<p>By signing below, the Employee acknowledges and agrees to the terms of this Employment Agreement.</p>
<div style="margin-top:50px;display:grid;grid-template-columns:1fr 1fr;gap:40px">
<div><p>Employee Signature:</p><p>_______________________</p><p>{emp.full_name}</p><p>Date: _______________</p></div>
<div><p>HR Authorized Signatory:</p><p>_______________________</p><p>HR Manager, Artech Solutions</p><p>Date: _______________</p></div>
</div></body></html>"""
        return HTMLResponse(content=html, headers={"Content-Disposition": f"attachment; filename=Employment_Agreement_{emp.employee_id}.html"})

    elif step_key == "nda":
        html = f"""<!DOCTYPE html><html><head><title>NDA</title>
<style>body{{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:40px;border:1px solid #ccc}}h1{{color:#0D1F4E}}p{{line-height:1.8}}</style></head>
<body><h2>ARTECH SOLUTIONS</h2><h1>Non-Disclosure Agreement (NDA)</h1>
<p>This Non-Disclosure and Confidentiality Agreement is made between <strong>Artech Solutions</strong> and <strong>{emp.full_name}</strong> (Employee ID: {emp.employee_id}), effective <strong>{emp.date_of_joining}</strong>.</p>
<p><b>1. Confidential Information:</b> The Employee shall not disclose, share, or use any proprietary, confidential, or sensitive information of Artech Solutions for any purpose other than the performance of their duties.</p>
<p><b>2. Scope:</b> This agreement covers all business strategies, client data, technical information, financial data, personnel records, and any other information marked or reasonably understood to be confidential.</p>
<p><b>3. Duration:</b> This obligation continues for a period of 2 (two) years after the termination of employment.</p>
<p><b>4. Exceptions:</b> Information that is publicly available or disclosed by court order is excluded.</p>
<p><b>5. Consequences of Breach:</b> Any breach of this agreement may result in disciplinary action, termination, and legal proceedings.</p>
<p>By signing below, the Employee acknowledges receipt of and agreement to this NDA.</p>
<div style="margin-top:50px">
<p>Employee Signature: _______________________&nbsp;&nbsp;&nbsp;&nbsp; Date: _______________</p>
<p>Name: {emp.full_name}</p>
</div></body></html>"""
        return HTMLResponse(content=html, headers={"Content-Disposition": f"attachment; filename=NDA_{emp.employee_id}.html"})

    elif step_key == "hr_policy":
        html = """<!DOCTYPE html><html><head><title>HR Policy Handbook</title>
<style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:40px;border:1px solid #ccc}h1,h2{color:#0D1F4E}p{line-height:1.8}</style></head>
<body><h2>ARTECH SOLUTIONS</h2><h1>HR Policy Handbook</h1>
<h2>1. Leave Policy</h2><p>Employees are entitled to earned leave, casual leave, and sick leave as per the schedule communicated at the time of joining. Leave must be applied in advance via the HRMS portal.</p>
<h2>2. Working Hours</h2><p>Standard working hours are 9:00 AM to 6:00 PM, Monday to Friday. Flexible arrangements may be agreed with the reporting manager.</p>
<h2>3. Code of Conduct</h2><p>Employees are expected to maintain professional conduct, respect colleagues, and uphold the values of Artech Solutions at all times.</p>
<h2>4. Anti-Harassment Policy</h2><p>Artech Solutions maintains a zero-tolerance policy toward any form of harassment, discrimination, or bullying in the workplace.</p>
<h2>5. Grievance Redressal</h2><p>Employees with grievances should first approach their reporting manager. Unresolved issues may be escalated to HR.</p>
<h2>6. Performance Reviews</h2><p>Performance appraisals are conducted annually. Continuous feedback is encouraged throughout the year.</p>
<p style="margin-top:40px"><i>Please read this handbook fully and acknowledge your understanding via the HRMS portal.</i></p></body></html>"""
        return HTMLResponse(content=html, headers={"Content-Disposition": "attachment; filename=HR_Policy_Handbook.html"})

    elif step_key == "code_of_conduct":
        html = """<!DOCTYPE html><html><head><title>Code of Conduct</title>
<style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:40px;border:1px solid #ccc}h1,h2{color:#0D1F4E}p{line-height:1.8}ul li{margin-bottom:8px}</style></head>
<body><h2>ARTECH SOLUTIONS</h2><h1>Code of Conduct</h1>
<p>All Artech Solutions employees are expected to uphold the following standards of professional conduct:</p>
<h2>Professional Behaviour</h2>
<ul><li>Treat every colleague, client, and partner with respect and dignity.</li>
<li>Maintain professionalism in communication — verbal, written, and digital.</li>
<li>Arrive on time and meet deadlines with commitment.</li></ul>
<h2>Integrity & Ethics</h2>
<ul><li>Act honestly and transparently in all business dealings.</li>
<li>Avoid conflicts of interest and disclose any that arise.</li>
<li>Do not accept bribes, gifts, or favours that could influence business decisions.</li></ul>
<h2>Data & Information Security</h2>
<ul><li>Handle all company and client data with utmost confidentiality.</li>
<li>Do not share login credentials or access company systems from unauthorized devices.</li></ul>
<h2>Consequences of Violation</h2>
<p>Violations of this Code of Conduct may result in disciplinary action up to and including termination.</p>
<p style="margin-top:40px"><i>By acknowledging this document, you confirm that you have read, understood, and agreed to abide by this Code of Conduct.</i></p></body></html>"""
        return HTMLResponse(content=html, headers={"Content-Disposition": "attachment; filename=Code_of_Conduct.html"})

    elif step_key == "it_policy":
        html = """<!DOCTYPE html><html><head><title>IT Security Policy</title>
<style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;padding:40px;border:1px solid #ccc}h1,h2{color:#0D1F4E}p{line-height:1.8}ul li{margin-bottom:8px}</style></head>
<body><h2>ARTECH SOLUTIONS</h2><h1>IT Security Policy</h1>
<h2>1. Password Policy</h2>
<ul><li>Use strong passwords (min. 8 chars, mix of letters, numbers, symbols).</li>
<li>Never share your password with anyone, including IT support.</li>
<li>Change passwords every 90 days.</li></ul>
<h2>2. Device & Access</h2>
<ul><li>Use only company-approved devices for work tasks.</li>
<li>Lock your computer when leaving your desk.</li>
<li>Do not install unauthorized software on company devices.</li></ul>
<h2>3. Internet & Email</h2>
<ul><li>Use the internet responsibly for work-related purposes.</li>
<li>Do not click on suspicious links or open unknown email attachments.</li>
<li>Report phishing attempts immediately to IT support.</li></ul>
<h2>4. Data Protection</h2>
<ul><li>Do not store sensitive data on personal drives or cloud accounts.</li>
<li>Encrypt files containing confidential information before sharing.</li></ul>
<h2>5. Incident Reporting</h2>
<p>Report any suspected security breach, lost device, or unauthorized access immediately to the IT team.</p>
<p style="margin-top:40px"><i>By acknowledging this policy, you confirm you have read and will comply with all IT security requirements.</i></p></body></html>"""
        return HTMLResponse(content=html, headers={"Content-Disposition": "attachment; filename=IT_Security_Policy.html"})

    raise HTTPException(404, "No template for this step")
