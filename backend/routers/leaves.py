from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from datetime import date
from backend.database import get_db
from backend.models.leave import LeaveType, LeaveApplication, Attendance

router = APIRouter(prefix="/api/leaves", tags=["Leaves"])


class LeaveTypeIn(BaseModel):
    name: str
    max_leaves: float = 0
    is_carry_forward: bool = False
    is_paid: bool = True


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


@router.delete("/types/{type_id}")
def delete_leave_type(type_id: int, db: Session = Depends(get_db)):
    lt = db.query(LeaveType).filter(LeaveType.id == type_id).first()
    if not lt:
        raise HTTPException(404, "Leave type not found")
    db.delete(lt)
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
    result = []
    for lv in leaves:
        result.append({
            "id": lv.id,
            "employee_name": lv.employee_rel.full_name if lv.employee_rel else "",
            "leave_type": lv.leave_type_rel.name if lv.leave_type_rel else "",
            "from_date": str(lv.from_date),
            "to_date": str(lv.to_date),
            "total_days": lv.total_days,
            "status": lv.status,
            "reason": lv.reason,
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
    return {"id": leave.id, "total_days": leave.total_days}


@router.put("/{leave_id}/approve")
def approve_leave(leave_id: int, db: Session = Depends(get_db)):
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    leave.status = "Approved"
    db.commit()
    return {"ok": True}


@router.put("/{leave_id}/reject")
def reject_leave(leave_id: int, db: Session = Depends(get_db)):
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    leave.status = "Rejected"
    db.commit()
    return {"ok": True}


@router.delete("/{leave_id}")
def delete_leave(leave_id: int, db: Session = Depends(get_db)):
    leave = db.query(LeaveApplication).filter(LeaveApplication.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
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
    records = q.order_by(Attendance.date.desc()).limit(200).all()
    result = []
    for a in records:
        result.append({
            "id": a.id,
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
