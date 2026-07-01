from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel
from typing import Optional
import json, time
from datetime import datetime

from backend.database import get_db
from backend.models.employee import Employee
from backend.models.onboarding import (
    OnboardingChecklist, OffboardingChecklist,
    ONBOARDING_ITEMS, OFFBOARDING_ITEMS,
)
from backend import storage

JOINING_DOC_KEYS = [
    "offer_letter", "employment_agreement", "nda",
    "hr_policy", "code_of_conduct", "it_policy",
]

router = APIRouter(prefix="/api/onboarding", tags=["Onboarding"])


def _build_default_items(item_list):
    return {item: {"done": False, "done_at": None, "note": ""} for _, item in item_list}


def _emp_summary(emp):
    return {
        "id": emp.id,
        "employee_id": emp.employee_id,
        "full_name": emp.full_name,
        "designation": emp.designation_rel.name if emp.designation_rel else None,
        "department": emp.department_rel.name if emp.department_rel else None,
        "profile_photo": emp.profile_photo,
        "date_of_joining": str(emp.date_of_joining) if emp.date_of_joining else None,
        "status": emp.status,
    }


# ─── Onboarding ────────────────────────────────────────────────

# Wizard sections that count toward onboarding progress (excludes activity_log viewer)
PROGRESS_SECTIONS = ['personal_info', 'employment', 'documents', 'education',
                     'experience', 'assets', 'it_access', 'training', 'checklist']

def _section_has_data(section_val: dict) -> bool:
    """Return True if a section has any meaningful non-empty data."""
    if not isinstance(section_val, dict):
        return False
    d = section_val.get("data") or {}
    if not d:
        return False
    # assets: needs at least one row
    if "assets" in d:
        return bool(d.get("assets"))
    # it_access: any toggle enabled
    if any(k in d for k in ('email', 'system', 'vpn', 'slack', 'jira', 'github', 'cloud', 'erp')):
        return any(d.get(k) for k in ('email', 'system', 'vpn', 'slack', 'jira', 'github', 'cloud', 'erp'))
    # checklist: any item ticked
    if all(isinstance(v, bool) for v in d.values() if not isinstance(v, str)):
        return any(d.values())
    # generic: any non-empty value
    return any(v not in (None, '', False, [], {}) for v in d.values())


@router.get("/list")
def list_onboarding(db: Session = Depends(get_db)):
    try:
        emps = db.query(Employee).filter(Employee.status.in_(["Active"])).order_by(Employee.date_of_joining.desc()).all()
        result = []
        for emp in emps:
            checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == emp.id).first()
            if not checklist:
                items = _build_default_items(ONBOARDING_ITEMS)
                sections = {}
            else:
                items = json.loads(checklist.items)
                for _, label in ONBOARDING_ITEMS:
                    if label not in items:
                        items[label] = {"done": False, "done_at": None, "note": ""}
                sections = items.get("__sections__", {})

            total = len(PROGRESS_SECTIONS)
            done  = sum(1 for key in PROGRESS_SECTIONS if _section_has_data(sections.get(key, {})))
            result.append({**_emp_summary(emp), "progress": done, "total": total, "items": items})
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/{employee_id}")
def get_onboarding(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        items = _build_default_items(ONBOARDING_ITEMS)
    else:
        items = json.loads(checklist.items)
        for _, label in ONBOARDING_ITEMS:
            if label not in items:
                items[label] = {"done": False, "done_at": None, "note": ""}
    return {**_emp_summary(emp), "items": items, "structure": ONBOARDING_ITEMS}


class ChecklistUpdate(BaseModel):
    item: str
    done: bool
    note: Optional[str] = ""

SECTION_LABELS = {
    "personal_info": "Personal Information", "employment": "Employment Details",
    "documents": "Documents", "education": "Education",
    "experience": "Experience", "assets": "Asset Assignment",
    "it_access": "IT Access", "training": "Training",
    "checklist": "Onboarding Checklist", "activity_log": "Activity Log",
    "employee_info": "Employee Info", "exit_details": "Exit Details",
    "notice_period": "Notice Period", "knowledge_transfer": "Knowledge Transfer",
    "assets_return": "Assets Return", "access_revocation": "Access Revocation",
    "exit_interview": "Exit Interview", "final_settlement": "Final Settlement",
}

class SectionDataUpdate(BaseModel):
    section: str
    data: dict
    action: str = "save"      # save | add_row | update_row | delete_row
    row_summary: str = ""     # human-readable description of the change
    changed_by: str = "HR"


def _append_history(payload: dict, entry: dict):
    history = payload.get("__history__", [])
    history.append(entry)
    if len(history) > 200:           # cap at 200 entries
        history = history[-200:]
    payload["__history__"] = history


def _apply_section_to_emp(emp, section: str, d: dict, db):
    """Apply a single onboarding section dict to the Employee ORM object.
    Returns True if any field was changed (caller must commit)."""
    from datetime import date as _date_type
    from backend.models.hrm import EmergencyContact

    changed = False

    if section == "personal_info":
        if d.get("dob"):
            try:
                emp.date_of_birth = _date_type.fromisoformat(d["dob"]); changed = True
            except (ValueError, TypeError): pass
        if d.get("present_address"):
            emp.residential_address = d["present_address"].strip(); changed = True
        if d.get("mobile"):
            emp.mobile = str(d["mobile"]).strip(); changed = True
        if d.get("gender"):
            emp.gender = d["gender"].strip(); changed = True
        if d.get("blood_group"):
            emp.blood_group = d["blood_group"].strip(); changed = True
        if d.get("marital_status"):
            emp.marital_status = d["marital_status"].strip(); changed = True
        if d.get("personal_email"):
            emp.personal_email = d["personal_email"].strip(); changed = True
        if d.get("alt_mobile"):
            emp.alt_mobile = str(d["alt_mobile"]).strip(); changed = True
        if d.get("permanent_address"):
            emp.permanent_address = d["permanent_address"].strip(); changed = True
        ec_name = (d.get("emergency_name") or "").strip()
        if ec_name:
            existing = db.query(EmergencyContact).filter(EmergencyContact.employee_id == emp.id).first()
            if existing:
                existing.name = ec_name
                existing.relationship_type = d.get("emergency_relation") or "Other"
                existing.phone = d.get("emergency_phone") or ""
            else:
                db.add(EmergencyContact(
                    employee_id=emp.id, name=ec_name,
                    relationship_type=d.get("emergency_relation") or "Other",
                    phone=d.get("emergency_phone") or "", is_primary=True,
                ))
            changed = True

    elif section == "employment":
        if d.get("employment_type"):
            emp.employment_type = d["employment_type"].strip(); changed = True
        rid = d.get("reporting_manager_id")
        if rid is not None:
            try:
                emp.reports_to_id = int(rid) if rid else None; changed = True
            except (ValueError, TypeError): pass
        np_ = d.get("notice_period")
        if np_ is not None and str(np_).strip() != "":
            try:
                emp.notice_period_days = int(np_); changed = True
            except (ValueError, TypeError): pass
        pp = d.get("probation_period")
        if pp is not None and str(pp).strip() != "":
            try:
                emp.probation_period_days = int(pp); changed = True
            except (ValueError, TypeError): pass
        if d.get("work_location"):
            emp.work_location = d["work_location"].strip(); changed = True
        if d.get("shift"):
            emp.shift = d["shift"].strip(); changed = True
        if d.get("confirmation_date"):
            try:
                emp.confirmation_date = _date_type.fromisoformat(d["confirmation_date"]); changed = True
            except (ValueError, TypeError): pass

    elif section == "documents":
        if d.get("aadhaar"):
            emp.aadhar_no = str(d["aadhaar"]).strip().replace(" ", ""); changed = True
        if d.get("pan"):
            emp.pan_no = str(d["pan"]).strip().upper(); changed = True
        if d.get("passport"):
            emp.passport_no = str(d["passport"]).strip(); changed = True
        if d.get("driving_license"):
            emp.driving_license_no = str(d["driving_license"]).strip(); changed = True
        if d.get("voter_id"):
            emp.voter_id_no = str(d["voter_id"]).strip(); changed = True
        if d.get("pf_number"):
            emp.pf_number = str(d["pf_number"]).strip(); changed = True
        if d.get("esi_number"):
            emp.esi_number = str(d["esi_number"]).strip(); changed = True

    elif section == "education":
        entries = d.get("entries")
        if isinstance(entries, list):
            emp.education = entries; changed = True

    elif section == "experience":
        entries = d.get("entries")
        if isinstance(entries, list):
            emp.experience = entries; changed = True

    elif section == "it_access":
        # Sync official email from IT Access to employee record
        if d.get("email") and d.get("email_user"):
            emp.official_email = d["email_user"].strip(); changed = True

    return changed


@router.put("/{employee_id}/section")
def save_onboarding_section(employee_id: int, data: SectionDataUpdate, db: Session = Depends(get_db)):

    checklist = db.query(OnboardingChecklist).filter(
        OnboardingChecklist.employee_id == employee_id
    ).with_for_update().first()
    if not checklist:
        items = _build_default_items(ONBOARDING_ITEMS)
        checklist = OnboardingChecklist(employee_id=employee_id, items=json.dumps({"__sections__": {}, "__history__": [], **items}))
        db.add(checklist)
    payload = json.loads(checklist.items)
    sections = payload.get("__sections__", {})
    sections[data.section] = {"data": data.data, "saved_at": datetime.utcnow().isoformat()}
    payload["__sections__"] = sections
    section_label = SECTION_LABELS.get(data.section, data.section.replace("_", " ").title())
    _append_history(payload, {
        "id":         f"{data.section}_{int(datetime.utcnow().timestamp()*1000)}",
        "timestamp":  datetime.utcnow().isoformat(),
        "section":    data.section,
        "section_label": section_label,
        "action":     data.action,
        "summary":    data.row_summary or f"{section_label} — {data.action.replace('_', ' ')}",
        "changed_by": data.changed_by,
    })
    checklist.items = json.dumps(payload)
    flag_modified(checklist, 'items')   # force SQLAlchemy to include in UPDATE
    checklist.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(checklist)              # confirm the write landed in DB

    # Sync this section's data to Employee record
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if emp and data.data:
        if _apply_section_to_emp(emp, data.section, data.data, db):
            db.commit()

    return {"ok": True, "sections": sections}


@router.post("/{employee_id}/sync-to-employee")
def sync_onboarding_to_employee(employee_id: int, db: Session = Depends(get_db)):
    """Push ALL stored onboarding section data into the Employee record.
    Safe to call multiple times — later values overwrite earlier ones."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        return {"ok": True, "synced": []}

    payload = json.loads(checklist.items)
    sections = payload.get("__sections__", {})
    synced = []
    changed = False
    for section_key, section_val in sections.items():
        d = section_val.get("data") if isinstance(section_val, dict) else None
        if not d:
            continue
        if _apply_section_to_emp(emp, section_key, d, db):
            synced.append(section_key)
            changed = True

    if changed:
        db.commit()

    return {"ok": True, "synced": synced}


@router.get("/{employee_id}/sections")
def get_onboarding_sections(employee_id: int, db: Session = Depends(get_db)):
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        return {"sections": {}, "history": []}
    payload = json.loads(checklist.items)
    return {"sections": payload.get("__sections__", {}), "history": payload.get("__history__", [])}


@router.get("/{employee_id}/history")
def get_onboarding_history(employee_id: int, db: Session = Depends(get_db)):
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        return {"history": []}
    payload = json.loads(checklist.items)
    return {"history": list(reversed(payload.get("__history__", [])))}  # newest first


@router.put("/{employee_id}/item")
def update_onboarding_item(employee_id: int, data: ChecklistUpdate, db: Session = Depends(get_db)):
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        items = _build_default_items(ONBOARDING_ITEMS)
        checklist = OnboardingChecklist(employee_id=employee_id, items=json.dumps(items))
        db.add(checklist)
    else:
        items = json.loads(checklist.items)

    items[data.item] = {
        "done": data.done,
        "done_at": datetime.utcnow().isoformat() if data.done else None,
        "note": data.note or "",
    }
    checklist.items = json.dumps(items)
    checklist.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "items": items}


# ─── Offboarding ───────────────────────────────────────────────

@router.get("/offboarding/list")
def list_offboarding(db: Session = Depends(get_db)):
    try:
        from backend.models.resignation import Resignation
        resigned_ids = {r[0] for r in db.query(Resignation.employee_id).all()}
        left_ids     = {e.id for e in db.query(Employee).filter(Employee.status.in_(["Inactive", "Left"])).all()}
        target_ids   = resigned_ids | left_ids

        existing_ids = {c.employee_id for c in db.query(OffboardingChecklist).all()}
        all_ids      = target_ids | existing_ids

        result = []
        for eid in all_ids:
            emp = db.query(Employee).filter(Employee.id == eid).first()
            if not emp:
                continue
            checklist = db.query(OffboardingChecklist).filter(OffboardingChecklist.employee_id == eid).first()
            if not checklist:
                items = _build_default_items(OFFBOARDING_ITEMS)
            else:
                items = json.loads(checklist.items)
                for _, label in OFFBOARDING_ITEMS:
                    if label not in items:
                        items[label] = {"done": False, "done_at": None, "note": ""}

            total = len(OFFBOARDING_ITEMS)
            done  = sum(1 for k, v in items.items() if not k.startswith('__') and isinstance(v, dict) and v.get("done"))
            result.append({**_emp_summary(emp), "progress": done, "total": total, "items": items})
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.get("/offboarding/{employee_id}")
def get_offboarding(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    checklist = db.query(OffboardingChecklist).filter(OffboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        items = _build_default_items(OFFBOARDING_ITEMS)
    else:
        items = json.loads(checklist.items)
        for _, label in OFFBOARDING_ITEMS:
            if label not in items:
                items[label] = {"done": False, "done_at": None, "note": ""}
    return {**_emp_summary(emp), "items": items, "structure": OFFBOARDING_ITEMS}


@router.put("/offboarding/{employee_id}/section")
def save_offboarding_section(employee_id: int, data: SectionDataUpdate, db: Session = Depends(get_db)):
    checklist = db.query(OffboardingChecklist).filter(
        OffboardingChecklist.employee_id == employee_id
    ).with_for_update().first()
    if not checklist:
        items = _build_default_items(OFFBOARDING_ITEMS)
        checklist = OffboardingChecklist(employee_id=employee_id, items=json.dumps({"__sections__": {}, "__history__": [], **items}))
        db.add(checklist)
    payload = json.loads(checklist.items)
    sections = payload.get("__sections__", {})
    sections[data.section] = {"data": data.data, "saved_at": datetime.utcnow().isoformat()}
    payload["__sections__"] = sections
    section_label = SECTION_LABELS.get(data.section, data.section.replace("_", " ").title())
    _append_history(payload, {
        "id":         f"{data.section}_{int(datetime.utcnow().timestamp()*1000)}",
        "timestamp":  datetime.utcnow().isoformat(),
        "section":    data.section,
        "section_label": section_label,
        "action":     data.action,
        "summary":    data.row_summary or f"{section_label} — {data.action.replace('_', ' ')}",
        "changed_by": data.changed_by,
    })
    checklist.items = json.dumps(payload)
    checklist.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "sections": sections}


@router.get("/offboarding/{employee_id}/sections")
def get_offboarding_sections(employee_id: int, db: Session = Depends(get_db)):
    checklist = db.query(OffboardingChecklist).filter(OffboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        return {"sections": {}, "history": []}
    payload = json.loads(checklist.items)
    return {"sections": payload.get("__sections__", {}), "history": payload.get("__history__", [])}


@router.get("/offboarding/{employee_id}/history")
def get_offboarding_history(employee_id: int, db: Session = Depends(get_db)):
    checklist = db.query(OffboardingChecklist).filter(OffboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        return {"history": []}
    payload = json.loads(checklist.items)
    return {"history": list(reversed(payload.get("__history__", [])))}


@router.put("/offboarding/{employee_id}/item")
def update_offboarding_item(employee_id: int, data: ChecklistUpdate, db: Session = Depends(get_db)):
    checklist = db.query(OffboardingChecklist).filter(OffboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        items = _build_default_items(OFFBOARDING_ITEMS)
        checklist = OffboardingChecklist(employee_id=employee_id, items=json.dumps(items))
        db.add(checklist)
    else:
        items = json.loads(checklist.items)

    items[data.item] = {
        "done": data.done,
        "done_at": datetime.utcnow().isoformat() if data.done else None,
        "note": data.note or "",
    }
    checklist.items = json.dumps(items)
    checklist.updated_at = datetime.utcnow()
    db.commit()
    return {"ok": True, "items": items}


@router.post("/offboarding/{employee_id}/initiate")
def initiate_offboarding(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    existing = db.query(OffboardingChecklist).filter(OffboardingChecklist.employee_id == employee_id).first()
    if existing:
        return {"ok": True, "message": "Already initiated"}
    items = _build_default_items(OFFBOARDING_ITEMS)
    checklist = OffboardingChecklist(employee_id=employee_id, items=json.dumps(items))
    db.add(checklist)
    db.commit()
    return {"ok": True, "message": "Offboarding initiated"}


# ─── HR Joining Documents (uploaded by HR during employee creation) ───

def _get_hr_docs(employee_id: int, db: Session) -> dict:
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        return {}
    try:
        payload = json.loads(checklist.items)
        return payload.get("__hr_docs__", {})
    except Exception:
        return {}


def _save_hr_docs(employee_id: int, hr_docs: dict, db: Session):
    checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == employee_id).first()
    if not checklist:
        checklist = OnboardingChecklist(employee_id=employee_id, items=json.dumps({"__hr_docs__": hr_docs}))
        db.add(checklist)
    else:
        payload = json.loads(checklist.items)
        payload["__hr_docs__"] = hr_docs
        checklist.items = json.dumps(payload)
    db.commit()


@router.get("/{employee_id}/hr-docs")
def get_hr_docs(employee_id: int, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    docs = _get_hr_docs(employee_id, db)
    return {"employee_id": employee_id, "docs": docs}


@router.post("/{employee_id}/hr-docs/upload/{doc_key}")
async def upload_hr_joining_doc(
    employee_id: int,
    doc_key: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if doc_key not in JOINING_DOC_KEYS:
        raise HTTPException(400, f"Invalid doc_key. Must be one of: {JOINING_DOC_KEYS}")
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(404, "Employee not found")
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "doc", "docx", "jpg", "jpeg", "png"):
        raise HTTPException(400, "Allowed: PDF, DOC, DOCX, JPG, PNG")
    fname = f"hr_doc_{employee_id}_{doc_key}_{int(time.time())}.{ext}"
    url = storage.upload_file(await file.read(), "documents", fname)
    hr_docs = _get_hr_docs(employee_id, db)
    hr_docs[doc_key] = {
        "file_url": url,
        "file_name": file.filename,
        "uploaded_at": datetime.utcnow().isoformat(),
    }
    _save_hr_docs(employee_id, hr_docs, db)
    return {"ok": True, "doc_key": doc_key, "file_url": url, "file_name": file.filename}


@router.delete("/{employee_id}/hr-docs/{doc_key}")
def delete_hr_joining_doc(employee_id: int, doc_key: str, db: Session = Depends(get_db)):
    hr_docs = _get_hr_docs(employee_id, db)
    if doc_key in hr_docs:
        del hr_docs[doc_key]
        _save_hr_docs(employee_id, hr_docs, db)
    return {"ok": True}
