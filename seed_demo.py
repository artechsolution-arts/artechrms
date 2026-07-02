"""
Demo seed script for Jeevan client demo.

Usage:
    DATABASE_URL=postgresql://... python seed_demo.py          # seed fresh DB
    DATABASE_URL=postgresql://... python seed_demo.py --reset  # wipe + re-seed
    DATABASE_URL=postgresql://... python seed_demo.py --wipe   # wipe only

Without DATABASE_URL it falls back to the local default in database.py.
"""

import sys
import os
import calendar as _cal
import random
from datetime import date, timedelta

sys.path.insert(0, os.path.dirname(__file__))

# ── Production guard ──────────────────────────────────────────────────────────
# This script seeds DEMO data and must NEVER run against the production DB.
# Require DEMO_SEED=1 for any non-local database URL.
_raw_url = os.environ.get("DATABASE_URL", "")
_is_local = not _raw_url or "localhost" in _raw_url or "127.0.0.1" in _raw_url
if not _is_local and not os.environ.get("DEMO_SEED"):
    print("ERROR: Refusing to seed — DATABASE_URL points to a remote database.")
    print("This script is for the DEMO environment only.")
    print("If you are sure this is the demo DB, re-run with DEMO_SEED=1:")
    print()
    print("  DEMO_SEED=1 DATABASE_URL=... python seed_demo.py --reset")
    print()
    sys.exit(1)

# Force psycopg3 dialect so the script runs without psycopg2 installed
_url = os.environ.get("DATABASE_URL", "")
if _url.startswith("postgresql://") and not _url.startswith("postgresql+"):
    os.environ["DATABASE_URL"] = _url.replace("postgresql://", "postgresql+psycopg://", 1)

# Register all models before create_all
from backend.database import engine, SessionLocal, Base
import backend.models  # noqa: F401
from backend.models.activity_log import ActivityLog
from backend.models.profile_update_log import ProfileUpdateLog

from backend.models.auth import User
from backend.models.employee import Employee, Department, Designation
from backend.models.leave import LeaveType, LeaveApplication, Attendance
from backend.models.hrm import LeaveBalance, Holiday, EmployeeAsset, Announcement, EmployeeHistory
from backend.models.payroll import SalarySlip, PayrollRules
from backend.models.permission import RolePermission, DEFAULT_PERMISSIONS
from backend.models.notification import Notification
from backend.models.resignation import Resignation
from backend.models.approval import ApprovalRequest, ApprovalStep, ApprovalWorkflow

# Inline password hashing — avoids pulling in python-jose via auth_utils
from passlib.context import CryptContext
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
def get_password_hash(p): return _pwd.hash(p)


# ── Constants ─────────────────────────────────────────────────

TODAY = date.today()
YEAR  = TODAY.year
MONTH = TODAY.month

random.seed(42)

# ── Wipe ──────────────────────────────────────────────────────

WIPE_TABLES = [
    "activity_logs",
    "profile_update_logs",
    "employee_history",
    "salary_slips",
    "payroll_entries",
    "employee_assets",
    "leave_balances",
    "leave_applications",
    "attendance",
    "notifications",
    "approval_steps",
    "approval_requests",
    "approval_workflows",
    "resignations",
    "employees",
    "departments",
    "designations",
    "leave_types",
    "holidays",
    "announcements",
    "users",
    "role_permissions",
    "payroll_rules",
]


def wipe(db):
    print("Wiping demo data...")
    from sqlalchemy import text
    for t in WIPE_TABLES:
        try:
            db.execute(text(f"TRUNCATE TABLE {t} RESTART IDENTITY CASCADE"))
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"  skip {t}: {e}")
    print("  Done.\n")


# ── Helpers ───────────────────────────────────────────────────

def _month_ago(n=0):
    """First day of month N months ago."""
    m, y = MONTH - n, YEAR
    while m <= 0:
        m += 12
        y -= 1
    return date(y, m, 1)


def _month_end(d: date) -> date:
    return date(d.year, d.month, _cal.monthrange(d.year, d.month)[1])


# ── Seed ──────────────────────────────────────────────────────

def seed(db):
    print("Seeding demo data for Jeevan Solutions…\n")

    # ── 1. Departments ────────────────────────────────────────
    dept_names = ["Engineering", "Human Resources", "Finance", "Operations", "Sales"]
    depts = {}
    for name in dept_names:
        d = Department(name=name)
        db.add(d)
        depts[name] = d
    db.flush()

    # ── 2. Designations ───────────────────────────────────────
    desig_names = [
        "Software Engineer", "Senior Software Engineer", "Team Lead",
        "HR Manager", "HR Executive",
        "Accounts Manager",
        "Operations Manager", "Operations Executive",
        "Sales Manager", "Sales Executive",
    ]
    desigs = {}
    for name in desig_names:
        d = Designation(name=name)
        db.add(d)
        desigs[name] = d
    db.flush()

    # ── 3. Users ──────────────────────────────────────────────
    #   (username, full_name, email, password, role)
    users_spec = [
        ("superadmin", "Super Admin",   "superadmin@jeevan.demo", "Admin@123",  "SuperAdmin"),
        ("hr_priya",   "Priya Sharma",  "priya@jeevan.demo",      "Hr@123",     "HR"),
        ("ceo_vivek",  "Vivek Jeevan",  "vivek@jeevan.demo",      "Ceo@123",    "CEO"),
        ("emp_arjun",  "Arjun Mehta",   "arjun@jeevan.demo",      "Emp@123",    "Employee"),
        ("emp_neha",   "Neha Reddy",    "neha@jeevan.demo",       "Emp@123",    "Employee"),
        ("emp_rohan",  "Rohan Das",     "rohan@jeevan.demo",      "Emp@123",    "Employee"),
        ("emp_kavya",  "Kavya Nair",    "kavya@jeevan.demo",      "Emp@123",    "Employee"),
        ("emp_suresh", "Suresh Pillai", "suresh@jeevan.demo",     "Emp@123",    "Employee"),
    ]
    user_objs = {}
    for uname, full, email, pwd, role in users_spec:
        u = User(
            username=uname, full_name=full, email=email,
            hashed_password=get_password_hash(pwd),
            role=role, is_active=True,
        )
        db.add(u)
        user_objs[uname] = u
    db.flush()

    # ── 4. Employees ──────────────────────────────────────────
    #   (username, emp_code, dept, desig, join_date, basic, mobile, gender, dob)
    emp_spec = [
        ("emp_arjun",  "JVN-0001", "Engineering",    "Senior Software Engineer", date(2022, 3, 15), 55000, "9876543210", "Male",   date(1993, 6, 20)),
        ("emp_neha",   "JVN-0002", "Human Resources","HR Executive",             date(2023, 1, 10), 38000, "9876543211", "Female", date(1996, 9, 14)),
        ("emp_rohan",  "JVN-0003", "Engineering",    "Software Engineer",        date(2023, 7,  1), 42000, "9876543212", "Male",   date(1997, 4, 25)),
        ("emp_kavya",  "JVN-0004", "Sales",          "Sales Manager",            date(2021,11, 20), 60000, "9876543213", "Female", date(1991,12,  3)),
        ("emp_suresh", "JVN-0005", "Operations",     "Operations Executive",     date(2022, 8,  5), 35000, "9876543214", "Male",   date(1994, 2, 18)),
    ]
    emp_objs = {}
    for uname, code, dept_name, desig_name, join, basic, mobile, gender, dob in emp_spec:
        u = user_objs[uname]
        emp = Employee(
            user_id           = u.id,
            employee_id       = code,
            full_name         = u.full_name,
            first_name        = u.full_name.split()[0],
            last_name         = " ".join(u.full_name.split()[1:]),
            email             = u.email,
            mobile            = mobile,
            gender            = gender,
            date_of_birth     = dob,
            date_of_joining   = join,
            department_id     = depts[dept_name].id,
            designation_id    = desigs[desig_name].id,
            status            = "Active",
            basic_salary      = float(basic),
            hra_percent       = 40.0,
            special_allowance = round(basic * 0.10),
            pf_applicable     = 1,
            esi_applicable    = 1 if basic <= 21000 else 0,
            pt_state          = "Karnataka",
            employment_type   = "Full-time",
            probation_period_days = 90,
        )
        db.add(emp)
        emp_objs[uname] = emp
    db.flush()

    # ── 5. Leave Types ────────────────────────────────────────
    #   (name, max_leaves, is_carry_forward, is_paid)
    lt_spec = [
        ("Casual Leave",    12, False, True),
        ("Sick Leave",      12, False, True),
        ("Earned Leave",    15, True,  True),
        ("Maternity Leave", 26*5, False, True),
        ("Paternity Leave",  5*5, False, True),
        ("Loss of Pay",      0,  False, False),
    ]
    lt_objs = {}
    for name, max_l, carry, paid in lt_spec:
        lt = LeaveType(name=name, max_leaves=float(max_l), is_carry_forward=carry, is_paid=paid)
        db.add(lt)
        lt_objs[name] = lt
    db.flush()

    # ── 6. Leave Balances ─────────────────────────────────────
    for emp in emp_objs.values():
        for name, max_l, _, _ in lt_spec:
            if max_l == 0:
                continue
            db.add(LeaveBalance(
                employee_id   = emp.id,
                leave_type_id = lt_objs[name].id,
                year          = YEAR,
                allocated     = float(max_l),
                used          = 0.0,
                carried_forward = 0.0,
            ))
    db.flush()

    # ── 7. Holidays ───────────────────────────────────────────
    holiday_list = [
        (date(YEAR, 1, 26), "Republic Day",          "National"),
        (date(YEAR, 3, 25), "Holi",                  "National"),
        (date(YEAR, 4, 14), "Dr. Ambedkar Jayanti",  "National"),
        (date(YEAR, 8, 15), "Independence Day",       "National"),
        (date(YEAR, 10, 2), "Gandhi Jayanti",         "National"),
        (date(YEAR, 11,12), "Diwali",                 "National"),
        (date(YEAR, 12,25), "Christmas",              "National"),
    ]
    holiday_dates = {h[0] for h in holiday_list}
    for h_date, h_name, h_type in holiday_list:
        db.add(Holiday(date=h_date, name=h_name, holiday_type=h_type))
    db.flush()

    # ── 8. Attendance — last 2 full months + current partial ──
    statuses_pool = (
        ["Present"] * 7 + ["WFH"] * 1 + ["Half Day"] * 1
    )

    for emp in emp_objs.values():
        for mo_offset in [2, 1, 0]:
            m_start = _month_ago(mo_offset)
            m_end   = _month_end(m_start) if mo_offset > 0 else TODAY
            d = m_start
            while d <= m_end:
                if d.weekday() >= 5 or d in holiday_dates:
                    d += timedelta(days=1)
                    continue
                st = random.choice(statuses_pool)
                if st == "Half Day":
                    wh, in_t, out_t = round(random.uniform(3.5, 5.0), 2), "09:30", "14:00"
                elif st == "WFH":
                    wh, in_t, out_t = round(random.uniform(7.5, 9.0), 2), "09:00", "18:00"
                else:
                    wh, in_t, out_t = round(random.uniform(8.0, 9.5), 2), "09:00", "18:30"
                db.add(Attendance(
                    employee_id   = emp.id,
                    date          = d,
                    status        = st,
                    in_time       = in_t,
                    out_time      = out_t,
                    working_hours = wh,
                ))
                d += timedelta(days=1)
    db.flush()

    # ── 9. Leave Applications ─────────────────────────────────
    arjun  = emp_objs["emp_arjun"]
    neha   = emp_objs["emp_neha"]
    rohan  = emp_objs["emp_rohan"]
    kavya  = emp_objs["emp_kavya"]
    suresh = emp_objs["emp_suresh"]

    prev = _month_ago(1)

    def _leave(emp, lt_name, from_d, to_d, status, reason):
        days = sum(
            1 for i in range((to_d - from_d).days + 1)
            if (from_d + timedelta(days=i)).weekday() < 5
               and (from_d + timedelta(days=i)) not in holiday_dates
        )
        db.add(LeaveApplication(
            employee_id   = emp.id,
            leave_type_id = lt_objs[lt_name].id,
            from_date     = from_d,
            to_date       = to_d,
            total_days    = float(days),
            reason        = reason,
            status        = status,
        ))

    _leave(arjun,  "Casual Leave", prev + timedelta(3),  prev + timedelta(4),  "Approved", "Family function")
    _leave(neha,   "Sick Leave",   prev + timedelta(7),  prev + timedelta(7),  "Approved", "Fever — doctor visit")
    _leave(rohan,  "Casual Leave", prev + timedelta(10), prev + timedelta(11), "Approved", "Personal work")
    _leave(suresh, "Sick Leave",   TODAY - timedelta(5), TODAY - timedelta(5), "Pending",  "Medical appointment")
    _leave(kavya,  "Earned Leave", TODAY + timedelta(7), TODAY + timedelta(11),"Pending",  "Annual family vacation")
    _leave(arjun,  "Casual Leave", TODAY + timedelta(3), TODAY + timedelta(3), "Pending",  "Personal errand")
    db.flush()

    # ── 10. Salary Slips — last 2 months ─────────────────────
    import uuid

    def _slip(emp, yr, mo):
        basic   = emp.basic_salary or 0
        hra     = round(basic * (emp.hra_percent or 40) / 100)
        special = emp.special_allowance or 0
        gross   = basic + hra + special
        pf      = min(round(basic * 0.12), 1800)
        esi     = round(gross * 0.0075) if emp.esi_applicable else 0
        pt      = 200 if gross >= 15000 else 0
        total_ded = pf + esi + pt
        net     = gross - total_ded
        return SalarySlip(
            slip_id        = f"JVN-{yr}{mo:02d}-{emp.employee_id}",
            employee_id    = emp.id,
            month          = mo,
            year           = yr,
            start_date     = date(yr, mo, 1),
            end_date       = date(yr, mo, _cal.monthrange(yr, mo)[1]),
            gross_pay      = gross,
            total_deduction= total_ded,
            net_pay        = net,
            earnings       = {"Basic Salary": basic, "HRA": hra, "Special Allowance": special},
            deductions     = {"Provident Fund": pf, "ESI": esi, "Professional Tax": pt},
            status         = "Generated",
        )

    for emp in emp_objs.values():
        for mo_offset in [2, 1]:
            m = _month_ago(mo_offset)
            db.add(_slip(emp, m.year, m.month))
    db.flush()

    # ── 11. Employee Assets ───────────────────────────────────
    asset_data = [
        (arjun,  "MacBook Pro 14\"",  "Laptop",    "MPB-2023-001", arjun.date_of_joining),
        (arjun,  "USB-C Hub",         "Other",     "HUB-001",      arjun.date_of_joining),
        (neha,   "Dell Monitor 24\"", "Other",     "MON-001",      neha.date_of_joining),
        (rohan,  "MacBook Air M2",    "Laptop",    "MBA-2023-002", rohan.date_of_joining),
        (kavya,  "iPhone 13",         "Mobile",    "IPH-001",      kavya.date_of_joining),
        (suresh, "HP EliteBook",      "Laptop",    "HPL-001",      suresh.date_of_joining),
    ]
    for emp, name, a_type, serial, alloc_date in asset_data:
        db.add(EmployeeAsset(
            employee_id    = emp.id,
            asset_name     = name,
            asset_type     = a_type,
            serial_number  = serial,
            allocated_date = alloc_date,
            condition      = "Good",
            status         = "Allocated",
        ))
    db.flush()

    # ── 12. Announcements ─────────────────────────────────────
    db.add(Announcement(
        title    = "Welcome to Jeevan Solutions HRMS!",
        content  = "We have launched our new HR Management System. All employees can now apply for leaves, view salary slips, and track attendance online. Please complete your profile setup by this Friday.",
        priority = "High",
        is_active= True,
    ))
    db.add(Announcement(
        title    = "Q2 Performance Reviews — July 15",
        content  = "Performance appraisals for Q2 will begin on July 15. Managers should submit their team ratings by July 10. Employees can view their appraisal history under My Appraisals.",
        priority = "Medium",
        is_active= True,
    ))
    db.flush()

    # ── 13. Payroll Rules (singleton) ─────────────────────────
    if not db.query(PayrollRules).first():
        db.add(PayrollRules(
            pf_enabled        = True,
            esi_enabled       = True,
            hra_enabled       = True,
            pf_employee_rate  = 12.0,
            pf_employee_cap   = 1800.0,
            pf_employer_rate  = 12.0,
            pf_employer_cap   = 1800.0,
            esi_employee_rate = 0.75,
            esi_employer_rate = 3.25,
            esi_wage_ceiling  = 21000.0,
        ))
    db.flush()

    # ── 14. Feature Permissions ───────────────────────────────
    for role, features in DEFAULT_PERMISSIONS.items():
        db.add(RolePermission(role=role, allowed_features=features))
    db.flush()

    # ── 15. Audit Log — ActivityLog entries ───────────────────
    from datetime import datetime, timezone
    def _dt(days_ago=0, hour=9, minute=0):
        return datetime.now(timezone.utc) - timedelta(days=days_ago, hours=0) \
               + timedelta(hours=hour - datetime.now(timezone.utc).hour, minutes=minute - datetime.now(timezone.utc).minute)

    activity_entries = [
        # Today
        dict(actor="hr_priya",   actor_role="HR",         action="APPROVE",   entity_type="Leave",    entity_name="Arjun Mehta — Casual Leave",   changes={"status": "Approved"},     ip_address="192.168.1.10", created_at=_dt(0, 10, 15)),
        dict(actor="hr_priya",   actor_role="HR",         action="UPDATE",    entity_type="Employee", entity_name="Rohan Das",                     changes={"basic_salary": {"old": "42000", "new": "46000"}}, ip_address="192.168.1.10", created_at=_dt(0, 9, 45)),
        dict(actor="ceo_vivek",  actor_role="CEO",        action="LOGIN",     entity_type="Auth",     entity_name="Vivek Jeevan",                  changes=None,                        ip_address="103.45.12.8",  created_at=_dt(0, 9, 5)),
        dict(actor="hr_priya",   actor_role="HR",         action="LOGIN",     entity_type="Auth",     entity_name="Priya Sharma",                  changes=None,                        ip_address="192.168.1.10", created_at=_dt(0, 8, 58)),
        # Yesterday
        dict(actor="hr_priya",   actor_role="HR",         action="RUN_PAYROLL", entity_type="Payroll",  entity_name="June 2025 Payroll — 5 employees", changes={"month": "June 2025", "employees_processed": "5", "total_net": "₹2,27,500"}, ip_address="192.168.1.10", created_at=_dt(1, 16, 30)),
        dict(actor="hr_priya",   actor_role="HR",         action="REJECT",    entity_type="Leave",    entity_name="Neha Reddy — Sick Leave",       changes={"status": "Rejected", "reason": "Insufficient balance"}, ip_address="192.168.1.10", created_at=_dt(1, 14, 20)),
        dict(actor="emp_arjun",  actor_role="Employee",   action="LOGIN",     entity_type="Auth",     entity_name="Arjun Mehta",                   changes=None,                        ip_address="49.36.118.22", created_at=_dt(1, 9, 10)),
        dict(actor="emp_neha",   actor_role="Employee",   action="LOGIN",     entity_type="Auth",     entity_name="Neha Reddy",                    changes=None,                        ip_address="49.36.118.23", created_at=_dt(1, 9, 3)),
        # 3 days ago
        dict(actor="hr_priya",   actor_role="HR",         action="CREATE",    entity_type="Employee", entity_name="Suresh Pillai",                 changes={"employee_id": "JVN-0005", "department": "Operations", "designation": "Operations Executive", "salary": "35000"}, ip_address="192.168.1.10", created_at=_dt(3, 11, 45)),
        dict(actor="hr_priya",   actor_role="HR",         action="UPDATE",    entity_type="Employee", entity_name="Kavya Nair",                    changes={"designation": {"old": "Sales Executive", "new": "Sales Manager"}}, ip_address="192.168.1.10", created_at=_dt(3, 15, 0)),
        dict(actor="superadmin", actor_role="SuperAdmin", action="RESET_PASSWORD", entity_type="User", entity_name="emp_rohan",                  changes={"username": "emp_rohan"},   ip_address="127.0.0.1",    created_at=_dt(3, 10, 5)),
        # 5 days ago
        dict(actor="hr_priya",   actor_role="HR",         action="APPROVE",   entity_type="Leave",    entity_name="Kavya Nair — Earned Leave",     changes={"status": "Approved", "days": "3"}, ip_address="192.168.1.10", created_at=_dt(5, 14, 30)),
        dict(actor="hr_priya",   actor_role="HR",         action="CREATE",    entity_type="Announcement", entity_name="Q2 Performance Review Dates", changes={"title": "Q2 Performance Review Dates", "audience": "All"}, ip_address="192.168.1.10", created_at=_dt(5, 10, 20)),
        dict(actor="ceo_vivek",  actor_role="CEO",        action="LOGIN",     entity_type="Auth",     entity_name="Vivek Jeevan",                  changes=None,                        ip_address="103.45.12.8",  created_at=_dt(5, 9, 0)),
        # 10 days ago
        dict(actor="superadmin", actor_role="SuperAdmin", action="UPDATE",    entity_type="Permissions", entity_name="CEO Role Permissions",       changes={"added": "ceo-audit-log"},  ip_address="127.0.0.1",    created_at=_dt(10, 11, 0)),
        dict(actor="hr_priya",   actor_role="HR",         action="APPROVE",   entity_type="Leave",    entity_name="Rohan Das — Sick Leave",        changes={"status": "Approved", "days": "2"}, ip_address="192.168.1.10", created_at=_dt(10, 15, 45)),
        dict(actor="hr_priya",   actor_role="HR",         action="DELETE",    entity_type="Asset",    entity_name="Laptop #A-2021-005",            changes={"reason": "Returned on resignation"}, ip_address="192.168.1.10", created_at=_dt(10, 13, 0)),
        # 20 days ago
        dict(actor="hr_priya",   actor_role="HR",         action="RUN_PAYROLL", entity_type="Payroll",  entity_name="May 2025 Payroll — 5 employees", changes={"month": "May 2025", "employees_processed": "5", "total_net": "₹2,15,000"}, ip_address="192.168.1.10", created_at=_dt(20, 16, 0)),
        dict(actor="hr_priya",   actor_role="HR",         action="UPDATE",    entity_type="Employee", entity_name="Arjun Mehta",                   changes={"mobile": {"old": "9876543210", "new": "9988776655"}}, ip_address="192.168.1.10", created_at=_dt(20, 11, 30)),
        # 35 days ago
        dict(actor="superadmin", actor_role="SuperAdmin", action="CREATE",    entity_type="User",     entity_name="hr_priya",                      changes={"role": "HR", "email": "priya@jeevan.demo"}, ip_address="127.0.0.1",    created_at=_dt(35, 10, 0)),
        dict(actor="hr_priya",   actor_role="HR",         action="APPROVE",   entity_type="Leave",    entity_name="Suresh Pillai — Casual Leave",  changes={"status": "Approved", "days": "1"}, ip_address="192.168.1.10", created_at=_dt(35, 14, 0)),
    ]
    for e in activity_entries:
        created = e.pop("created_at")
        al = ActivityLog(**e)
        db.add(al)
        db.flush()
        # Set created_at directly
        from sqlalchemy import update as sa_update
        db.execute(sa_update(ActivityLog).where(ActivityLog.id == al.id).values(created_at=created))
    db.flush()

    # ── 16. Audit Log — EmployeeHistory entries ───────────────
    emp_arjun  = emp_objs["emp_arjun"]
    emp_neha   = emp_objs["emp_neha"]
    emp_rohan  = emp_objs["emp_rohan"]
    emp_kavya  = emp_objs["emp_kavya"]
    emp_suresh = emp_objs["emp_suresh"]

    history_entries = [
        dict(employee_id=emp_arjun.id,  change_type="Promotion",         from_designation="Software Engineer",    to_designation="Senior Software Engineer", from_department="Engineering", to_department="Engineering", effective_date=date(2023, 4, 1),  salary_before=42000, salary_after=55000, remarks="Annual promotion — exceptional performance"),
        dict(employee_id=emp_kavya.id,  change_type="Promotion",         from_designation="Sales Executive",      to_designation="Sales Manager",            from_department="Sales",       to_department="Sales",       effective_date=TODAY - timedelta(days=3), salary_before=45000, salary_after=60000, remarks="Promoted after closing Q1 targets"),
        dict(employee_id=emp_rohan.id,  change_type="Transfer",          from_designation="Software Engineer",    to_designation="Software Engineer",         from_department="Operations",  to_department="Engineering", effective_date=date(2023, 9, 1),  salary_before=42000, salary_after=42000, remarks="Moved to Engineering team per request"),
        dict(employee_id=emp_neha.id,   change_type="Department Change", from_designation="HR Executive",         to_designation="HR Executive",              from_department="Engineering", to_department="Human Resources", effective_date=date(2023, 2, 1), salary_before=38000, salary_after=38000, remarks="Joining HR department"),
        dict(employee_id=emp_suresh.id, change_type="Joining",           from_designation=None,                   to_designation="Operations Executive",      from_department=None,          to_department="Operations",  effective_date=date(2022, 8, 5),  salary_before=None,  salary_after=35000, remarks="New hire — onboarded"),
        dict(employee_id=emp_arjun.id,  change_type="Transfer",          from_designation="Senior Software Engineer", to_designation="Team Lead",             from_department="Engineering", to_department="Engineering", effective_date=TODAY - timedelta(days=15), salary_before=55000, salary_after=62000, remarks="Leadership role — team expansion"),
    ]
    for h in history_entries:
        db.add(EmployeeHistory(**h))
    db.flush()

    # ── 17. Audit Log — ProfileUpdateLog entries ──────────────
    profile_updates = [
        dict(employee_id=emp_arjun.id,  changes={"mobile": {"old": "9876543210", "new": "9988776655"}, "emergency_contact_name": {"old": None, "new": "Meera Mehta"}}, seen_by_hr=True),
        dict(employee_id=emp_neha.id,   changes={"address": {"old": None, "new": "14, MG Road, Bengaluru 560001"}, "blood_group": {"old": None, "new": "B+"}}, seen_by_hr=True),
        dict(employee_id=emp_rohan.id,  changes={"mobile": {"old": "9876543212", "new": "9090909090"}}, seen_by_hr=False),
        dict(employee_id=emp_kavya.id,  changes={"linkedin": {"old": None, "new": "linkedin.com/in/kavyanair"}, "profile_photo": {"old": None, "new": "updated"}}, seen_by_hr=True),
        dict(employee_id=emp_suresh.id, changes={"bank_account_number": {"old": "12345678901", "new": "98765432100"}, "bank_name": {"old": "SBI", "new": "HDFC"}}, seen_by_hr=False),
    ]
    for p in profile_updates:
        db.add(ProfileUpdateLog(**p))
    db.flush()

    # ── 18. Fetch existing pending leaves (seeded in §9) for notification refs ──
    pending_leaves = db.query(LeaveApplication).filter(
        LeaveApplication.status == "Pending"
    ).order_by(LeaveApplication.id).all()
    # Ensure we have a leave per employee for notification coverage
    # Add neha + rohan pending leaves if missing (§9 only seeds suresh, kavya, arjun)
    emp_ids_with_pending = {lv.employee_id for lv in pending_leaves}
    if neha.id not in emp_ids_with_pending:
        lv_neha_extra = LeaveApplication(
            employee_id=neha.id, leave_type_id=lt_objs["Casual Leave"].id,
            from_date=TODAY + timedelta(days=3), to_date=TODAY + timedelta(days=4),
            total_days=2.0, reason="Personal work", status="Pending")
        db.add(lv_neha_extra); db.flush()
        pending_leaves.append(lv_neha_extra)
    if rohan.id not in emp_ids_with_pending:
        lv_rohan_extra = LeaveApplication(
            employee_id=rohan.id, leave_type_id=lt_objs["Sick Leave"].id,
            from_date=TODAY + timedelta(days=1), to_date=TODAY + timedelta(days=1),
            total_days=1.0, reason="Doctor appointment", status="Pending")
        db.add(lv_rohan_extra); db.flush()
        pending_leaves.append(lv_rohan_extra)

    # Map employee_id → leave object for easy lookup
    emp_id_to_leave = {lv.employee_id: lv for lv in pending_leaves}
    lv_arjun  = emp_id_to_leave.get(arjun.id)
    lv_kavya  = emp_id_to_leave.get(kavya.id)
    lv_neha   = emp_id_to_leave.get(neha.id)
    lv_rohan  = emp_id_to_leave.get(rohan.id)

    # ── 19. Pending Resignations (for notification deep-links) ────────────────
    pending_resignations = [
        Resignation(employee_id=suresh.id, last_working_date=TODAY + timedelta(days=30),
                    reason="Got a better opportunity", status="Pending"),
        Resignation(employee_id=rohan.id,  last_working_date=TODAY + timedelta(days=45),
                    reason="Pursuing higher education", status="Pending"),
    ]
    for rg in pending_resignations:
        db.add(rg)
    db.flush()

    # ── 20. Approval Workflow seed (salary_change needs CEO) ──────────────────
    from backend.services.approval_service import seed_workflows
    seed_workflows(db)

    # ── 21. Pending Salary Change ApprovalRequest (for CEO approval) ──────────
    sal_req = ApprovalRequest(
        module="salary_change",
        entity_id=arjun.id,
        requested_by_user_id=user_objs["hr_priya"].id,
        current_level=1,
        status="pending",
        payload={
            "old": {"basic_salary": 55000, "hra_percent": 40},
            "new": {"basic_salary": 65000, "hra_percent": 40},
        },
    )
    db.add(sal_req)
    db.flush()
    db.add(ApprovalStep(
        approval_request_id=sal_req.id, level=1,
        approver_role="CEO", status="pending",
    ))
    db.flush()

    # ── 22. Notifications — comprehensive coverage of all fields ──────────────
    from datetime import datetime, timezone
    def _ndt(minutes_ago=0):
        return datetime.now(timezone.utc) - timedelta(minutes=minutes_ago)

    ceo_user   = user_objs["ceo_vivek"]
    hr_user    = user_objs["hr_priya"]
    arjun_user = user_objs["emp_arjun"]
    neha_user  = user_objs["emp_neha"]
    rohan_user = user_objs["emp_rohan"]
    kavya_user = user_objs["emp_kavya"]
    suresh_user= user_objs["emp_suresh"]

    rg_suresh = pending_resignations[0]
    rg_rohan  = pending_resignations[1]

    def _lv_msg(emp_name, days, lt_name, from_d, to_d):
        return f"{emp_name} applied for {days} day{'s' if days != 1.0 else ''} {lt_name} ({from_d} – {to_d})."

    notif_entries = [
        # ── CEO — Salary change approval (approval_request, high, unread) ──────
        dict(recipient_user_id=ceo_user.id, entity_type="salary_change",
             entity_id=sal_req.id, notif_type="approval_request",
             title="Approval Required — Salary Change",
             message=f"Salary Change request #{sal_req.id} is waiting for your approval. Arjun Mehta: ₹55,000 → ₹65,000.",
             action="ceo-approvals", priority="high", is_read=False, is_cc=False,
             dedup_key=f"approval_req_{sal_req.id}_l1", created_at=_ndt(5)),

        # CEO — [CC] Leave — Kavya (info, low, unread, is_cc)
        *([dict(recipient_user_id=ceo_user.id, entity_type="leave",
               entity_id=lv_kavya.id, notif_type="info",
               title="[CC] Leave Request — Kavya Nair",
               message=_lv_msg("Kavya Nair", lv_kavya.total_days, "Earned Leave", lv_kavya.from_date, lv_kavya.to_date),
               action="ceo-approvals", priority="low", is_read=False, is_cc=True,
               dedup_key=f"leave_req_cc_{lv_kavya.id}", created_at=_ndt(60))] if lv_kavya else []),

        # CEO — [CC] Leave — Arjun (info, low, unread, is_cc)
        *([dict(recipient_user_id=ceo_user.id, entity_type="leave",
               entity_id=lv_arjun.id, notif_type="info",
               title="[CC] Leave Request — Arjun Mehta",
               message=_lv_msg("Arjun Mehta", lv_arjun.total_days, "Casual Leave", lv_arjun.from_date, lv_arjun.to_date),
               action="ceo-approvals", priority="low", is_read=False, is_cc=True,
               dedup_key=f"leave_req_cc_{lv_arjun.id}", created_at=_ndt(62))] if lv_arjun else []),

        # CEO — [CC] Leave — Neha (info, low, unread, is_cc)
        *([dict(recipient_user_id=ceo_user.id, entity_type="leave",
               entity_id=lv_neha.id, notif_type="info",
               title="[CC] Leave Request — Neha Reddy",
               message=_lv_msg("Neha Reddy", lv_neha.total_days, "Casual Leave", lv_neha.from_date, lv_neha.to_date),
               action="ceo-approvals", priority="low", is_read=False, is_cc=True,
               dedup_key=f"leave_req_cc_{lv_neha.id}", created_at=_ndt(90))] if lv_neha else []),

        # CEO — [CC] Resignation — Suresh (info, low, unread, is_cc)
        dict(recipient_user_id=ceo_user.id, entity_type="resignation",
             entity_id=rg_suresh.id, notif_type="info",
             title="[CC] Resignation — Suresh Pillai",
             message=f"Suresh Pillai has submitted a resignation. Last working day: {rg_suresh.last_working_date}.",
             action="ceo-approvals", priority="low", is_read=False, is_cc=True,
             dedup_key=f"resignation_cc_{rg_suresh.id}", created_at=_ndt(120)),

        # CEO — [CC] Resignation — Rohan (info, low, unread, is_cc)
        dict(recipient_user_id=ceo_user.id, entity_type="resignation",
             entity_id=rg_rohan.id, notif_type="info",
             title="[CC] Resignation — Rohan Das",
             message=f"Rohan Das has submitted a resignation. Last working day: {rg_rohan.last_working_date}.",
             action="ceo-approvals", priority="low", is_read=False, is_cc=True,
             dedup_key=f"resignation_cc_{rg_rohan.id}", created_at=_ndt(125)),

        # CEO — Work hours alert (alert, medium, already read)
        dict(recipient_user_id=ceo_user.id, entity_type="work_hours",
             entity_id=arjun.id, notif_type="alert",
             title="Late Check-in — Arjun Mehta",
             message="Arjun Mehta checked in at 10:42 AM (expected by 9:30 AM).",
             action="ceo-employees", priority="medium", is_read=True, is_cc=False,
             dedup_key=f"late_checkin_{arjun.id}_{TODAY}", created_at=_ndt(300)),

        # ── HR — Leave requests (approval_request, high) ─────────────────────
        *([dict(recipient_user_id=hr_user.id, entity_type="leave",
               entity_id=lv_kavya.id, notif_type="approval_request",
               title="Leave Request — Kavya Nair",
               message=_lv_msg("Kavya Nair", lv_kavya.total_days, "Earned Leave", lv_kavya.from_date, lv_kavya.to_date),
               action="leaves", priority="high", is_read=False, is_cc=False,
               dedup_key=f"leave_req_{lv_kavya.id}", created_at=_ndt(60))] if lv_kavya else []),
        *([dict(recipient_user_id=hr_user.id, entity_type="leave",
               entity_id=lv_arjun.id, notif_type="approval_request",
               title="Leave Request — Arjun Mehta",
               message=_lv_msg("Arjun Mehta", lv_arjun.total_days, "Casual Leave", lv_arjun.from_date, lv_arjun.to_date),
               action="leaves", priority="high", is_read=False, is_cc=False,
               dedup_key=f"leave_req_{lv_arjun.id}", created_at=_ndt(62))] if lv_arjun else []),
        *([dict(recipient_user_id=hr_user.id, entity_type="leave",
               entity_id=lv_neha.id, notif_type="approval_request",
               title="Leave Request — Neha Reddy",
               message=_lv_msg("Neha Reddy", lv_neha.total_days, "Casual Leave", lv_neha.from_date, lv_neha.to_date),
               action="leaves", priority="high", is_read=False, is_cc=False,
               dedup_key=f"leave_req_{lv_neha.id}", created_at=_ndt(90))] if lv_neha else []),
        *([dict(recipient_user_id=hr_user.id, entity_type="leave",
               entity_id=lv_rohan.id, notif_type="approval_request",
               title="Leave Request — Rohan Das",
               message=_lv_msg("Rohan Das", lv_rohan.total_days, "Sick Leave", lv_rohan.from_date, lv_rohan.to_date),
               action="leaves", priority="high", is_read=True, is_cc=False,
               dedup_key=f"leave_req_{lv_rohan.id}", created_at=_ndt(100))] if lv_rohan else []),

        # HR — Resignations (approval_request, high)
        dict(recipient_user_id=hr_user.id, entity_type="resignation",
             entity_id=rg_suresh.id, notif_type="approval_request",
             title="Resignation — Suresh Pillai",
             message=f"Suresh Pillai has submitted a resignation. Last working day: {rg_suresh.last_working_date}.",
             action="resignations", priority="high", is_read=False, is_cc=False,
             dedup_key=f"resignation_{rg_suresh.id}", created_at=_ndt(120)),
        dict(recipient_user_id=hr_user.id, entity_type="resignation",
             entity_id=rg_rohan.id, notif_type="approval_request",
             title="Resignation — Rohan Das",
             message=f"Rohan Das has submitted a resignation. Last working day: {rg_rohan.last_working_date}.",
             action="resignations", priority="high", is_read=False, is_cc=False,
             dedup_key=f"resignation_{rg_rohan.id}", created_at=_ndt(125)),

        # HR — Salary change CC (info, low, read)
        dict(recipient_user_id=hr_user.id, entity_type="salary_change",
             entity_id=sal_req.id, notif_type="info",
             title="[CC] Salary Change Request Submitted",
             message=f"Salary Change request #{sal_req.id} has been submitted and is pending CEO approval.",
             action="approvals", priority="low", is_read=True, is_cc=True,
             dedup_key=f"approval_cc_{sal_req.id}_HR", created_at=_ndt(5)),

        # ── Employee notifications ─────────────────────────────────────────────
        # Arjun — leave approved (approval_result, medium, unread)
        *([dict(recipient_user_id=arjun_user.id, entity_type="leave",
               entity_id=lv_arjun.id, notif_type="approval_result",
               title="Leave Request Approved",
               message="Your Casual Leave request has been approved by HR.",
               action="emp-leaves", priority="medium", is_read=False, is_cc=False,
               dedup_key=f"leave_result_{lv_arjun.id}_demo", created_at=_ndt(30))] if lv_arjun else []),

        # Arjun — salary updated (info, high, unread)
        dict(recipient_user_id=arjun_user.id, entity_type="salary_change",
             entity_id=arjun.id, notif_type="info",
             title="Salary Updated",
             message="Your salary has been updated to ₹65,000/mo. It will reflect in your next payslip.",
             action="emp-salary", priority="high", is_read=False, is_cc=False,
             dedup_key=f"salary_updated_{arjun.id}_demo", created_at=_ndt(200)),

        # Suresh — resignation acknowledged (info, high, unread)
        dict(recipient_user_id=suresh_user.id, entity_type="resignation",
             entity_id=rg_suresh.id, notif_type="info",
             title=f"Resignation Accepted — Last Working Day: {rg_suresh.last_working_date}",
             message=f"Your resignation has been accepted. Last working day: {rg_suresh.last_working_date}. Please complete the offboarding checklist.",
             action="emp-resignation", priority="high", is_read=False, is_cc=False,
             dedup_key=f"resignation_result_{rg_suresh.id}_demo", created_at=_ndt(90)),
    ]

    for n in notif_entries:
        created_at = n.pop("created_at")
        notif = Notification(**n)
        db.add(notif)
        db.flush()
        from sqlalchemy import update as sa_update
        db.execute(sa_update(Notification).where(Notification.id == notif.id).values(created_at=created_at))
    db.flush()

    db.commit()

    # ── Print credentials ─────────────────────────────────────
    print("✓ Done!\n")
    print("Login credentials:")
    print(f"  {'Role':<12} {'Username':<14} {'Password':<12} Email")
    print(f"  {'─'*12} {'─'*14} {'─'*12} {'─'*26}")
    for uname, full, email, pwd, role in users_spec:
        print(f"  {role:<12} {uname:<14} {pwd:<12} {email}")
    print()
    print("App URL: set DATABASE_URL to your Railway demo DB and deploy.")
    print()


# ── Entry point ───────────────────────────────────────────────

if __name__ == "__main__":
    args = sys.argv[1:]

    print("Creating tables if missing...")
    Base.metadata.create_all(bind=engine)
    print("  OK\n")

    db = SessionLocal()
    try:
        if "--wipe" in args:
            wipe(db)
        elif "--reset" in args:
            wipe(db)
            seed(db)
        else:
            seed(db)
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
