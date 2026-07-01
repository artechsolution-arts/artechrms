from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
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

@router.get("/list")
def list_onboarding(db: Session = Depends(get_db)):
    try:
        emps = db.query(Employee).filter(Employee.status.in_(["Active"])).order_by(Employee.date_of_joining.desc()).all()
        result = []
        for emp in emps:
            checklist = db.query(OnboardingChecklist).filter(OnboardingChecklist.employee_id == emp.id).first()
            if not checklist:
                items = _build_default_items(ONBOARDING_ITEMS)
            else:
                items = json.loads(checklist.items)
                for _, label in ONBOARDING_ITEMS:
                    if label not in items:
                        items[label] = {"done": False, "done_at": None, "note": ""}

            total = len(ONBOARDING_ITEMS)
            done  = sum(1 for v in items.values() if v.get("done"))
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


@router.put("/{employee_id}/section")
def save_onboarding_section(employee_id: int, data: SectionDataUpdate, db: Session = Depends(get_db)):
    from datetime import date as _date_type
    from backend.models.hrm import EmergencyContact

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
    checklist.updated_at = datetime.utcnow()
    db.commit()

    # Sync structured section data to Employee / EmergencyContact tables
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if emp and data.data:
        d = data.data
        emp_changed = False

        if data.section == "personal_info":
            if d.get("dob"):
                try:
                    emp.date_of_birth = _date_type.fromisoformat(d["dob"])
                    emp_changed = True
                except (ValueError, TypeError):
                    pass
            if d.get("present_address"):
                emp.residential_address = d["present_address"].strip()
                emp_changed = True
            # Emergency contact within personal_info
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
                emp_changed = True

        elif data.section == "documents":
            if d.get("aadhaar"):
                emp.aadhar_no = str(d["aadhaar"]).strip().replace(" ", "")
                emp_changed = True
            if d.get("pan"):
                emp.pan_no = str(d["pan"]).strip().upper()
                emp_changed = True

        if emp_changed:
            db.commit()

    return {"ok": True, "sections": sections}


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
            done  = sum(1 for v in items.values() if v.get("done"))
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
