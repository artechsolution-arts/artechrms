import time
from calendar import monthrange as _monthrange
from datetime import date, timedelta
from typing import Optional
from backend import storage

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.auth import User
from backend.models.employee import Employee
from backend.models.leave import LeaveType
from backend.models.hrm import (
    Announcement,
    EmergencyContact,
    EmployeeAsset,
    EmployeeDocument,
    EmployeeHistory,
    ExpenseClaim,
    Holiday,
    LeaveBalance,
)

router = APIRouter(prefix="/api/hrm", tags=["HRM"])

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _employee_or_404(emp_id: int, db: Session) -> Employee:
    emp = db.query(Employee).filter(Employee.id == emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


# ===========================================================================
# 1. EMERGENCY CONTACTS
# ===========================================================================

class EmergencyContactIn(BaseModel):
    name: str
    relationship_type: str
    phone: str
    email: Optional[str] = None
    is_primary: bool = False


@router.get("/employees/{emp_id}/emergency-contacts")
def list_emergency_contacts(emp_id: int, db: Session = Depends(get_db)):
    _employee_or_404(emp_id, db)
    contacts = (
        db.query(EmergencyContact)
        .filter(EmergencyContact.employee_id == emp_id)
        .all()
    )
    return [
        {
            "id": c.id,
            "employee_id": c.employee_id,
            "name": c.name,
            "relationship_type": c.relationship_type,
            "phone": c.phone,
            "email": c.email,
            "is_primary": c.is_primary,
            "created_at": str(c.created_at) if c.created_at else None,
        }
        for c in contacts
    ]


@router.post("/employees/{emp_id}/emergency-contacts", status_code=201)
def create_emergency_contact(
    emp_id: int, data: EmergencyContactIn, db: Session = Depends(get_db)
):
    _employee_or_404(emp_id, db)
    contact = EmergencyContact(employee_id=emp_id, **data.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return {"id": contact.id, "ok": True}


@router.put("/emergency-contacts/{contact_id}")
def update_emergency_contact(
    contact_id: int, data: EmergencyContactIn, db: Session = Depends(get_db)
):
    contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    db.commit()
    return {"ok": True}


@router.delete("/emergency-contacts/{contact_id}")
def delete_emergency_contact(contact_id: int, db: Session = Depends(get_db)):
    contact = db.query(EmergencyContact).filter(EmergencyContact.id == contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Emergency contact not found")
    db.delete(contact)
    db.commit()
    return {"ok": True}


# ===========================================================================
# 2. EMPLOYEE DOCUMENTS
# ===========================================================================

ALLOWED_DOC_TYPES = {
    "Aadhaar", "PAN", "Passport", "Offer Letter",
    "Experience Letter", "Education Certificate", "Other",
}


@router.get("/employees/{emp_id}/documents")
def list_documents(emp_id: int, db: Session = Depends(get_db)):
    _employee_or_404(emp_id, db)
    docs = (
        db.query(EmployeeDocument)
        .filter(EmployeeDocument.employee_id == emp_id)
        .order_by(EmployeeDocument.uploaded_at.desc())
        .all()
    )
    return [
        {
            "id": d.id,
            "employee_id": d.employee_id,
            "document_type": d.document_type,
            "document_name": d.document_name,
            "file_url": d.file_url,
            "uploaded_at": str(d.uploaded_at) if d.uploaded_at else None,
        }
        for d in docs
    ]


@router.post("/employees/{emp_id}/documents", status_code=201)
async def upload_document(
    emp_id: int,
    document_type: str = Query(..., description="Document type"),
    document_name: str = Query(..., description="Human-readable document name"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    _employee_or_404(emp_id, db)

    if document_type not in ALLOWED_DOC_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"document_type must be one of: {', '.join(sorted(ALLOWED_DOC_TYPES))}",
        )

    ext = (file.filename or "file").rsplit(".", 1)[-1].lower()
    fname = f"doc_{emp_id}_{int(time.time())}.{ext}"
    file_url = storage.upload_file(await file.read(), "documents", fname)
    doc = EmployeeDocument(
        employee_id=emp_id,
        document_type=document_type,
        document_name=document_name,
        file_url=file_url,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return {"id": doc.id, "file_url": file_url, "ok": True}


@router.delete("/documents/{doc_id}")
def delete_document(doc_id: int, db: Session = Depends(get_db)):
    doc = db.query(EmployeeDocument).filter(EmployeeDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    storage.delete_file(doc.file_url)
    db.delete(doc)
    db.commit()
    return {"ok": True}


# ===========================================================================
# 3. HOLIDAYS
# ===========================================================================

class HolidayIn(BaseModel):
    name: str
    date: date
    holiday_type: str = "Public"
    description: Optional[str] = None


@router.get("/holidays")
def list_holidays(year: Optional[int] = None, db: Session = Depends(get_db)):
    q = db.query(Holiday)
    if year:
        from sqlalchemy import extract
        q = q.filter(extract("year", Holiday.date) == year)
    holidays = q.order_by(Holiday.date).all()
    return [
        {
            "id": h.id,
            "name": h.name,
            "date": str(h.date),
            "holiday_type": h.holiday_type,
            "description": h.description,
            "created_at": str(h.created_at) if h.created_at else None,
        }
        for h in holidays
    ]


@router.post("/holidays", status_code=201)
def create_holiday(data: HolidayIn, db: Session = Depends(get_db)):
    holiday = Holiday(**data.model_dump())
    db.add(holiday)
    db.commit()
    db.refresh(holiday)
    return {"id": holiday.id, "ok": True}


@router.delete("/holidays/{holiday_id}")
def delete_holiday(holiday_id: int, db: Session = Depends(get_db)):
    holiday = db.query(Holiday).filter(Holiday.id == holiday_id).first()
    if not holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(holiday)
    db.commit()
    return {"ok": True}


# ===========================================================================
# 4. LEAVE BALANCES
# ===========================================================================

class LeaveBalanceAllocateIn(BaseModel):
    employee_id: int
    leave_type_id: int
    year: int
    allocated: float


class AllocateAllIn(BaseModel):
    year: int


@router.get("/leave-balances")
def list_leave_balances(
    employee_id: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
):
    q = db.query(LeaveBalance)
    if employee_id:
        q = q.filter(LeaveBalance.employee_id == employee_id)
    if year:
        q = q.filter(LeaveBalance.year == year)
    balances = q.all()
    result = []
    for b in balances:
        result.append({
            "id": b.id,
            "employee_id": b.employee_id,
            "employee_name": b.employee_rel.full_name if b.employee_rel else None,
            "leave_type_id": b.leave_type_id,
            "leave_type": b.leave_type_rel.name if b.leave_type_rel else None,
            "year": b.year,
            "allocated": b.allocated,
            "used": b.used,
            "carried_forward": b.carried_forward,
            "available": round(b.allocated + b.carried_forward - b.used, 2),
        })
    return result


@router.post("/leave-balances/allocate", status_code=201)
def allocate_leave_balance(data: LeaveBalanceAllocateIn, db: Session = Depends(get_db)):
    balance = (
        db.query(LeaveBalance)
        .filter(
            LeaveBalance.employee_id == data.employee_id,
            LeaveBalance.leave_type_id == data.leave_type_id,
            LeaveBalance.year == data.year,
        )
        .first()
    )
    if balance:
        balance.allocated = data.allocated
    else:
        balance = LeaveBalance(**data.model_dump())
        db.add(balance)
    db.commit()
    db.refresh(balance)
    return {"id": balance.id, "ok": True}


@router.post("/leave-balances/allocate-all", status_code=201)
def allocate_all_leave_balances(data: AllocateAllIn, db: Session = Depends(get_db)):
    employees = db.query(Employee).filter(Employee.status == "Active").all()
    leave_types = db.query(LeaveType).all()
    created = 0
    updated = 0
    for emp in employees:
        for lt in leave_types:
            balance = (
                db.query(LeaveBalance)
                .filter(
                    LeaveBalance.employee_id == emp.id,
                    LeaveBalance.leave_type_id == lt.id,
                    LeaveBalance.year == data.year,
                )
                .first()
            )
            if balance:
                balance.allocated = lt.max_leaves
                updated += 1
            else:
                balance = LeaveBalance(
                    employee_id=emp.id,
                    leave_type_id=lt.id,
                    year=data.year,
                    allocated=lt.max_leaves,
                    used=0,
                    carried_forward=0,
                )
                db.add(balance)
                created += 1
    db.commit()
    return {"ok": True, "created": created, "updated": updated, "year": data.year}


@router.get("/leave-balances/employee/{emp_id}")
def get_employee_leave_balances(emp_id: int, db: Session = Depends(get_db)):
    _employee_or_404(emp_id, db)
    balances = db.query(LeaveBalance).filter(LeaveBalance.employee_id == emp_id).all()
    return [
        {
            "id": b.id,
            "leave_type_id": b.leave_type_id,
            "leave_type": b.leave_type_rel.name if b.leave_type_rel else None,
            "year": b.year,
            "allocated": b.allocated,
            "used": b.used,
            "carried_forward": b.carried_forward,
            "available": round(b.allocated + b.carried_forward - b.used, 2),
        }
        for b in balances
    ]


# ===========================================================================
# 5. ANNOUNCEMENTS
# ===========================================================================

class AnnouncementIn(BaseModel):
    title: str
    content: str
    priority: str = "Medium"
    expires_on: Optional[date] = None
    created_by: Optional[str] = None


class AnnouncementUpdateIn(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    priority: Optional[str] = None
    is_active: Optional[bool] = None
    expires_on: Optional[date] = None


@router.get("/announcements")
def list_announcements(
    active_only: bool = False,
    db: Session = Depends(get_db),
):
    q = db.query(Announcement)
    if active_only:
        q = q.filter(Announcement.is_active == True)  # noqa: E712
    announcements = q.order_by(Announcement.created_at.desc()).all()
    return [
        {
            "id": a.id,
            "title": a.title,
            "content": a.content,
            "priority": a.priority,
            "is_active": a.is_active,
            "created_by": a.created_by,
            "created_at": str(a.created_at) if a.created_at else None,
            "expires_on": str(a.expires_on) if a.expires_on else None,
        }
        for a in announcements
    ]


@router.post("/announcements", status_code=201)
def create_announcement(data: AnnouncementIn, db: Session = Depends(get_db)):
    ann = Announcement(**data.model_dump())
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return {"id": ann.id, "ok": True}


@router.put("/announcements/{ann_id}")
def update_announcement(
    ann_id: int, data: AnnouncementUpdateIn, db: Session = Depends(get_db)
):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ann, field, value)
    db.commit()
    return {"ok": True}


@router.delete("/announcements/{ann_id}")
def delete_announcement(ann_id: int, db: Session = Depends(get_db)):
    ann = db.query(Announcement).filter(Announcement.id == ann_id).first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    db.delete(ann)
    db.commit()
    return {"ok": True}


# ===========================================================================
# 6. EXPENSE CLAIMS
# ===========================================================================

class ExpenseClaimIn(BaseModel):
    employee_id: int
    claim_date: date
    expense_type: str
    amount: float
    description: Optional[str] = None


class ExpenseActionIn(BaseModel):
    remarks: Optional[str] = None


@router.get("/expenses")
def list_expenses(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(ExpenseClaim)
    if employee_id:
        q = q.filter(ExpenseClaim.employee_id == employee_id)
    if status:
        q = q.filter(ExpenseClaim.status == status)
    expenses = q.order_by(ExpenseClaim.claim_date.desc()).all()
    return [
        {
            "id": e.id,
            "employee_id": e.employee_id,
            "employee_name": e.employee_rel.full_name if e.employee_rel else None,
            "claim_date": str(e.claim_date),
            "expense_type": e.expense_type,
            "amount": e.amount,
            "description": e.description,
            "receipt_url": e.receipt_url,
            "status": e.status,
            "approved_by": e.approved_by,
            "approved_on": str(e.approved_on) if e.approved_on else None,
            "remarks": e.remarks,
            "created_at": str(e.created_at) if e.created_at else None,
        }
        for e in expenses
    ]


@router.post("/expenses", status_code=201)
def create_expense(data: ExpenseClaimIn, db: Session = Depends(get_db)):
    _employee_or_404(data.employee_id, db)
    expense = ExpenseClaim(**data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {"id": expense.id, "ok": True}


@router.put("/expenses/{expense_id}/approve")
def approve_expense(
    expense_id: int, data: ExpenseActionIn, db: Session = Depends(get_db)
):
    expense = db.query(ExpenseClaim).filter(ExpenseClaim.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense claim not found")
    expense.status = "Approved"
    expense.remarks = data.remarks
    expense.approved_on = date.today()
    db.commit()
    return {"ok": True}


@router.put("/expenses/{expense_id}/reject")
def reject_expense(
    expense_id: int, data: ExpenseActionIn, db: Session = Depends(get_db)
):
    expense = db.query(ExpenseClaim).filter(ExpenseClaim.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense claim not found")
    expense.status = "Rejected"
    expense.remarks = data.remarks
    expense.approved_on = date.today()
    db.commit()
    return {"ok": True}


@router.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(ExpenseClaim).filter(ExpenseClaim.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense claim not found")
    db.delete(expense)
    db.commit()
    return {"ok": True}


# ===========================================================================
# 7. EMPLOYEE ASSETS
# ===========================================================================

class AssetIn(BaseModel):
    employee_id: int
    asset_name: str
    asset_type: str
    serial_number: Optional[str] = None
    allocated_date: date
    condition: str = "Good"
    notes: Optional[str] = None


class AssetReturnIn(BaseModel):
    returned_date: date
    condition: str = "Good"
    notes: Optional[str] = None


@router.get("/assets")
def list_assets(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(EmployeeAsset)
    if employee_id:
        q = q.filter(EmployeeAsset.employee_id == employee_id)
    if status:
        q = q.filter(EmployeeAsset.status == status)
    assets = q.order_by(EmployeeAsset.allocated_date.desc()).all()
    return [
        {
            "id": a.id,
            "employee_id": a.employee_id,
            "employee_name": a.employee_rel.full_name if a.employee_rel else None,
            "asset_name": a.asset_name,
            "asset_type": a.asset_type,
            "serial_number": a.serial_number,
            "allocated_date": str(a.allocated_date),
            "returned_date": str(a.returned_date) if a.returned_date else None,
            "condition": a.condition,
            "notes": a.notes,
            "status": a.status,
            "created_at": str(a.created_at) if a.created_at else None,
        }
        for a in assets
    ]


@router.post("/assets", status_code=201)
def create_asset(data: AssetIn, db: Session = Depends(get_db)):
    _employee_or_404(data.employee_id, db)
    asset = EmployeeAsset(**data.model_dump())
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return {"id": asset.id, "ok": True}


@router.put("/assets/{asset_id}/return")
def return_asset(
    asset_id: int, data: AssetReturnIn, db: Session = Depends(get_db)
):
    asset = db.query(EmployeeAsset).filter(EmployeeAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    asset.returned_date = data.returned_date
    asset.condition = data.condition
    asset.notes = data.notes
    asset.status = "Returned"
    db.commit()
    return {"ok": True}


@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    asset = db.query(EmployeeAsset).filter(EmployeeAsset.id == asset_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    db.delete(asset)
    db.commit()
    return {"ok": True}


# ===========================================================================
# 8. EMPLOYEE HISTORY
# ===========================================================================

class EmployeeHistoryIn(BaseModel):
    change_type: str = "Transfer"
    from_department: Optional[str] = None
    to_department: Optional[str] = None
    from_designation: Optional[str] = None
    to_designation: Optional[str] = None
    effective_date: date
    remarks: Optional[str] = None
    created_by: Optional[str] = None


@router.get("/employees/{emp_id}/history")
def get_employee_history(emp_id: int, db: Session = Depends(get_db)):
    _employee_or_404(emp_id, db)
    records = (
        db.query(EmployeeHistory)
        .filter(EmployeeHistory.employee_id == emp_id)
        .order_by(EmployeeHistory.effective_date.desc())
        .all()
    )
    return [
        {
            "id": r.id,
            "employee_id": r.employee_id,
            "change_type": r.change_type,
            "from_department": r.from_department,
            "to_department": r.to_department,
            "from_designation": r.from_designation,
            "to_designation": r.to_designation,
            "effective_date": str(r.effective_date),
            "remarks": r.remarks,
            "created_by": r.created_by,
            "created_at": str(r.created_at) if r.created_at else None,
        }
        for r in records
    ]


@router.post("/employees/{emp_id}/history", status_code=201)
def add_employee_history(
    emp_id: int, data: EmployeeHistoryIn, db: Session = Depends(get_db)
):
    _employee_or_404(emp_id, db)
    record = EmployeeHistory(employee_id=emp_id, **data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return {"id": record.id, "ok": True}


# ===========================================================================
# DOCUMENT REQUESTS (HR side)
# ===========================================================================

from backend.models.document_request import DocumentRequest
from backend.models.employee import Employee as _Emp
from datetime import datetime as _dt


@router.get("/document-requests")
def list_document_requests(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(DocumentRequest).join(_Emp, DocumentRequest.employee_id == _Emp.id)
    if status and status != "All":
        q = q.filter(DocumentRequest.status == status)
    rows = q.order_by(DocumentRequest.requested_at.desc()).all()
    return [
        {
            "id": r.id,
            "employee_id": r.employee_id,
            "employee_name": r.employee.full_name if r.employee else "—",
            "employee_code": r.employee.employee_id if r.employee else "—",
            "doc_type": r.doc_type,
            "remarks": r.remarks,
            "status": r.status,
            "requested_at": str(r.requested_at)[:10],
            "fulfilled_at": str(r.fulfilled_at)[:10] if r.fulfilled_at else None,
            "file_url": r.file_url,
            "file_name": r.file_name,
        }
        for r in rows
    ]


@router.post("/document-requests/{req_id}/upload")
async def upload_document_request(req_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    req = db.query(DocumentRequest).filter(DocumentRequest.id == req_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "doc", "docx", "jpg", "jpeg", "png"):
        raise HTTPException(400, "Allowed formats: PDF, DOC, DOCX, JPG, PNG")
    fname = f"req_{req_id}_{int(time.time())}.{ext}"
    req.file_url = storage.upload_file(await file.read(), "documents", fname)
    req.file_name = file.filename
    req.status = "Fulfilled"
    req.fulfilled_at = _dt.utcnow()
    db.commit()
    return {"file_url": req.file_url, "ok": True}


# ── Status Sheets (HR read-only view) ─────────────────────────

from backend.models.status_entry import StatusEntry as _StatusEntry


@router.get("/status")
def hr_get_status(employee_id: int, month: str, db: Session = Depends(get_db)):
    try:
        year, mon = map(int, month.split("-"))
    except Exception:
        raise HTTPException(400, "Use YYYY-MM format")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")

    start = date(year, mon, 1)
    end = date(year, mon, _monthrange(year, mon)[1])

    entries = (
        db.query(_StatusEntry)
        .filter(
            _StatusEntry.employee_id == employee_id,
            _StatusEntry.entry_date >= start,
            _StatusEntry.entry_date <= end,
        )
        .order_by(_StatusEntry.entry_date.asc())
        .all()
    )

    return {
        "employee_name": emp.full_name,
        "employee_code": emp.employee_id,
        "entries": [
            {
                "id": e.id,
                "task_id": e.task_id,
                "entry_date": str(e.entry_date),
                "task_name": e.task_name,
                "due_date": str(e.due_date) if e.due_date else None,
                "status": e.status,
                "percent_complete": e.percent_complete or 0,
            }
            for e in entries
        ],
    }


# ── Work Mode Sheet (HR view + approve/reject) ─────────────────

from datetime import datetime as _wm_dt
from backend.models.work_mode_entry import WorkModeEntry as _WMEntry
from pydantic import BaseModel as _BaseModel
from typing import Optional as _Optional


class _WMAction(_BaseModel):
    remarks: _Optional[str] = None


def _wm_hr_dict(e) -> dict:
    return {
        "id":            e.id,
        "employee_id":   e.employee.id if e.employee else None,
        "employee_name": e.employee.full_name if e.employee else "—",
        "employee_code": e.employee.employee_id if e.employee else "—",
        "entry_date":    str(e.entry_date),
        "work_mode":     e.work_mode,
        "reason":        e.reason,
        "duration":      e.duration,
        "status":        e.status,
        "hr_remarks":    e.hr_remarks,
        "created_at":    str(e.created_at)[:10],
    }


@router.get("/work-mode")
def hr_list_work_mode(
    month: str,
    employee_id: _Optional[int] = None,
    status: _Optional[str] = None,
    db: Session = Depends(get_db),
):
    try:
        year, mon = map(int, month.split("-"))
    except Exception:
        raise HTTPException(400, "Use YYYY-MM format")
    from calendar import monthrange as _mr
    start = date(year, mon, 1)
    end   = date(year, mon, _mr(year, mon)[1])

    q = db.query(_WMEntry).filter(
        _WMEntry.entry_date >= start,
        _WMEntry.entry_date <= end,
    )
    if employee_id:
        q = q.filter(_WMEntry.employee_id == employee_id)
    if status:
        q = q.filter(_WMEntry.status == status)

    rows = q.order_by(_WMEntry.entry_date.asc()).all()
    return [_wm_hr_dict(r) for r in rows]


@router.put("/work-mode/{entry_id}/approve")
def hr_approve_work_mode(entry_id: int, data: _WMAction = _WMAction(), db: Session = Depends(get_db)):
    entry = db.query(_WMEntry).filter(_WMEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    entry.status = "Approved"
    if data.remarks:
        entry.hr_remarks = data.remarks
    entry.updated_at = _wm_dt.utcnow()
    db.commit()
    return {"ok": True, "status": "Approved"}


@router.put("/work-mode/{entry_id}/reject")
def hr_reject_work_mode(entry_id: int, data: _WMAction = _WMAction(), db: Session = Depends(get_db)):
    entry = db.query(_WMEntry).filter(_WMEntry.id == entry_id).first()
    if not entry:
        raise HTTPException(404, "Entry not found")
    entry.status = "Rejected"
    if data.remarks:
        entry.hr_remarks = data.remarks
    entry.updated_at = _wm_dt.utcnow()
    db.commit()
    return {"ok": True, "status": "Rejected"}


# ── Edit / Correction Requests (HR view) ──────────────────────

from backend.models.edit_request import EditRequest as _EditReq
from datetime import datetime as _er_dt


class _ResolveIn(BaseModel):
    hr_remarks: Optional[str] = None


@router.get("/edit-requests")
def hr_list_edit_requests(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(_EditReq)
    if status and status != "All":
        q = q.filter(_EditReq.status == status)
    rows = q.order_by(_EditReq.created_at.desc()).all()
    return [
        {
            "id":            r.id,
            "employee_id":   r.employee_id,
            "employee_name": r.employee.full_name if r.employee else "—",
            "employee_code": r.employee.employee_id if r.employee else "—",
            "request_type":  r.request_type,
            "target_date":   str(r.target_date),
            "description":   r.description,
            "reason":        r.reason,
            "status":        r.status,
            "hr_remarks":    r.hr_remarks,
            "created_at":    str(r.created_at)[:10],
            "resolved_at":   str(r.resolved_at)[:10] if r.resolved_at else None,
        }
        for r in rows
    ]


@router.put("/edit-requests/{req_id}/approve")
def hr_approve_edit_request(req_id: int, data: _ResolveIn = _ResolveIn(), db: Session = Depends(get_db)):
    req = db.query(_EditReq).filter(_EditReq.id == req_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    req.status = "Approved"
    req.hr_remarks = data.hr_remarks
    req.resolved_at = _er_dt.utcnow()
    db.commit()
    return {"ok": True}


@router.put("/edit-requests/{req_id}/reject")
def hr_reject_edit_request(req_id: int, data: _ResolveIn = _ResolveIn(), db: Session = Depends(get_db)):
    req = db.query(_EditReq).filter(_EditReq.id == req_id).first()
    if not req:
        raise HTTPException(404, "Request not found")
    req.status = "Rejected"
    req.hr_remarks = data.hr_remarks
    req.resolved_at = _er_dt.utcnow()
    db.commit()
    return {"ok": True}
