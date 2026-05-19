from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from backend.database import get_db
from backend.models.appraisal import Appraisal

router = APIRouter(prefix="/api/appraisals", tags=["Appraisals"])


class AppraisalIn(BaseModel):
    employee_id: int
    period: str
    goals: List[dict] = []
    reviewer_comments: Optional[str] = None


@router.get("")
def list_appraisals(
    employee_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(Appraisal)
    if employee_id:
        q = q.filter(Appraisal.employee_id == employee_id)
    if status:
        q = q.filter(Appraisal.status == status)
    appraisals = q.order_by(Appraisal.created_at.desc()).all()
    result = []
    for a in appraisals:
        result.append({
            "id": a.id,
            "employee_name": a.employee_rel.full_name if a.employee_rel else "",
            "period": a.period,
            "total_score": a.total_score,
            "status": a.status,
        })
    return result


@router.post("")
def create_appraisal(data: AppraisalIn, db: Session = Depends(get_db)):
    scores = [float(g.get("score", 0)) for g in data.goals if g.get("score") is not None]
    avg = round(sum(scores) / len(scores), 2) if scores else 0
    appraisal = Appraisal(**data.model_dump(), total_score=avg)
    db.add(appraisal)
    db.commit()
    db.refresh(appraisal)
    return {"id": appraisal.id, "total_score": appraisal.total_score}


@router.put("/{appraisal_id}/submit")
def submit_appraisal(appraisal_id: int, db: Session = Depends(get_db)):
    appraisal = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not appraisal:
        raise HTTPException(404, "Appraisal not found")
    appraisal.status = "Submitted"
    db.commit()
    return {"ok": True}


@router.delete("/{appraisal_id}")
def delete_appraisal(appraisal_id: int, db: Session = Depends(get_db)):
    appraisal = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not appraisal:
        raise HTTPException(404, "Appraisal not found")
    db.delete(appraisal)
    db.commit()
    return {"ok": True}
