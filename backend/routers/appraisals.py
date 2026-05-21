from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime
from backend.database import get_db
from backend.models.appraisal import Appraisal
from backend.auth_utils import decode_token
from backend.models.auth import User

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
    scores = [s for s in [a.self_score, a.manager_score, a.business_score, a.biz_head_score]
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
        "manager_score":  a.manager_score,
        "business_score": a.business_score,
        "biz_head_score": a.biz_head_score,
        "total_score": a.total_score,
        "created_at": str(a.created_at)[:10] if a.created_at else "",
    }
    if detail:
        out.update({
            "goals":         a.goals or [],
            "self_eval":     a.self_eval,
            "manager_eval":  a.manager_eval,
            "business_eval": a.business_eval,
            "biz_head_eval": a.biz_head_eval,
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


@router.delete("/{appraisal_id}")
def delete_appraisal(appraisal_id: int, db: Session = Depends(get_db)):
    a = db.query(Appraisal).filter(Appraisal.id == appraisal_id).first()
    if not a:
        raise HTTPException(404, "Not found")
    db.delete(a)
    db.commit()
    return {"ok": True}
