import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from backend import storage
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional
from pydantic import BaseModel
from datetime import date
from backend.database import get_db
from backend.models.employee import Employee, Department, Designation

router = APIRouter(prefix="/api/employees", tags=["Employees"])


class DeptIn(BaseModel):
    name: str
    parent_id: Optional[int] = None


class DesigIn(BaseModel):
    name: str
    description: Optional[str] = None


class EmployeeIn(BaseModel):
    first_name: str
    last_name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    date_of_joining: date
    status: str = "Active"
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    employment_type: str = "Full-time"
    bank_name: Optional[str] = None
    bank_account_no: Optional[str] = None
    bank_ifsc: Optional[str] = None
    bank_branch: Optional[str] = None
    aadhar_no: Optional[str] = None
    pan_no: Optional[str] = None
    basic_salary: Optional[float] = None
    hra_percent: float = 40.0
    special_allowance: float = 0.0
    lta: float = 0.0
    other_allowance: float = 0.0
    pf_applicable: bool = True
    esi_applicable: bool = True
    pt_state: str = "Karnataka"


class EmployeeCreateIn(EmployeeIn):
    username: str
    email: str  # required when creating
    password: Optional[str] = None  # optional when linking an existing account


# ── Departments ────────────────────────────────────────────────
@router.get("/departments")
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()


@router.post("/departments")
def create_department(data: DeptIn, db: Session = Depends(get_db)):
    dept = Department(**data.model_dump())
    db.add(dept)
    db.commit()
    db.refresh(dept)
    return dept


@router.put("/departments/{dept_id}")
def update_department(dept_id: int, data: DeptIn, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(404, "Department not found")
    dept.name = data.name
    db.commit()
    return {"ok": True}


@router.delete("/departments/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise HTTPException(404, "Department not found")
    db.delete(dept)
    db.commit()
    return {"ok": True}


# ── Designations ───────────────────────────────────────────────
@router.get("/designations")
def list_designations(db: Session = Depends(get_db)):
    return db.query(Designation).all()


@router.post("/designations")
def create_designation(data: DesigIn, db: Session = Depends(get_db)):
    desig = Designation(**data.model_dump())
    db.add(desig)
    db.commit()
    db.refresh(desig)
    return desig


@router.put("/designations/{desig_id}")
def update_designation(desig_id: int, data: DesigIn, db: Session = Depends(get_db)):
    desig = db.query(Designation).filter(Designation.id == desig_id).first()
    if not desig:
        raise HTTPException(404, "Designation not found")
    desig.name = data.name
    desig.description = data.description
    db.commit()
    return {"ok": True}


@router.delete("/designations/{desig_id}")
def delete_designation(desig_id: int, db: Session = Depends(get_db)):
    desig = db.query(Designation).filter(Designation.id == desig_id).first()
    if not desig:
        raise HTTPException(404, "Designation not found")
    db.delete(desig)
    db.commit()
    return {"ok": True}


# ── Employees ──────────────────────────────────────────────────
@router.get("")
def list_employees(
    search: Optional[str] = None,
    department_id: Optional[int] = None,
    status: Optional[str] = None,
    joined_month: Optional[str] = None,   # YYYY-MM  e.g. 2026-01
    page: int = 1,
    page_size: int = 50,
    all: bool = False,          # pass ?all=true for dropdowns that need every employee
    db: Session = Depends(get_db),
):
    q = db.query(Employee)
    if search:
        q = q.filter(
            or_(
                Employee.full_name.ilike(f"%{search}%"),
                Employee.email.ilike(f"%{search}%"),
                Employee.employee_id.ilike(f"%{search}%"),
            )
        )
    if department_id:
        q = q.filter(Employee.department_id == department_id)
    if status:
        q = q.filter(Employee.status == status)
    if joined_month:
        try:
            from datetime import date as _date
            year, month = map(int, joined_month.split("-"))
            import calendar
            last_day = calendar.monthrange(year, month)[1]
            q = q.filter(
                Employee.date_of_joining >= _date(year, month, 1),
                Employee.date_of_joining <= _date(year, month, last_day),
            )
        except Exception:
            pass

    total = q.count()

    if not all:
        page_size = min(page_size, 200)   # hard cap
        q = q.order_by(Employee.id).offset((page - 1) * page_size).limit(page_size)
    else:
        q = q.order_by(Employee.id)

    result = []
    for e in q.all():
        result.append({
            "id": e.id,
            "employee_id": e.employee_id,
            "full_name": e.full_name,
            "email": e.email,
            "mobile": e.mobile,
            "status": e.status,
            "date_of_joining": str(e.date_of_joining) if e.date_of_joining else None,
            "employment_type": e.employment_type,
            "department": e.department_rel.name if e.department_rel else None,
            "designation": e.designation_rel.name if e.designation_rel else None,
            "profile_photo": e.profile_photo,
            "basic_salary": e.basic_salary,
            "hra_percent": e.hra_percent if e.hra_percent is not None else 40.0,
            "special_allowance": e.special_allowance or 0.0,
            "lta": e.lta or 0.0,
            "other_allowance": e.other_allowance or 0.0,
            "pf_applicable": bool(e.pf_applicable if e.pf_applicable is not None else 1),
            "esi_applicable": bool(e.esi_applicable if e.esi_applicable is not None else 1),
            "pt_state": e.pt_state or "Karnataka",
        })

    if all:
        return result
    return {"data": result, "total": total, "page": page, "page_size": page_size, "total_pages": max(1, -(-total // page_size))}


@router.get("/{emp_id}")
def get_employee(emp_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
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
        "department_id": emp.department_id,
        "department": emp.department_rel.name if emp.department_rel else None,
        "designation_id": emp.designation_id,
        "designation": emp.designation_rel.name if emp.designation_rel else None,
        "employment_type": emp.employment_type,
        "bank_name": emp.bank_name,
        "bank_account_no": emp.bank_account_no,
        "bank_ifsc": emp.bank_ifsc,
        "bank_branch": emp.bank_branch,
        "aadhar_no": emp.aadhar_no,
        "pan_no": emp.pan_no,
        "basic_salary": emp.basic_salary,
        "hra_percent": emp.hra_percent if emp.hra_percent is not None else 40.0,
        "special_allowance": emp.special_allowance or 0.0,
        "lta": emp.lta or 0.0,
        "other_allowance": emp.other_allowance or 0.0,
        "pf_applicable": bool(emp.pf_applicable if emp.pf_applicable is not None else 1),
        "esi_applicable": bool(emp.esi_applicable if emp.esi_applicable is not None else 1),
        "pt_state": emp.pt_state or "Karnataka",
    }


@router.post("")
def create_employee(data: EmployeeCreateIn, db: Session = Depends(get_db)):
    from sqlalchemy import func
    from backend.models.auth import User
    from backend.auth_utils import get_password_hash

    # Block duplicate employee records (same email)
    if db.query(Employee).filter(Employee.email == data.email).first():
        raise HTTPException(400, "An employee with this email already exists")

    # Look for an existing user account with matching username or email
    existing_user = db.query(User).filter(
        (User.username == data.username) | (User.email == data.email)
    ).first()

    # If username is taken by a *different* email, reject it
    if existing_user and existing_user.email != data.email:
        raise HTTPException(400, "Username already taken by a different account")

    max_id = db.query(func.max(Employee.id)).scalar() or 0
    emp_id = f"EMP-{max_id + 1:04d}"
    full = f"{data.first_name} {data.last_name or ''}".strip()

    dump = data.model_dump(exclude={"username", "password"})
    dump["pf_applicable"] = 1 if dump.get("pf_applicable", True) else 0
    dump["esi_applicable"] = 1 if dump.get("esi_applicable", True) else 0
    emp = Employee(**dump, full_name=full, employee_id=emp_id)
    db.add(emp)

    if existing_user:
        # Link employee to the existing login account — keep their role intact
        existing_user.full_name = full
        emp.user_id = existing_user.id
    else:
        if not data.password:
            raise HTTPException(400, "Password is required for new accounts")
        user = User(
            username=data.username,
            email=data.email,
            full_name=full,
            hashed_password=get_password_hash(data.password),
            role="Employee",
            is_active=True,
        )
        db.add(user)

    db.commit()
    db.refresh(emp)
    return {"id": emp.id, "employee_id": emp.employee_id, "full_name": emp.full_name}


@router.put("/{emp_id}")
def update_employee(emp_id: int, data: EmployeeIn, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    dump = data.model_dump(exclude_unset=True)
    if "pf_applicable" in dump:
        dump["pf_applicable"] = 1 if dump["pf_applicable"] else 0
    if "esi_applicable" in dump:
        dump["esi_applicable"] = 1 if dump["esi_applicable"] else 0
    for k, v in dump.items():
        setattr(emp, k, v)
    emp.full_name = f"{emp.first_name} {emp.last_name or ''}".strip()
    db.commit()
    return {"ok": True}


@router.delete("/{emp_id}")
def delete_employee(emp_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import text
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    # Delete all related records before removing the employee
    tables = [
        "attendance", "leave_applications", "leave_balances",
        "salary_slips", "expense_claims", "appraisals",
        "employee_assets", "employee_documents", "emergency_contacts",
        "employee_history", "document_requests",
        "status_entries", "work_mode_entries",
    ]
    for tbl in tables:
        db.execute(text(f"DELETE FROM {tbl} WHERE employee_id = :eid"), {"eid": emp.id})
    db.delete(emp)
    db.commit()
    return {"ok": True}


@router.post("/{emp_id}/photo")
async def upload_employee_photo(emp_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("jpg", "jpeg", "png", "webp", "gif"):
        raise HTTPException(400, "Only JPG, PNG, WebP or GIF allowed")
    fname = f"emp_{emp_id}_{int(time.time())}.{ext}"
    url = storage.upload_file(await file.read(), "profiles", fname)
    emp.profile_photo = url
    db.commit()
    return {"profile_photo": url}
