"""Employee Self-Service Portal — endpoints return data scoped to the logged-in employee."""
import os
import time
from fastapi import APIRouter, Request, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from fastapi import Depends
from pydantic import BaseModel
from datetime import date
from typing import Optional
from backend.database import get_db
from backend.models.employee import Employee
from backend.models.leave import LeaveApplication, LeaveType, Attendance
from backend.models.payroll import SalarySlip
from backend.models.appraisal import Appraisal
from backend.models.hrm import ExpenseClaim
from backend.auth_utils import decode_token
from backend.models.auth import User

router = APIRouter(prefix="/api/portal", tags=["Employee Portal"])


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
        "bank_name": emp.bank_name,
        "bank_account_no": emp.bank_account_no,
        "profile_photo": emp.profile_photo,
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
            "status": lv.status,
            "reason": lv.reason,
        }
        for lv in leaves
    ]


class PortalLeaveIn(BaseModel):
    leave_type_id: int
    from_date: date
    to_date: date
    reason: Optional[str] = None
    half_day: bool = False


@router.post("/leaves")
def portal_apply_leave(data: PortalLeaveIn, request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    delta = (data.to_date - data.from_date).days + 1
    total = 0.5 if data.half_day else float(delta)
    leave = LeaveApplication(
        employee_id=emp.id,
        leave_type_id=data.leave_type_id,
        from_date=data.from_date,
        to_date=data.to_date,
        half_day=data.half_day,
        reason=data.reason,
        total_days=total,
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
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
    db.delete(leave)
    db.commit()
    return {"ok": True}


# ── Attendance ─────────────────────────────────────────────────
@router.get("/attendance")
def portal_attendance(request: Request, db: Session = Depends(get_db)):
    emp = _get_employee(request, db)
    records = db.query(Attendance).filter(
        Attendance.employee_id == emp.id
    ).order_by(Attendance.date.desc()).limit(90).all()
    return [
        {"id": a.id, "date": str(a.date), "status": a.status,
         "in_time": a.in_time, "out_time": a.out_time, "hours": a.working_hours}
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
    appraisals = db.query(Appraisal).filter(
        Appraisal.employee_id == emp.id
    ).order_by(Appraisal.created_at.desc()).all()
    return [
        {"id": a.id, "period": a.period, "total_score": a.total_score,
         "status": a.status, "reviewer_comments": a.reviewer_comments,
         "goals": a.goals}
        for a in appraisals
    ]


# ── Leave Types (for apply form) ───────────────────────────────
@router.get("/leave-types")
def portal_leave_types(request: Request, db: Session = Depends(get_db)):
    _get_employee(request, db)  # auth check
    return db.query(LeaveType).all()


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
    dest = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "static", "uploads", "profiles")
    os.makedirs(dest, exist_ok=True)
    fname = f"emp_{emp.id}_{int(time.time())}.{ext}"
    with open(os.path.join(dest, fname), "wb") as f:
        f.write(await file.read())
    emp.profile_photo = f"/uploads/profiles/{fname}"
    db.commit()
    return {"profile_photo": emp.profile_photo}
