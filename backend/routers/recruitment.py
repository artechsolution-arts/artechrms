import time
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from backend import storage
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import date
from backend.database import get_db
from backend.models.recruitment import JobOpening, JobApplicant

router = APIRouter(prefix="/api/recruitment", tags=["Recruitment"])


class JobOpeningIn(BaseModel):
    title: str
    department_id: Optional[int] = None
    designation_id: Optional[int] = None
    no_of_positions: int = 1
    closes_on: Optional[date] = None
    description: Optional[str] = None
    expected_ctc: Optional[float] = None
    social_platforms: Optional[List[str]] = []


class JobApplicantIn(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    job_opening_id: int
    cover_letter: Optional[str] = None


# ── Job Openings ───────────────────────────────────────────────
@router.get("/openings")
def list_openings(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(JobOpening)
    if status:
        q = q.filter(JobOpening.status == status)
    openings = q.order_by(JobOpening.created_at.desc()).all()
    result = []
    for o in openings:
        applicant_count = db.query(JobApplicant).filter(
            JobApplicant.job_opening_id == o.id
        ).count()
        result.append({
            "id": o.id,
            "title": o.title,
            "description": o.description,
            "no_of_positions": o.no_of_positions,
            "status": o.status,
            "closes_on": str(o.closes_on) if o.closes_on else None,
            "expected_ctc": o.expected_ctc,
            "applicant_count": applicant_count,
            "attachment_url": o.attachment_url,
            "attachment_name": o.attachment_name,
            "social_platforms": o.social_platforms or [],
        })
    return result


@router.post("/openings")
def create_opening(data: JobOpeningIn, db: Session = Depends(get_db)):
    opening = JobOpening(**data.model_dump())
    db.add(opening)
    db.commit()
    db.refresh(opening)
    return {
        "id": opening.id,
        "title": opening.title,
        "description": opening.description,
        "no_of_positions": opening.no_of_positions,
        "status": opening.status,
        "closes_on": str(opening.closes_on) if opening.closes_on else None,
        "expected_ctc": opening.expected_ctc,
        "attachment_url": opening.attachment_url,
        "attachment_name": opening.attachment_name,
        "social_platforms": opening.social_platforms or [],
    }


@router.post("/openings/{opening_id}/attachment")
async def upload_attachment(opening_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    opening = db.query(JobOpening).filter(JobOpening.id == opening_id).first()
    if not opening:
        raise HTTPException(404, "Job Opening not found")
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "doc", "docx", "txt"):
        raise HTTPException(400, "Only PDF, DOC, DOCX or TXT files allowed")
    fname = f"jd_{opening_id}_{int(time.time())}.{ext}"
    opening.attachment_url = storage.upload_file(await file.read(), "jd", fname)
    opening.attachment_name = file.filename
    db.commit()
    return {"attachment_url": opening.attachment_url, "attachment_name": opening.attachment_name}


@router.put("/openings/{opening_id}/close")
def close_opening(opening_id: int, db: Session = Depends(get_db)):
    opening = db.query(JobOpening).filter(JobOpening.id == opening_id).first()
    if not opening:
        raise HTTPException(404, "Job Opening not found")
    opening.status = "Closed"
    db.commit()
    return {"ok": True}


@router.delete("/openings/{opening_id}")
def delete_opening(opening_id: int, db: Session = Depends(get_db)):
    opening = db.query(JobOpening).filter(JobOpening.id == opening_id).first()
    if not opening:
        raise HTTPException(404, "Job Opening not found")
    db.delete(opening)
    db.commit()
    return {"ok": True}


# ── Job Applicants ─────────────────────────────────────────────
@router.get("/applicants")
def list_applicants(
    job_opening_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(JobApplicant)
    if job_opening_id:
        q = q.filter(JobApplicant.job_opening_id == job_opening_id)
    if status:
        q = q.filter(JobApplicant.status == status)
    applicants = q.order_by(JobApplicant.created_at.desc()).all()
    result = []
    for a in applicants:
        opening = db.query(JobOpening).filter(JobOpening.id == a.job_opening_id).first()
        result.append({
            "id": a.id,
            "name": a.name,
            "email": a.email,
            "phone": a.phone,
            "job_title": opening.title if opening else "",
            "status": a.status,
            "created_at": str(a.created_at)[:10] if a.created_at else "",
        })
    return result


@router.post("/applicants")
def create_applicant(data: JobApplicantIn, db: Session = Depends(get_db)):
    applicant = JobApplicant(**data.model_dump())
    db.add(applicant)
    db.commit()
    db.refresh(applicant)
    return {"id": applicant.id}


@router.put("/applicants/{app_id}/status")
def update_applicant_status(app_id: int, status: str, db: Session = Depends(get_db)):
    applicant = db.query(JobApplicant).filter(JobApplicant.id == app_id).first()
    if not applicant:
        raise HTTPException(404, "Applicant not found")
    applicant.status = status
    db.commit()
    return {"ok": True}
