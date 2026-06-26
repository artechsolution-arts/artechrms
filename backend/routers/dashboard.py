from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.database import get_db
from backend.models.employee import Employee
from backend.models.leave import LeaveApplication, Attendance
from backend.models.payroll import SalarySlip
from backend.models.recruitment import JobOpening, JobApplicant
from backend.models.resignation import Resignation
from backend.models.edit_request import EditRequest
from datetime import date, timedelta
from collections import defaultdict

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()
    first_day_month = today.replace(day=1)

    total_employees = db.query(Employee).filter(Employee.status == "Active").count()
    pending_leaves = db.query(LeaveApplication).filter(LeaveApplication.status == "Pending").count()
    cancellation_requests = db.query(LeaveApplication).filter(LeaveApplication.status == "Cancellation Requested").count()
    approved_leaves = db.query(LeaveApplication).filter(LeaveApplication.status == "Approved").count()
    rejected_leaves = db.query(LeaveApplication).filter(LeaveApplication.status == "Rejected").count()
    open_positions = db.query(JobOpening).filter(JobOpening.status == "Open").count()
    present_today = db.query(Attendance).filter(
        Attendance.date == today,
        Attendance.status == "Present",
    ).count()
    on_leave_today = db.query(LeaveApplication).filter(
        LeaveApplication.status == "Approved",
        LeaveApplication.from_date <= today,
        LeaveApplication.to_date >= today,
    ).count()
    new_hires_this_month = db.query(Employee).filter(
        Employee.date_of_joining >= first_day_month,
    ).count()

    # pending resignations & edit requests (CEO approvals)
    pending_resignations = db.query(Resignation).filter(Resignation.status == "Pending").count()
    pending_edit_requests = db.query(EditRequest).filter(EditRequest.status == "Pending").count()

    # recent hires
    recent_hires = db.query(Employee).order_by(Employee.date_of_joining.desc()).limit(5).all()

    # department breakdown
    dept_counts = {}
    for emp in db.query(Employee).filter(Employee.status == "Active").all():
        dept = emp.department_rel.name if emp.department_rel else "Unassigned"
        dept_counts[dept] = dept_counts.get(dept, 0) + 1

    # monthly hires for last 6 months (line chart)
    monthly_hires = defaultdict(int)
    six_months_ago = today.replace(day=1) - timedelta(days=5 * 30)
    emps = db.query(Employee).filter(Employee.date_of_joining >= six_months_ago).all()
    for emp in emps:
        if emp.date_of_joining:
            key = emp.date_of_joining.strftime("%b %Y")
            monthly_hires[key] += 1

    # build ordered month labels (proper month arithmetic)
    month_labels = []
    month_data = []
    for i in range(5, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        from datetime import date as _date
        d = _date(year, month, 1)
        label = d.strftime("%b %Y")
        month_labels.append(label)
        month_data.append(monthly_hires.get(label, 0))

    # attendance this month
    att_rows = db.query(Attendance).filter(Attendance.date >= first_day_month).all()
    att_status = defaultdict(int)
    for a in att_rows:
        att_status[a.status] += 1

    # this month's payroll expense (submitted slips only)
    payroll_result = db.query(func.sum(SalarySlip.net_pay)).filter(
        SalarySlip.month == today.month,
        SalarySlip.year == today.year,
    ).scalar()
    monthly_payroll = float(payroll_result or 0)

    # recruitment pipeline — counts per applicant status
    applicant_rows = db.query(JobApplicant.status, func.count(JobApplicant.id)).group_by(JobApplicant.status).all()
    recruitment_pipeline = {row[0]: row[1] for row in applicant_rows}

    # open job openings (latest 5)
    open_jobs = db.query(JobOpening).filter(JobOpening.status == "Open").order_by(JobOpening.id.desc()).limit(5).all()

    return {
        "stats": {
            "total_employees":      total_employees,
            "pending_leaves":       pending_leaves,
            "cancellation_requests": cancellation_requests,
            "open_positions":       open_positions,
            "present_today":        present_today,
            "on_leave_today":       on_leave_today,
            "new_hires_this_month": new_hires_this_month,
            "pending_resignations": pending_resignations,
            "pending_edit_requests": pending_edit_requests,
            "monthly_payroll":      monthly_payroll,
        },
        "leave_stats": {
            "pending": pending_leaves,
            "cancellation_requests": cancellation_requests,
            "approved": approved_leaves,
            "rejected": rejected_leaves,
        },
        "attendance_stats": dict(att_status),
        "monthly_hires": {
            "labels": month_labels,
            "data": month_data,
        },
        "department_breakdown": [
            {"name": k, "count": v} for k, v in dept_counts.items()
        ],
        "recent_hires": [
            {
                "id": e.id,
                "name": e.full_name,
                "profile_photo": e.profile_photo,
                "department": e.department_rel.name if e.department_rel else "",
                "designation": e.designation_rel.name if e.designation_rel else "",
                "joined": str(e.date_of_joining),
            }
            for e in recent_hires
        ],
        "monthly_payroll": monthly_payroll,
        "recruitment_pipeline": recruitment_pipeline,
        "open_jobs": [
            {
                "id": j.id,
                "title": j.title,
                "positions": j.no_of_positions or 1,
                "closes_on": str(j.closes_on) if j.closes_on else "",
            }
            for j in open_jobs
        ],
    }


@router.get("/hike-snapshot")
def get_hike_snapshot(db: Session = Depends(get_db)):
    """Return per-employee salary data for the CEO hike impact calculator."""
    today = date.today()
    employees = db.query(Employee).filter(Employee.status == "Active").all()

    # Latest salary slip per employee (for gross_pay)
    latest_slips = {}
    slips = (
        db.query(SalarySlip)
        .order_by(SalarySlip.year.desc(), SalarySlip.month.desc())
        .all()
    )
    for slip in slips:
        if slip.employee_id not in latest_slips:
            latest_slips[slip.employee_id] = slip

    result = []
    for emp in employees:
        slip = latest_slips.get(emp.id)
        gross = slip.gross_pay if slip else (emp.basic_salary * 2 if emp.basic_salary else 0)
        basic = emp.basic_salary or (gross * 0.5)
        dept = emp.department_rel.name if emp.department_rel else "Unassigned"
        result.append({
            "id": emp.id,
            "name": emp.full_name,
            "department": dept,
            "designation": emp.designation_rel.name if emp.designation_rel else "",
            "basic_salary": round(basic, 2),
            "gross_salary": round(gross, 2),
        })

    return {"employees": result, "total_monthly": round(sum(e["gross_salary"] for e in result), 2)}


@router.get("/monthly-leaves")
def get_monthly_leaves(db: Session = Depends(get_db)):
    """Monthly approved leave days per employee — last 6 months."""
    today = date.today()

    # Build 6-month window
    months = []
    for i in range(5, -1, -1):
        yr, mo = today.year, today.month - i
        while mo <= 0:
            mo += 12; yr -= 1
        first = date(yr, mo, 1)
        last  = date(yr, mo + 1, 1) - timedelta(days=1) if mo < 12 else date(yr + 1, 1, 1) - timedelta(days=1)
        months.append((yr, mo, first, last, first.strftime("%b %Y")))

    window_start, window_end = months[0][2], months[-1][3]

    employees = db.query(Employee).filter(Employee.status == "Active").order_by(Employee.full_name).all()

    # Approved leaves that overlap the window
    leaves = db.query(LeaveApplication).filter(
        LeaveApplication.status == "Approved",
        LeaveApplication.from_date <= window_end,
        LeaveApplication.to_date   >= window_start,
    ).all()

    # Per-employee, per-month days
    emp_monthly = defaultdict(lambda: [0] * 6)
    for leave in leaves:
        for mi, (_, _, first, last, _label) in enumerate(months):
            overlap_start = max(leave.from_date, first)
            overlap_end   = min(leave.to_date,   last)
            if overlap_start <= overlap_end:
                emp_monthly[leave.employee_id][mi] += (overlap_end - overlap_start).days + 1

    month_totals = [
        sum(emp_monthly[e.id][mi] for e in employees)
        for mi in range(6)
    ]

    employees_data = [
        {
            "id":         emp.id,
            "name":       emp.full_name,
            "department": emp.department_rel.name if emp.department_rel else "Unassigned",
            "monthly":    emp_monthly.get(emp.id, [0] * 6),
            "total":      sum(emp_monthly.get(emp.id, [0] * 6)),
        }
        for emp in employees
    ]

    return {
        "labels":       [m[4] for m in months],
        "month_totals": month_totals,
        "employees":    employees_data,
    }
