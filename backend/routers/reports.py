from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Date, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from pydantic import BaseModel
from datetime import date, datetime, timedelta
from typing import Optional, List
import json

from backend.database import get_db, Base
from backend.models.leave import Attendance
from backend.models.auth import User
from backend.auth_utils import decode_token
from fastapi import Header

router = APIRouter(prefix="/api/reports", tags=["reports"])


# ── Model ──────────────────────────────────────────────────────
class Report(Base):
    __tablename__ = "reports"
    id            = Column(Integer, primary_key=True, index=True)
    report_type   = Column(String(50), nullable=False)   # attendance_weekly / attendance_monthly
    period_label  = Column(String(150), nullable=False)
    start_date    = Column(Date, nullable=False)
    end_date      = Column(Date, nullable=False)
    generated_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    generated_at  = Column(DateTime, default=func.now())
    row_count     = Column(Integer, default=0)
    report_data   = Column(JSON, nullable=True)


# ── Auth helper ────────────────────────────────────────────────
def _user_id(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        payload = decode_token(token)
        username = payload.get("sub")
        if not username:
            return None
        u = db.query(User).filter(User.username == username).first()
        return u.id if u else None
    except Exception:
        return None


# ── Schemas ────────────────────────────────────────────────────
class GenerateReportIn(BaseModel):
    start_date:   str        # ISO: 2026-06-01
    end_date:     str        # ISO: 2026-06-07
    period_label: str        # "Week 1: 02 Jun – 08 Jun 2026"
    report_type:  str        # "attendance_weekly" | "attendance_monthly"


class EmployeeHoursItem(BaseModel):
    employee_id:  int
    actual_hours: float


class HoursReminderIn(BaseModel):
    period_label:   str
    period_type:    str    # "week" | "month"
    required_hours: float
    employees:      List[EmployeeHoursItem]


# ── Helpers ────────────────────────────────────────────────────
def _date_range(start: date, end: date) -> List[date]:
    days = []
    d = start
    while d <= end:
        days.append(d)
        d += timedelta(days=1)
    return days


def _fmt_date(d: date) -> str:
    return d.strftime("%d %b %Y")


# ── Endpoints ──────────────────────────────────────────────────
@router.post("/attendance")
def generate_attendance_report(
    data: GenerateReportIn,
    db: Session = Depends(get_db),
    user_id: Optional[int] = Depends(_user_id),
):
    try:
        start = date.fromisoformat(data.start_date)
        end   = date.fromisoformat(data.end_date)
    except ValueError:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD.")

    if end < start:
        raise HTTPException(400, "end_date must be >= start_date")

    days = _date_range(start, end)

    # Fetch all attendance in range
    records = (
        db.query(Attendance)
        .filter(Attendance.date >= start, Attendance.date <= end)
        .all()
    )
    att_map = {}
    for r in records:
        att_map[(r.employee_id, str(r.date))] = r

    # Fetch active employees sorted by employee_id
    from backend.models.employee import Employee
    from datetime import timedelta
    import re as _re
    employees = (
        db.query(Employee)
        .filter(Employee.status == 'Active')
        .all()
    )
    # Sort numerically by the numeric portion of employee_id (e.g. "EMP-0012" → 12)
    def _emp_sort_key(e):
        code = e.employee_id or ""
        m = _re.search(r'\d+', code)
        return (int(m.group()) if m else 0, code)
    employees = sorted(employees, key=_emp_sort_key)

    rows = []
    for emp in employees:
        dept_name = emp.department_rel.name if emp.department_rel else "—"

        # Determine probation status
        in_probation = False
        if emp.date_of_joining and emp.probation_period_days:
            probation_end = emp.date_of_joining + timedelta(days=emp.probation_period_days)
            in_probation = end < probation_end

        day_entries = []
        total_hours  = 0.0
        present_days = 0
        leave_days   = 0
        absent_days  = 0
        for d in days:
            rec = att_map.get((emp.id, str(d)))
            h = round(rec.working_hours or 0, 2) if rec else 0.0
            total_hours += h
            status = rec.status if rec else "—"
            if status in ("Present", "WFH"):
                present_days += 1
            elif status == "Half Day":
                present_days += 1
                leave_days   += 1
            elif status == "On Leave":
                leave_days += 1
            elif status == "Absent":
                absent_days += 1
            day_entries.append({
                "date":     str(d),
                "day":      d.strftime("%a %d %b"),
                "status":   status,
                "in_time":  rec.in_time  if rec and rec.in_time  else "—",
                "out_time": rec.out_time if rec and rec.out_time else "—",
                "hours":    h,
            })
        rows.append({
            "employee_id":   emp.id,
            "employee_code": emp.employee_id or "",
            "employee_name": emp.full_name,
            "department":    dept_name,
            "in_probation":  in_probation,
            "days":          day_entries,
            "total_hours":   round(total_hours, 2),
            "present_days":  present_days,
            "leave_days":    leave_days,
            "absent_days":   absent_days,
        })

    # Store in DB
    report = Report(
        report_type  = data.report_type,
        period_label = data.period_label,
        start_date   = start,
        end_date     = end,
        generated_by = user_id,
        row_count    = len(rows),
        report_data  = rows,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return {
        "id":           report.id,
        "period_label": report.period_label,
        "start_date":   str(start),
        "end_date":     str(end),
        "generated_at": report.generated_at.isoformat() if report.generated_at else None,
        "rows":         rows,
        "days":         [{"date": str(d), "day": d.strftime("%a %d %b")} for d in days],
    }


def _fmt_h(h: float) -> str:
    if h <= 0:
        return "0h"
    hrs  = int(h)
    mins = round((h - hrs) * 60)
    return f"{hrs}h {mins}m" if mins else f"{hrs}h"


def _hours_reminder_html(name: str, period: str, period_word: str,
                         required_fmt: str, actual_fmt: str, shortage_fmt: str) -> str:
    return f"""<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#1f2937;background:#f9fafb;">
<div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:32px;">
  <h2 style="color:#dc2626;margin-top:0;font-size:18px;">Work Hours Incomplete – {period}</h2>
  <p style="margin-bottom:6px;">Dear <strong>{name}</strong>,</p>
  <p style="color:#4b5563;">Our records show that your {period_word} work hours for <strong>{period}</strong> are below the required target. Please review the details below and submit a reason to your HR manager.</p>
  <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
    <tr style="background:#f1f5f9;">
      <td style="padding:12px 16px;font-weight:600;color:#374151;">Required Hours</td>
      <td style="padding:12px 16px;text-align:right;font-weight:700;color:#374151;">{required_fmt}</td>
    </tr>
    <tr style="background:#fff;">
      <td style="padding:12px 16px;font-weight:600;color:#374151;">Your Logged Hours</td>
      <td style="padding:12px 16px;text-align:right;font-weight:700;color:#374151;">{actual_fmt}</td>
    </tr>
    <tr style="background:#fef2f2;border-top:2px solid #fca5a5;">
      <td style="padding:12px 16px;font-weight:700;color:#dc2626;">Shortage</td>
      <td style="padding:12px 16px;text-align:right;font-weight:700;color:#dc2626;">{shortage_fmt}</td>
    </tr>
  </table>
  <p style="color:#4b5563;">If you took any authorized early departures or were granted permission to leave early, kindly inform your HR manager with the details so your records can be updated accordingly.</p>
  <p style="color:#9ca3af;font-size:12px;margin-top:28px;border-top:1px solid #e5e7eb;padding-top:16px;">This is an automated reminder from AR Peopliz HRMS. Please do not reply to this email.</p>
</div>
</body>
</html>"""


@router.post("/attendance/send-hours-reminder")
def send_hours_reminder(data: HoursReminderIn, db: Session = Depends(get_db)):
    from backend.models.employee import Employee
    from backend.utils.email import send_email

    period_word = "weekly" if data.period_type == "week" else "monthly"
    sent    = 0
    skipped = 0

    for item in data.employees:
        if item.actual_hours >= data.required_hours:
            skipped += 1
            continue

        emp = db.query(Employee).filter(Employee.id == item.employee_id).first()
        if not emp or not emp.email:
            skipped += 1
            continue

        shortage = round(data.required_hours - item.actual_hours, 2)
        html = _hours_reminder_html(
            name         = emp.full_name,
            period       = data.period_label,
            period_word  = period_word,
            required_fmt = _fmt_h(data.required_hours),
            actual_fmt   = _fmt_h(item.actual_hours),
            shortage_fmt = _fmt_h(shortage),
        )
        send_email(
            to      = emp.email,
            subject = f"Work Hours Reminder – {data.period_label}",
            html    = html,
        )
        sent += 1

    return {"sent": sent, "skipped": skipped, "total": len(data.employees)}


@router.get("")
def list_reports(
    report_type: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Report)
    if report_type:
        q = q.filter(Report.report_type == report_type)
    reports = q.order_by(Report.generated_at.desc()).limit(50).all()
    return [
        {
            "id":           r.id,
            "report_type":  r.report_type,
            "period_label": r.period_label,
            "start_date":   str(r.start_date),
            "end_date":     str(r.end_date),
            "generated_at": r.generated_at.isoformat() if r.generated_at else None,
            "row_count":    r.row_count,
        }
        for r in reports
    ]


@router.get("/{report_id}")
def get_report(report_id: int, db: Session = Depends(get_db)):
    r = db.query(Report).filter(Report.id == report_id).first()
    if not r:
        raise HTTPException(404, "Report not found")
    days_in_range = _date_range(r.start_date, r.end_date)
    return {
        "id":           r.id,
        "report_type":  r.report_type,
        "period_label": r.period_label,
        "start_date":   str(r.start_date),
        "end_date":     str(r.end_date),
        "generated_at": r.generated_at.isoformat() if r.generated_at else None,
        "row_count":    r.row_count,
        "rows":         r.report_data or [],
        "days":         [{"date": str(d), "day": d.strftime("%a %d %b")} for d in days_in_range],
    }
