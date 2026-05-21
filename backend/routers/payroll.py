import calendar
from datetime import date as dt_date

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from backend.database import get_db
from backend.models.payroll import SalaryComponent, SalaryStructure, SalarySlip, PayrollEntry, PayrollRules
from backend.models.employee import Employee
from backend.models.leave import Attendance, LeaveApplication, LeaveType

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
    employee_ids: Optional[List[int]] = None
    overwrite: bool = False


class PayrollRulesIn(BaseModel):
    pf_employee_rate: float = 12.0
    pf_employee_cap: float = 1800.0
    pf_employer_rate: float = 12.0
    pf_employer_cap: float = 1800.0
    esi_employee_rate: float = 0.75
    esi_employer_rate: float = 3.25
    esi_wage_ceiling: float = 21000.0
    pt_enabled: bool = True
    default_hra_percent: float = 40.0
    lop_enabled: bool = False
    lop_basis: str = "calendar"
    gratuity_enabled: bool = False
    gratuity_rate: float = 4.81
    bonus_enabled: bool = False
    bonus_rate: float = 8.33
    bonus_wage_ceil: float = 7000.0
    custom_components: List[dict] = []


# ── Payroll Rules (single-row config) ─────────────────────────

def _default_rules_dict() -> dict:
    return {
        "pf_employee_rate": 12.0, "pf_employee_cap": 1800.0,
        "pf_employer_rate": 12.0, "pf_employer_cap": 1800.0,
        "esi_employee_rate": 0.75, "esi_employer_rate": 3.25,
        "esi_wage_ceiling": 21000.0, "pt_enabled": True,
        "default_hra_percent": 40.0, "lop_enabled": False,
        "lop_basis": "calendar", "gratuity_enabled": False,
        "gratuity_rate": 4.81, "bonus_enabled": False,
        "bonus_rate": 8.33, "bonus_wage_ceil": 7000.0,
        "custom_components": [],
    }


def _load_rules(db: Session) -> dict:
    rec = db.query(PayrollRules).filter(PayrollRules.id == 1).first()
    if not rec:
        return _default_rules_dict()
    return {
        "pf_employee_rate": rec.pf_employee_rate,
        "pf_employee_cap": rec.pf_employee_cap,
        "pf_employer_rate": rec.pf_employer_rate,
        "pf_employer_cap": rec.pf_employer_cap,
        "esi_employee_rate": rec.esi_employee_rate,
        "esi_employer_rate": rec.esi_employer_rate,
        "esi_wage_ceiling": rec.esi_wage_ceiling,
        "pt_enabled": rec.pt_enabled,
        "default_hra_percent": rec.default_hra_percent,
        "lop_enabled": rec.lop_enabled,
        "lop_basis": rec.lop_basis or "calendar",
        "gratuity_enabled": rec.gratuity_enabled,
        "gratuity_rate": rec.gratuity_rate,
        "bonus_enabled": rec.bonus_enabled,
        "bonus_rate": rec.bonus_rate,
        "bonus_wage_ceil": rec.bonus_wage_ceil,
        "custom_components": rec.custom_components or [],
    }


@router.get("/rules")
def get_payroll_rules(db: Session = Depends(get_db)):
    return _load_rules(db)


@router.put("/rules")
def save_payroll_rules(data: PayrollRulesIn, db: Session = Depends(get_db)):
    rec = db.query(PayrollRules).filter(PayrollRules.id == 1).first()
    payload = data.model_dump()
    if rec:
        for k, v in payload.items():
            setattr(rec, k, v)
    else:
        rec = PayrollRules(id=1, **payload)
        db.add(rec)
    db.commit()
    return {"ok": True}


# ── Payroll Calculation Engine ─────────────────────────────────

def calc_professional_tax(gross: float, state: str) -> float:
    state = (state or "").strip().lower()
    if state == "karnataka":
        return 200.0 if gross > 15000 else 150.0 if gross > 10000 else 0.0
    elif state == "maharashtra":
        return 200.0 if gross > 10000 else 0.0
    elif state in ("tamil nadu", "andhra pradesh", "telangana"):
        return 208.0 if gross > 15000 else 0.0
    return 0.0


def calculate_indian_payroll(
    emp: Employee,
    override_basic: Optional[float] = None,
    rules: Optional[dict] = None,
) -> dict:
    r = rules or _default_rules_dict()

    basic = override_basic if override_basic is not None else (emp.basic_salary or 0.0)
    hra_pct = emp.hra_percent if emp.hra_percent is not None else r["default_hra_percent"]
    special = emp.special_allowance or 0.0
    lta = emp.lta or 0.0
    other = emp.other_allowance or 0.0
    pf_ok  = bool(emp.pf_applicable if emp.pf_applicable is not None else 1)
    esi_ok = bool(emp.esi_applicable if emp.esi_applicable is not None else 1)
    pt_state = emp.pt_state or "Karnataka"

    hra = round(basic * hra_pct / 100, 2)

    # ── Build earnings list ──────────────────────────────────
    earnings = []
    if basic   > 0: earnings.append({"component": "Basic Salary",             "amount": basic})
    if hra     > 0: earnings.append({"component": "House Rent Allowance",     "amount": hra})
    if special > 0: earnings.append({"component": "Special Allowance",        "amount": special})
    if lta     > 0: earnings.append({"component": "Leave Travel Allowance",   "amount": lta})
    if other   > 0: earnings.append({"component": "Other Allowance",          "amount": other})

    # Custom earning components
    base_gross_for_pct = basic + hra + special + lta + other
    for comp in r.get("custom_components", []):
        if comp.get("component_type") != "Earning":
            continue
        val = float(comp.get("value", 0) or 0)
        ct = comp.get("calc_type", "fixed")
        if ct == "percent_of_basic":
            amt = round(basic * val / 100, 2)
        elif ct == "percent_of_gross":
            amt = round(base_gross_for_pct * val / 100, 2)
        else:
            amt = round(val, 2)
        if amt > 0:
            earnings.append({"component": comp["name"], "amount": amt})

    # Bonus (on earnings side)
    if r.get("bonus_enabled", False):
        bonus_base = min(basic, r.get("bonus_wage_ceil", 7000.0))
        bonus = round(bonus_base * r.get("bonus_rate", 8.33) / 100, 2)
        if bonus > 0:
            earnings.append({"component": "Bonus", "amount": bonus})

    gross = sum(e["amount"] for e in earnings)

    # ── Deductions ───────────────────────────────────────────
    # PF
    pf_emp_rate  = r["pf_employee_rate"] / 100
    pf_emp_cap   = r["pf_employee_cap"]
    pf_empl_rate = r["pf_employer_rate"] / 100
    pf_empl_cap  = r["pf_employer_cap"]

    if pf_ok:
        raw_pf  = basic * pf_emp_rate
        pf_emp  = round(min(raw_pf, pf_emp_cap) if pf_emp_cap > 0 else raw_pf)
        raw_pfl = basic * pf_empl_rate
        pf_employer = round(min(raw_pfl, pf_empl_cap) if pf_empl_cap > 0 else raw_pfl)
    else:
        pf_emp = pf_employer = 0

    # ESI
    esi_ceiling  = r["esi_wage_ceiling"]
    esi_emp_rate = r["esi_employee_rate"] / 100
    esi_empl_rate = r["esi_employer_rate"] / 100
    if gross <= esi_ceiling and esi_ok:
        esi_emp      = round(gross * esi_emp_rate)
        esi_employer = round(gross * esi_empl_rate)
    else:
        esi_emp = esi_employer = 0

    # PT
    pt = calc_professional_tax(gross, pt_state) if r.get("pt_enabled", True) else 0.0

    deductions = []
    if pf_emp      > 0: deductions.append({"component": "Provident Fund (Employee)",  "amount": pf_emp})
    if pf_employer > 0: deductions.append({"component": "PF Employer Contribution",   "amount": pf_employer, "employer_side": True})
    if esi_emp     > 0: deductions.append({"component": "ESI (Employee)",             "amount": esi_emp})
    if esi_employer > 0: deductions.append({"component": "ESI Employer Contribution", "amount": esi_employer, "employer_side": True})
    if pt          > 0: deductions.append({"component": "Professional Tax",           "amount": pt})

    # Gratuity (employer-side provision)
    gratuity_emp = 0.0
    if r.get("gratuity_enabled", False):
        gratuity_emp = round(basic * r.get("gratuity_rate", 4.81) / 100, 2)
        if gratuity_emp > 0:
            deductions.append({"component": "Gratuity (Employer Provision)", "amount": gratuity_emp, "employer_side": True})

    # Custom deduction components
    for comp in r.get("custom_components", []):
        if comp.get("component_type") != "Deduction":
            continue
        val = float(comp.get("value", 0) or 0)
        ct = comp.get("calc_type", "fixed")
        if ct == "percent_of_basic":
            amt = round(basic * val / 100, 2)
        elif ct == "percent_of_gross":
            amt = round(gross * val / 100, 2)
        else:
            amt = round(val, 2)
        if amt > 0:
            deductions.append({"component": comp["name"], "amount": amt})

    total_deduction = sum(d["amount"] for d in deductions if not d.get("employer_side"))
    net_pay = gross - total_deduction
    ctc = gross + pf_employer + esi_employer + gratuity_emp

    return {
        "basic": basic, "hra": hra,
        "special_allowance": special, "lta": lta, "other_allowance": other,
        "gross_pay": gross,
        "pf_employee": pf_emp, "pf_employer": pf_employer,
        "esi_employee": esi_emp, "esi_employer": esi_employer,
        "professional_tax": pt,
        "total_deduction": total_deduction,
        "net_pay": net_pay, "ctc": ctc,
        "earnings": earnings, "deductions": deductions,
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
    rules = _load_rules(db)

    q = db.query(Employee).filter(Employee.status == "Active")
    if data.employee_ids:
        q = q.filter(Employee.id.in_(data.employee_ids))
    employees = q.all()

    days_in_month = calendar.monthrange(data.year, data.month)[1]
    month_start = dt_date(data.year, data.month, 1)
    month_end   = dt_date(data.year, data.month, days_in_month)

    created = 0
    skipped = 0
    slip_summaries = []

    for emp in employees:
        if not emp.basic_salary:
            skipped += 1
            continue

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

        calc = calculate_indian_payroll(emp, rules=rules)

        # LOP deduction (if enabled)
        if rules.get("lop_enabled", False):
            att_rows = db.query(Attendance).filter(
                Attendance.employee_id == emp.id,
                Attendance.date >= month_start,
                Attendance.date <= month_end,
            ).all()
            absent_days = sum(1 for a in att_rows if a.status == "Absent")
            if absent_days > 0:
                if rules.get("lop_basis", "calendar") == "working":
                    divisor = max(days_in_month - 8, 20)  # approx working days
                else:
                    divisor = days_in_month
                lop_amt = round(calc["basic"] / divisor * absent_days, 2)
                if lop_amt > 0:
                    calc["deductions"].append({"component": f"Loss of Pay ({absent_days} day{'s' if absent_days > 1 else ''})", "amount": lop_amt})
                    calc["total_deduction"] = round(calc["total_deduction"] + lop_amt, 2)
                    calc["net_pay"] = round(calc["gross_pay"] - calc["total_deduction"], 2)

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

    entry = db.query(PayrollEntry).filter(
        PayrollEntry.month == data.month,
        PayrollEntry.year == data.year,
    ).first()
    total_gross = sum(s["gross_pay"] for s in slip_summaries)
    total_net = sum(s["net_pay"] for s in slip_summaries)
    if entry:
        entry.total_employees = created
        entry.total_gross = total_gross
        entry.total_net = total_net
    else:
        entry = PayrollEntry(
            month=data.month, year=data.year,
            company="Artech Solutions",
            total_employees=created,
            total_gross=total_gross,
            total_net=total_net,
        )
        db.add(entry)

    db.commit()
    return {
        "ok": True, "created": created, "skipped": skipped,
        "total_net": total_net, "slips": slip_summaries,
    }


@router.get("/preview/{emp_id}")
def preview_payroll(
    emp_id: int,
    basic_salary: Optional[float] = Query(None),
    db: Session = Depends(get_db),
):
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    rules = _load_rules(db)
    calc = calculate_indian_payroll(emp, override_basic=basic_salary, rules=rules)
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
    if employee_id: q = q.filter(SalarySlip.employee_id == employee_id)
    if month:       q = q.filter(SalarySlip.month == month)
    if year:        q = q.filter(SalarySlip.year == year)
    slips = q.order_by(SalarySlip.year.desc(), SalarySlip.month.desc()).all()
    return [{
        "id": s.id, "slip_id": s.slip_id,
        "employee_name": s.employee_rel.full_name if s.employee_rel else "",
        "month": s.month, "year": s.year,
        "gross_pay": s.gross_pay, "total_deduction": s.total_deduction,
        "net_pay": s.net_pay, "status": s.status,
    } for s in slips]


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
        slip_id=slip_id, employee_id=data.employee_id,
        month=data.month, year=data.year,
        earnings=data.earnings, deductions=data.deductions,
        gross_pay=gross, total_deduction=deductions, net_pay=net,
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
        "id": slip.id, "slip_id": slip.slip_id,
        "employee_id": emp.employee_id if emp else "",
        "employee_name": emp.full_name if emp else "",
        "designation": emp.designation_rel.name if emp and emp.designation_rel else "",
        "department": emp.department_rel.name if emp and emp.department_rel else "",
        "month": slip.month, "year": slip.year,
        "gross_pay": slip.gross_pay, "total_deduction": slip.total_deduction,
        "net_pay": slip.net_pay, "earnings": slip.earnings,
        "deductions": slip.deductions, "status": slip.status,
    }


# ── Payroll Entry ──────────────────────────────────────────────
@router.get("/entries")
def list_entries(db: Session = Depends(get_db)):
    entries = db.query(PayrollEntry).order_by(
        PayrollEntry.year.desc(), PayrollEntry.month.desc()
    ).all()
    return [{
        "id": e.id, "month": e.month, "year": e.year, "company": e.company,
        "status": e.status, "total_employees": e.total_employees, "total_net": e.total_net,
    } for e in entries]


@router.post("/entries")
def create_entry(data: PayrollEntryIn, db: Session = Depends(get_db)):
    entry = PayrollEntry(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {"id": entry.id}


# ── Payslip PDF ────────────────────────────────────────────────
@router.get("/slips/{slip_id}/pdf")
def download_slip_pdf(slip_id: int, db: Session = Depends(get_db)):
    from backend.payslip_pdf import generate_payslip_pdf

    slip = db.query(SalarySlip).filter(SalarySlip.id == slip_id).first()
    if not slip:
        raise HTTPException(404, "Slip not found")
    emp = slip.employee_rel
    if not emp:
        raise HTTPException(404, "Employee not found")

    days_in_month = calendar.monthrange(slip.year, slip.month)[1]
    first_day = dt_date(slip.year, slip.month, 1)
    last_day  = dt_date(slip.year, slip.month, days_in_month)

    att_records = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date >= first_day,
        Attendance.date <= last_day,
    ).all()
    days_present = sum(1 for a in att_records if a.status in ('Present', 'WFH', 'Half Day'))
    lop = sum(1 for a in att_records if a.status == 'Absent')

    leave_apps = (
        db.query(LeaveApplication)
        .join(LeaveType, LeaveApplication.leave_type_id == LeaveType.id)
        .filter(
            LeaveApplication.employee_id == emp.id,
            LeaveApplication.status == 'Approved',
            LeaveApplication.from_date <= last_day,
            LeaveApplication.to_date >= first_day,
        ).all()
    )
    cl = sl = el = 0
    for la in leave_apps:
        lt = (la.leave_type_rel.name or '').lower()
        d = float(la.total_days or 0)
        if 'casual' in lt: cl += d
        elif 'sick' in lt or 'medical' in lt: sl += d
        elif 'earned' in lt or 'annual' in lt or 'privilege' in lt: el += d

    earn = {'basic': 0.0, 'hra': 0.0, 'ca': 0.0, 'others': 0.0}
    for e in (slip.earnings or []):
        if e.get('employer_side'): continue
        comp = (e.get('component') or '').lower()
        amt  = float(e.get('amount', 0))
        if 'basic' in comp: earn['basic'] += amt
        elif 'hra' in comp or 'house rent' in comp: earn['hra'] += amt
        elif 'special' in comp or 'conveyance' in comp: earn['ca'] += amt
        else: earn['others'] += amt

    ded = {'pf': 0.0, 'esi': 0.0, 'pt': 0.0, 'tds': 0.0}
    for d in (slip.deductions or []):
        if d.get('employer_side'): continue
        comp = (d.get('component') or '').lower()
        amt  = float(d.get('amount', 0))
        if 'provident' in comp or ('pf' in comp and 'employer' not in comp): ded['pf'] += amt
        elif 'esi' in comp and 'employer' not in comp: ded['esi'] += amt
        elif 'professional' in comp: ded['pt'] += amt
        elif 'tds' in comp: ded['tds'] += amt

    slip_data = {
        'month': slip.month, 'year': slip.year,
        'employee_name': emp.full_name or '',
        'designation': emp.designation_rel.name if emp.designation_rel else '',
        'department': emp.department_rel.name  if emp.department_rel  else '',
        'date_of_joining': emp.date_of_joining,
        'bank_account_no': emp.bank_account_no or '',
        'pan': 'N/A',
        'days_in_month': days_in_month, 'days_present': days_present,
        'cl': int(cl), 'sl': int(sl), 'el': int(el), 'lop': lop,
        **earn, **ded,
        'gross_pay': slip.gross_pay or 0,
        'total_deduction': slip.total_deduction or 0,
        'net_pay': slip.net_pay or 0,
    }

    pdf_bytes = generate_payslip_pdf(slip_data)
    month_names = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    filename = f"Payslip_{month_names[slip.month]}_{slip.year}_{emp.full_name or emp.id}.pdf"

    return Response(
        content=pdf_bytes,
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'},
    )
