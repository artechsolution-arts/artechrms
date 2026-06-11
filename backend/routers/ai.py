import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/api/ai", tags=["AI"])


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]


def _hr_context(db: Session) -> str:
    try:
        from backend.models.employee import Employee, Department
        from backend.models.leave import LeaveApplication
        total_emp = db.query(Employee).filter(Employee.status == "Active").count()
        pending_lv = db.query(LeaveApplication).filter(LeaveApplication.status == "Pending").count()
        total_dept = db.query(Department).count()
        return f"Active employees: {total_emp} | Pending leave requests: {pending_lv} | Departments: {total_dept}"
    except Exception:
        return "HR data unavailable"


def _fallback(msg: str, ctx: str) -> str:
    m = msg.lower()
    if any(w in m for w in ["leave", "vacation", "holiday", "time off"]):
        return (
            "**Leave Management**\n\n"
            "Apply for leaves in the *Leave Applications* module. Choose leave type, from/to dates and add a reason. "
            "Pending leaves are approved by HR.\n\n"
            "Standard policy: 18 annual leaves, 12 sick leaves, 8 public holidays per year."
        )
    if any(w in m for w in ["salary", "pay", "payroll", "payslip", "ctc"]):
        return (
            "**Payroll & Salary**\n\n"
            "Salary slips are generated monthly. Go to *Salary Slips* to view your earnings, deductions and net pay. "
            "Use *Payroll Entry* to run payroll for the entire team in one shot."
        )
    if any(w in m for w in ["attendance", "present", "absent", "late", "wfh"]):
        return (
            "**Attendance Tracking**\n\n"
            "Mark attendance daily in the *Attendance* module. Statuses: Present, Absent, Half Day, WFH, On Leave. "
            "Maintain ≥90% attendance to avoid policy flags."
        )
    if any(w in m for w in ["appraisal", "performance", "review", "kra", "goal"]):
        return (
            "**Performance Appraisals**\n\n"
            "Appraisals are managed in the *Appraisals* module. Add goals/KRAs with a score out of 5. "
            "Submit the appraisal for review when complete."
        )
    if any(w in m for w in ["recruit", "hiring", "applicant", "job", "opening"]):
        return (
            "**Recruitment**\n\n"
            "Manage job openings under *Job Openings* and track candidates in *Applicants*. "
            "Update applicant status as they move through stages: Applied → Screening → Interview → Offered → Hired."
        )
    if any(w in m for w in ["employee", "staff", "join", "onboard"]):
        return f"**Employee Management**\n\nCurrent status: {ctx}\n\nAdd or edit employees in the *Employees* module. Fields include personal details, department, designation, employment type and bank information."
    if any(w in m for w in ["department", "dept", "team"]):
        return "**Departments**\n\nManage departments in *HR → Departments*. Each employee is linked to a department and designation for proper reporting."
    return (
        "**Artech HR Assistant** — I can help with:\n\n"
        "• Leave applications & policy\n"
        "• Payroll & salary slips\n"
        "• Attendance tracking\n"
        "• Employee onboarding\n"
        "• Recruitment pipeline\n"
        "• Performance appraisals\n\n"
        f"*System status* — {ctx}\n\n"
        "What would you like to know?"
    )


@router.post("/chat")
async def ai_chat(request: ChatRequest, db: Session = Depends(get_db)):
    ctx = _hr_context(db)
    api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()

    if not api_key:
        last = request.messages[-1].content if request.messages else ""
        return {"response": _fallback(last, ctx), "mode": "fallback"}

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        system = (
            "You are Artech HR Assistant, an intelligent AI for Artech Solutions HRMS.\n\n"
            f"Live system data: {ctx}\n\n"
            "Modules: Employees, Departments, Leave Applications, Attendance, "
            "Salary Slips, Payroll Entry, Salary Components, Job Openings, Applicants, Appraisals.\n\n"
            "Be concise, professional, and helpful. Use markdown formatting for clarity. "
            "Always reference actual module names when guiding the user."
        )
        messages = [{"role": m.role, "content": m.content} for m in request.messages]
        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            system=system,
            messages=messages,
        )
        return {"response": resp.content[0].text, "mode": "ai"}
    except Exception as e:
        last = request.messages[-1].content if request.messages else ""
        return {"response": _fallback(last, ctx), "mode": "fallback"}


@router.get("/insights")
async def ai_insights(db: Session = Depends(get_db)):
    try:
        from backend.models.employee import Employee
        from backend.models.leave import LeaveApplication, Attendance
        from backend.models.payroll import SalarySlip
        from backend.models.recruitment import JobOpening
        from datetime import date, timedelta
        import calendar

        today = date.today()
        first_day = today.replace(day=1)

        active_emp = db.query(Employee).filter(Employee.status == "Active").count()
        pending_lv = db.query(LeaveApplication).filter(LeaveApplication.status == "Pending").count()
        open_jobs = db.query(JobOpening).filter(JobOpening.status == "Open").count()

        present_today = db.query(Attendance).filter(
            Attendance.date == today,
            Attendance.status == "Present"
        ).count()

        month_slips = db.query(SalarySlip).filter(
            SalarySlip.month == today.month,
            SalarySlip.year == today.year
        ).count()

        insights = []

        if pending_lv > 0:
            insights.append({
                "type": "warning",
                "icon": "📋",
                "text": f"{pending_lv} leave application{'s' if pending_lv > 1 else ''} awaiting approval",
                "action": "leaves"
            })

        # Attendance insight removed — attendance is captured automatically via biometric sync.

        if open_jobs > 0:
            insights.append({
                "type": "info",
                "icon": "💼",
                "text": f"{open_jobs} open position{'s' if open_jobs > 1 else ''} in recruitment pipeline",
                "action": "job-openings"
            })

        if month_slips == 0 and today.day >= 25:
            insights.append({
                "type": "warning",
                "icon": "💰",
                "text": f"No salary slips generated for {today.strftime('%B %Y')} yet",
                "action": "salary-slips"
            })

        if not insights:
            insights.append({
                "type": "success",
                "icon": "✅",
                "text": "Everything looks good! No pending actions.",
                "action": None
            })

        return {"insights": insights}
    except Exception as e:
        return {"insights": [{"type": "info", "icon": "🤖", "text": "AI insights loading...", "action": None}]}
