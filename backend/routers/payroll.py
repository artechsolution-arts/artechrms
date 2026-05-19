from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from backend.database import get_db
from backend.models.payroll import SalaryComponent, SalaryStructure, SalarySlip, PayrollEntry
from backend.models.employee import Employee

router = APIRouter(prefix="/api/payroll", tags=["Payroll"])


class ComponentIn(BaseModel):
    name: str
    abbr: Optional[str] = None
    component_type: str = "Earning"
    amount: float = 0
    formula: Optional[str] = None


class SlipIn(BaseModel):
    employee_id: int
    month: int
    year: int
    earnings: List[dict] = []
    deductions: List[dict] = []


class PayrollEntryIn(BaseModel):
    month: int
    year: int
    company: str = "Artech Solutions"
    notes: Optional[str] = None


class PayrollRunIn(BaseModel):
    month: int
    year: int
    employee_ids: Optional[List[int]] = None  # if None, run for all active employees
    overwrite: bool = False  # if True, delete existing slips for this month


# ── Indian Payroll Calculation Engine ─────────────────────────────────────────

def calc_professional_tax(gross: float, state: str) -> float:
    """Calculate Professional Tax based on state rules."""
    state = (state or "").strip().lower()
    if state == "karnataka":
        if gross > 15000:
            return 200.0
        elif gross > 10000:
            return 150.0
        else:
            return 0.0
    elif state == "maharashtra":
        return 200.0 if gross > 10000 else 0.0
    elif state in ("tamil nadu", "andhra pradesh", "telangana"):
        return 208.0 if gross > 15000 else 0.0
    else:
        return 0.0


def calculate_indian_payroll(emp: Employee, override_basic: Optional[float] = None) -> dict:
    """
    Calculate full Indian payroll breakdown for an employee.
    Returns dict with earnings, deductions, gross_pay, total_deduction, net_pay.
    """
    basic = override_basic if override_basic is not None else (emp.basic_salary or 0.0)
    hra_pct = emp.hra_percent if emp.hra_percent is not None else 40.0
    special = emp.special_allowance or 0.0
    lta = emp.lta or 0.0
    other = emp.other_allowance or 0.0
    pf_applicable = bool(emp.pf_applicable if emp.pf_applicable is not None else 1)
    esi_applicable = bool(emp.esi_applicable if emp.esi_applicable is not None else 1)
    pt_state = emp.pt_state or "Karnataka"

    # Earnings
    hra = round(basic * hra_pct / 100, 2)
    gross = basic + hra + special + lta + other

    # PF (Employee): 12% of basic, capped at 1800
    pf_emp = round(min(basic * 0.12, 1800)) if pf_applicable else 0
    # PF (Employer): same as employee PF
    pf_employer = round(min(basic * 0.12, 1800)) if pf_applicable else 0

    # ESI (Employee): 0.75% of gross if gross <= 21000 and applicable
    esi_emp = round(gross * 0.0075) if (gross <= 21000 and esi_applicable) else 0
    # ESI (Employer): 3.25% of gross if gross <= 21000
    esi_employer = round(gross * 0.0325) if gross <= 21000 else 0

    # Professional Tax
    pt = calc_professional_tax(gross, pt_state)

    # Total employee-side deductions (not employer contributions)
    total_deduction = pf_emp + esi_emp + pt

    # Net Pay
    net_pay = gross - total_deduction

    # Build earnings list (non-zero only)
    earnings = []
    if basic > 0:
        earnings.append({"component": "Basic Salary", "amount": basic})
    if hra > 0:
        earnings.append({"component": "House Rent Allowance", "amount": hra})
    if special > 0:
        earnings.append({"component": "Special Allowance", "amount": special})
    if lta > 0:
        earnings.append({"component": "Leave Travel Allowance", "amount": lta})
    if other > 0:
        earnings.append({"component": "Other Allowance", "amount": other})

    # Build deductions list (non-zero only, plus employer-side metadata)
    deductions = []
    if pf_emp > 0:
        deductions.append({"component": "Provident Fund (Employee)", "amount": pf_emp})
    if pf_employer > 0:
        deductions.append({"component": "PF Employer Contribution", "amount": pf_employer, "employer_side": True})
    if esi_emp > 0:
        deductions.append({"component": "ESI (Employee)", "amount": esi_emp})
    if esi_employer > 0:
        deductions.append({"component": "ESI Employer Contribution", "amount": esi_employer, "employer_side": True})
    if pt > 0:
        deductions.append({"component": "Professional Tax", "amount": pt})

    # CTC = gross + employer-side contributions
    ctc = gross + pf_employer + esi_employer

    return {
        "basic": basic,
        "hra": hra,
        "special_allowance": special,
        "lta": lta,
        "other_allowance": other,
        "gross_pay": gross,
        "pf_employee": pf_emp,
        "pf_employer": pf_employer,
        "esi_employee": esi_emp,
        "esi_employer": esi_employer,
        "professional_tax": pt,
        "total_deduction": total_deduction,
        "net_pay": net_pay,
        "ctc": ctc,
        "earnings": earnings,
        "deductions": deductions,
    }


# ── Salary Components ──────────────────────────────────────────
@router.get("/components")
def list_components(db: Session = Depends(get_db)):
    return db.query(SalaryComponent).all()


@router.post("/components")
def create_component(data: ComponentIn, db: Session = Depends(get_db)):
    comp = SalaryComponent(**data.model_dump())
    db.add(comp)
    db.commit()
    db.refresh(comp)
    return comp


@router.delete("/components/{comp_id}")
def delete_component(comp_id: int, db: Session = Depends(get_db)):
    comp = db.query(SalaryComponent).filter(SalaryComponent.id == comp_id).first()
    if not comp:
        raise HTTPException(404, "Component not found")
    db.delete(comp)
    db.commit()
    return {"ok": True}


# ── Payroll Run ────────────────────────────────────────────────

@router.post("/run")
def run_payroll(data: PayrollRunIn, db: Session = Depends(get_db)):
    """Run Indian payroll for a given month/year."""
    # Fetch employees
    q = db.query(Employee).filter(Employee.status == "Active")
    if data.employee_ids:
        q = q.filter(Employee.id.in_(data.employee_ids))
    employees = q.all()

    created = 0
    skipped = 0
    slip_summaries = []

    for emp in employees:
        if not emp.basic_salary:
            skipped += 1
            continue

        # Check for existing slip
        existing = db.query(SalarySlip).filter(
            SalarySlip.employee_id == emp.id,
            SalarySlip.month == data.month,
            SalarySlip.year == data.year,
        ).first()

        if existing:
            if not data.overwrite:
                skipped += 1
                continue
            db.delete(existing)
            db.flush()

        calc = calculate_indian_payroll(emp)

        count = db.query(SalarySlip).count()
        slip_id = f"SLIP-{data.year}-{data.month:02d}-{count + 1:04d}"

        slip = SalarySlip(
            slip_id=slip_id,
            employee_id=emp.id,
            month=data.month,
            year=data.year,
            earnings=calc["earnings"],
            deductions=calc["deductions"],
            gross_pay=calc["gross_pay"],
            total_deduction=calc["total_deduction"],
            net_pay=calc["net_pay"],
        )
        db.add(slip)
        created += 1
        slip_summaries.append({
            "employee_id": emp.id,
            "employee_name": emp.full_name,
            "basic": calc["basic"],
            "gross_pay": calc["gross_pay"],
            "pf": calc["pf_employee"],
            "esi": calc["esi_employee"],
            "pt": calc["professional_tax"],
            "net_pay": calc["net_pay"],
        })

    db.flush()

    # Upsert PayrollEntry for this month/year
    entry = db.query(PayrollEntry).filter(
        PayrollEntry.month == data.month,
        PayrollEntry.year == data.year,
    ).first()
    total_net = sum(s["net_pay"] for s in slip_summaries)
    if entry:
        entry.total_employees = (entry.total_employees or 0) + created
        entry.total_net = (entry.total_net or 0) + total_net
    else:
        entry = PayrollEntry(
            month=data.month,
            year=data.year,
            company="Artech Solutions",
            total_employees=created,
            total_net=total_net,
        )
        db.add(entry)

    db.commit()

    return {
        "ok": True,
        "created": created,
        "skipped": skipped,
        "total_net": total_net,
        "slips": slip_summaries,
    }


@router.get("/preview/{emp_id}")
def preview_payroll(
    emp_id: int,
    basic_salary: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    """Preview Indian payroll breakdown for a single employee."""
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    calc = calculate_indian_payroll(emp, override_basic=basic_salary)
    return {
        "employee_id": emp.id,
        "employee_name": emp.full_name,
        "designation": emp.designation_rel.name if emp.designation_rel else None,
        "department": emp.department_rel.name if emp.department_rel else None,
        **calc,
    }


# ── Salary Slips ───────────────────────────────────────────────
@router.get("/slips")
def list_slips(
    employee_id: Optional[int] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(SalarySlip)
    if employee_id:
        q = q.filter(SalarySlip.employee_id == employee_id)
    if month:
        q = q.filter(SalarySlip.month == month)
    if year:
        q = q.filter(SalarySlip.year == year)
    slips = q.order_by(SalarySlip.year.desc(), SalarySlip.month.desc()).all()
    result = []
    for s in slips:
        result.append({
            "id": s.id,
            "slip_id": s.slip_id,
            "employee_name": s.employee_rel.full_name if s.employee_rel else "",
            "month": s.month,
            "year": s.year,
            "gross_pay": s.gross_pay,
            "total_deduction": s.total_deduction,
            "net_pay": s.net_pay,
            "status": s.status,
        })
    return result


@router.post("/slips")
def create_slip(data: SlipIn, db: Session = Depends(get_db)):
    existing = db.query(SalarySlip).filter(
        SalarySlip.employee_id == data.employee_id,
        SalarySlip.month == data.month,
        SalarySlip.year == data.year,
    ).first()
    if existing:
        raise HTTPException(400, "Salary slip already exists for this month")
    count = db.query(SalarySlip).count()
    slip_id = f"SLIP-{data.year}-{data.month:02d}-{count + 1:04d}"
    gross = sum(float(e.get("amount", 0)) for e in data.earnings)
    deductions = sum(float(d.get("amount", 0)) for d in data.deductions)
    net = gross - deductions
    slip = SalarySlip(
        slip_id=slip_id,
        employee_id=data.employee_id,
        month=data.month,
        year=data.year,
        earnings=data.earnings,
        deductions=data.deductions,
        gross_pay=gross,
        total_deduction=deductions,
        net_pay=net,
    )
    db.add(slip)
    db.commit()
    db.refresh(slip)
    return {"id": slip.id, "slip_id": slip.slip_id, "net_pay": slip.net_pay}


@router.get("/slips/{slip_id}")
def get_slip(slip_id: int, db: Session = Depends(get_db)):
    slip = db.query(SalarySlip).filter(SalarySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(404, "Slip not found")
    emp = slip.employee_rel
    return {
        "id": slip.id,
        "slip_id": slip.slip_id,
        "employee_id": emp.employee_id if emp else "",
        "employee_name": emp.full_name if emp else "",
        "designation": emp.designation_rel.name if emp and emp.designation_rel else "",
        "department": emp.department_rel.name if emp and emp.department_rel else "",
        "month": slip.month,
        "year": slip.year,
        "gross_pay": slip.gross_pay,
        "total_deduction": slip.total_deduction,
        "net_pay": slip.net_pay,
        "earnings": slip.earnings,
        "deductions": slip.deductions,
        "status": slip.status,
    }


# ── Payroll Entry ──────────────────────────────────────────────
@router.get("/entries")
def list_entries(db: Session = Depends(get_db)):
    entries = db.query(PayrollEntry).order_by(
        PayrollEntry.year.desc(), PayrollEntry.month.desc()
    ).all()
    return [
        {
            "id": e.id,
            "month": e.month,
            "year": e.year,
            "company": e.company,
            "status": e.status,
            "total_employees": e.total_employees,
            "total_net": e.total_net,
        }
        for e in entries
    ]


@router.post("/entries")
def create_entry(data: PayrollEntryIn, db: Session = Depends(get_db)):
    entry = PayrollEntry(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id}
