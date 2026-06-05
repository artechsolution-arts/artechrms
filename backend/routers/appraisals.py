from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
import time, uuid
from backend.database import get_db
from backend.models.appraisal import Appraisal
from backend.auth_utils import decode_token
from backend.models.auth import User
from backend import storage

router = APIRouter(prefix="/api/appraisals", tags=["Appraisals"])

STATUS_FLOW = ["Goals Set", "Self Evaluated", "Manager Evaluated", "Business Evaluated", "Completed"]


def _username(request: Request) -> str:
    auth = request.headers.get("Authorization", "")
    return decode_token(auth[7:]) if auth.startswith("Bearer ") else "HR"


def _weighted_score(goals: list, eval_data: dict) -> Optional[float]:
    """Return weighted average score (1–5) for a stage, or None if no scores."""
    if not eval_data or not eval_data.get("scores"):
        return None
    scores_map = {int(s["idx"]): float(s["score"]) for s in eval_data["scores"]
                  if s.get("score") is not None and s.get("score") != ""}
    if not scores_map:
        return None
    total_w, weighted_sum = 0.0, 0.0
    for i, g in enumerate(goals or []):
        if i in scores_map:
            w = float(g.get("weight") or 1)
            weighted_sum += scores_map[i] * w
            total_w += w
    return round(weighted_sum / total_w, 2) if total_w else None


def _total(a: Appraisal) -> float:
    scores = [s for s in [a.self_score, a.hr_score, a.manager_score, a.ceo_score, a.business_score, a.biz_head_score]
              if s is not None]
    return round(sum(scores) / len(scores), 2) if scores else 0.0


def _ser(a: Appraisal, detail=False) -> dict:
    emp = a.employee_rel
    out = {
        "id": a.id,
        "employee_id": a.employee_id,
        "employee_name": emp.full_name if emp else "",
        "department": emp.department_rel.name if emp and emp.department_rel else "",
        "designation": emp.designation_rel.name if emp and emp.designation_rel else "",
        "period": a.period,
        "status": a.status,
        "self_score":     a.self_score,
        "hr_score":       a.hr_score,
        "manager_score":  a.manager_score,
        "ceo_score":      a.ceo_score,
        "business_score": a.business_score,
        "biz_head_score": a.biz_head_score,
        "total_score": a.total_score,
        "created_at": str(a.created_at)[:10] if a.created_at else "",
    }
    if detail:
        out.update({
            "goals":          a.goals or [],
            "self_eval":      a.self_eval,
            "hr_eval":        a.hr_eval,
            "manager_eval":   a.manager_eval,
            "ceo_eval":       a.ceo_eval,
            "business_eval":  a.business_eval,
            "biz_head_eval":  a.biz_head_eval,
            "perf_documents": a.perf_documents or [],
        })
    return out


# ── Pydantic schemas ─────────────────────────────────────────────

class GoalItem(BaseModel):
    title: str
    weight: float = 10.0
    target: str = ""


class AppraisalCreate(BaseModel):
    employee_id: int
    period: str
    goals: List[GoalItem] = []


class GoalsUpdate(BaseModel):
    goals: List[GoalItem]


class EvalIn(BaseModel):
    scores: List[dict]             # [{idx, score, comments}]
    overall_comments: str = ""


# ── Endpoints ────────────────────────────────────────────────────

@router.get("")
def list_appraisals(status: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Appraisal)
    if status:
        q = q.filter(Appraisal.status == status)
    return [_ser(a) for a in q.order_by(Appraisal.created_at.desc()).all()]


@router.get("/{appraisal_id}")
def get_appraisal(appraisal_id: int, db: Session = Depends(get_db)):
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    return _ser(a, detail=True)


@router.post("", status_code=201)
def create_appraisal(data: AppraisalCreate, db: Session = Depends(get_db)):
    goals = [{"title": g.title.strip(), "weight": g.weight, "target": g.target.strip()}
             for g in data.goals if g.title.strip()]
    a = Appraisal(
        employee_id=data.employee_id,
        period=data.period.strip(),
        goals=goals,
        status="Goals Set",
        total_score=0,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return {"id": a.id}


@router.put("/{appraisal_id}/goals")
def update_goals(appraisal_id: int, data: GoalsUpdate, db: Session = Depends(get_db)):
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    if a.status != "Goals Set":
        raise HTTPException(400, "Goals can only be edited before self-evaluation starts")
    a.goals = [{"title": g.title.strip(), "weight": g.weight, "target": g.target.strip()}
               for g in data.goals if g.title.strip()]
    db.commit()
    return {"ok": True}


def _do_eval(a: Appraisal, eval_field: str, score_field: str,
             data: EvalIn, by: str, next_status: str, db: Session):
    payload = {
        "scores": data.scores,
        "overall_comments": data.overall_comments,
        "submitted_at": datetime.utcnow().isoformat(),
        "submitted_by": by,
    }
    setattr(a, eval_field, payload)
    setattr(a, score_field, _weighted_score(a.goals or [], payload))
    a.status = next_status
    a.total_score = _total(a)
    db.commit()


@router.put("/{appraisal_id}/manager-eval")
def submit_manager_eval(appraisal_id: int, data: EvalIn, request: Request, db: Session = Depends(get_db)):
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    if a.status != "Self Evaluated":
        raise HTTPException(400, f"Expected status 'Self Evaluated', got '{a.status}'")
    _do_eval(a, "manager_eval", "manager_score", data, _username(request), "Manager Evaluated", db)
    return {"ok": True}


@router.put("/{appraisal_id}/business-eval")
def submit_business_eval(appraisal_id: int, data: EvalIn, request: Request, db: Session = Depends(get_db)):
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    if a.status != "Manager Evaluated":
        raise HTTPException(400, f"Expected status 'Manager Evaluated', got '{a.status}'")
    _do_eval(a, "business_eval", "business_score", data, _username(request), "Business Evaluated", db)
    return {"ok": True}


@router.put("/{appraisal_id}/biz-head-eval")
def submit_biz_head_eval(appraisal_id: int, data: EvalIn, request: Request, db: Session = Depends(get_db)):
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    if a.status != "Business Evaluated":
        raise HTTPException(400, f"Expected status 'Business Evaluated', got '{a.status}'")
    _do_eval(a, "biz_head_eval", "biz_head_score", data, _username(request), "Completed", db)
    return {"ok": True}


@router.put("/{appraisal_id}/hr-eval")
def submit_hr_eval(appraisal_id: int, data: EvalIn, request: Request, db: Session = Depends(get_db)):
    """HR can submit evaluation at any stage after Goals Set."""
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    payload = {
        "scores": data.scores,
        "overall_comments": data.overall_comments,
        "submitted_at": datetime.utcnow().isoformat(),
        "submitted_by": _username(request),
    }
    a.hr_eval = payload
    a.hr_score = _weighted_score(a.goals or [], payload)
    a.total_score = _total(a)
    db.commit()
    return {"ok": True}


@router.put("/{appraisal_id}/ceo-eval")
def submit_ceo_eval(appraisal_id: int, data: EvalIn, request: Request, db: Session = Depends(get_db)):
    """CEO can submit evaluation at any stage after Goals Set."""
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    payload = {
        "scores": data.scores,
        "overall_comments": data.overall_comments,
        "submitted_at": datetime.utcnow().isoformat(),
        "submitted_by": _username(request),
    }
    a.ceo_eval = payload
    a.ceo_score = _weighted_score(a.goals or [], payload)
    a.total_score = _total(a)
    db.commit()
    return {"ok": True}


@router.post("/{appraisal_id}/documents/upload")
async def upload_perf_document(
    appraisal_id: int,
    file: UploadFile = File(...),
    request: Request = None,
    db: Session = Depends(get_db),
):
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    if ext not in ("pdf", "doc", "docx", "jpg", "jpeg", "png", "xlsx", "pptx"):
        raise HTTPException(400, "Unsupported file type")
    fname = f"appraisal_{appraisal_id}_{int(time.time())}.{ext}"
    url = storage.upload_file(await file.read(), "documents", fname)
    docs = list(a.perf_documents or [])
    doc_entry = {
        "id": str(uuid.uuid4())[:8],
        "name": file.filename,
        "url": url,
        "uploaded_by": _username(request),
        "uploaded_at": datetime.utcnow().isoformat(),
        "type": ext.upper(),
    }
    docs.append(doc_entry)
    a.perf_documents = docs
    db.commit()
    return {"ok": True, "document": doc_entry}


@router.delete("/{appraisal_id}/documents/{doc_id}")
def delete_perf_document(appraisal_id: int, doc_id: str, db: Session = Depends(get_db)):
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    a.perf_documents = [d for d in (a.perf_documents or []) if d.get("id") != doc_id]
    db.commit()
    return {"ok": True}


@router.delete("/{appraisal_id}")
def delete_appraisal(appraisal_id: int, db: Session = Depends(get_db)):
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    db.delete(a)
    db.commit()
    return {"ok": True}
