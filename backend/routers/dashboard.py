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
