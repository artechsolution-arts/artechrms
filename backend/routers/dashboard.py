from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models.employee import Employee
from backend.models.leave import LeaveApplication, Attendance
from backend.models.payroll import SalarySlip
from backend.models.recruitment import JobOpening, JobApplicant
from datetime import date, timedelta
from collections import defaultdict

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("")
def get_dashboard(db: Session = Depends(get_db)):
    today = date.today()
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
    first_day = today.replace(day=1)
    att_rows = db.query(Attendance).filter(Attendance.date >= first_day).all()
    att_status = defaultdict(int)
    for a in att_rows:
        att_status[a.status] += 1

    return {
        "stats": {
            "total_employees": total_employees,
            "pending_leaves": pending_leaves,
            "cancellation_requests": cancellation_requests,
            "open_positions": open_positions,
            "present_today": present_today,
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
                "department": e.department_rel.name if e.department_rel else "",
                "designation": e.designation_rel.name if e.designation_rel else "",
                "joined": str(e.date_of_joining),
            }
            for e in recent_hires
        ],
    }
