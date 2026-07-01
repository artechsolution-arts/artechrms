"""CEO Audit Log — unified timeline of all changes made by HR and employees."""
from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import Optional
from datetime import datetime
from backend.database import get_db
from backend.auth_utils import decode_token
from backend.models.auth import User

router = APIRouter(prefix="/api/audit", tags=["Audit Log"])


def _require_access(request: Request, db: Session) -> User:
    auth = request.headers.get("Authorization", "")
    username = decode_token(auth[7:]) if auth.startswith("Bearer ") else None
    if not username:
        raise HTTPException(401, "Not authenticated")
    user = db.query(User).filter(User.username == username).first()
    if not user or user.role not in ("CEO", "SuperAdmin", "HR"):
        raise HTTPException(403, "Access denied")
    return user


def _fmt_money(val) -> str | None:
    if val is None:
        return None
    try:
        n = float(val)
        if n >= 100_000:
            return f"₹{n/100_000:.2f}L"
        if n >= 1_000:
            return f"₹{n/1_000:.1f}K"
        return f"₹{n:,.0f}"
    except (TypeError, ValueError):
        return str(val)


def _activity_changes(changes_raw) -> list:
    """Normalize activity_log.changes → [{field, old, new}]."""
    if not changes_raw or not isinstance(changes_raw, dict):
        return []
    out = []
    for key, val in changes_raw.items():
        label = key.replace("_", " ").title()
        if isinstance(val, dict) and ("old" in val or "new" in val):
            out.append({
                "field": val.get("label", label),
                "old":   str(val["old"]) if val.get("old") is not None else None,
                "new":   str(val["new"]) if val.get("new") is not None else None,
            })
        elif isinstance(val, list):
            out.append({"field": label, "old": None, "new": ", ".join(str(v) for v in val)})
        elif isinstance(val, (str, int, float, bool)):
            out.append({"field": label, "old": None, "new": str(val)})
    return out


def _history_changes(h) -> list:
    """Convert employee_history record → [{field, old, new}]."""
    changes = []
    if h.from_department or h.to_department:
        changes.append({"field": "Department", "old": h.from_department, "new": h.to_department})
    if h.from_designation or h.to_designation:
        changes.append({"field": "Designation", "old": h.from_designation, "new": h.to_designation})
    if h.salary_before is not None or h.salary_after is not None:
        changes.append({"field": "Salary", "old": _fmt_money(h.salary_before), "new": _fmt_money(h.salary_after)})
    if h.last_working_date:
        changes.append({"field": "Last Working Date", "old": None, "new": str(h.last_working_date)})
    if h.remarks:
        changes.append({"field": "Remarks", "old": None, "new": h.remarks})
    return changes


def _profile_changes(changes_raw) -> list:
    if not changes_raw or not isinstance(changes_raw, dict):
        return []
    out = []
    for key, val in changes_raw.items():
        if isinstance(val, dict):
            out.append({
                "field": val.get("label", key.replace("_", " ").title()),
                "old":   str(val["old"]) if val.get("old") is not None else None,
                "new":   str(val["new"]) if val.get("new") is not None else None,
            })
        else:
            out.append({"field": key.replace("_", " ").title(), "old": None, "new": str(val) if val is not None else None})
    return out


@router.get("/log")
def get_audit_log(
    from_date:   Optional[str] = None,
    to_date:     Optional[str] = None,
    actor_role:  Optional[str] = None,   # HR | Employee | SuperAdmin | CEO
    action:      Optional[str] = None,   # CREATE | UPDATE | DELETE | APPROVE | REJECT | LOGIN | etc.
    entity_type: Optional[str] = None,   # Employee | Leave | Payroll | etc.
    source:      Optional[str] = None,   # activity | history | profile
    search:      Optional[str] = None,
    limit:       int = 50,
    offset:      int = 0,
    request: Request = None,
    db: Session = Depends(get_db),
):
    _require_access(request, db)

    from backend.models.activity_log import ActivityLog
    from backend.models.hrm import EmployeeHistory
    from backend.models.profile_update_log import ProfileUpdateLog
    from backend.models.employee import Employee

    try:
        from_dt = datetime.fromisoformat(from_date) if from_date else None
    except (ValueError, TypeError):
        from_dt = None
    try:
        to_dt = datetime.fromisoformat(to_date) if to_date else None
    except (ValueError, TypeError):
        to_dt = None

    entries = []

    # ── Source 1: activity_logs ────────────────────────────────────────────────
    include_activity = (not source or source == "activity")
    if include_activity:
        # For employee-only filter skip activity logs (those are HR/system actions)
        skip = actor_role and actor_role.lower() == "employee"
        if not skip:
            q = db.query(ActivityLog)
            if from_dt:     q = q.filter(ActivityLog.created_at >= from_dt)
            if to_dt:       q = q.filter(ActivityLog.created_at <= to_dt)
            if actor_role:  q = q.filter(ActivityLog.actor_role.ilike(f"%{actor_role}%"))
            if action:      q = q.filter(ActivityLog.action == action)
            if entity_type: q = q.filter(ActivityLog.entity_type.ilike(f"%{entity_type}%"))
            if search:
                q = q.filter(
                    ActivityLog.actor.ilike(f"%{search}%") |
                    ActivityLog.entity_name.ilike(f"%{search}%")
                )
            for log in q.order_by(desc(ActivityLog.created_at)).limit(3000).all():
                entries.append({
                    "id":          f"a_{log.id}",
                    "source":      "activity",
                    "timestamp":   log.created_at.isoformat() if log.created_at else "",
                    "actor":       log.actor or "system",
                    "actor_role":  log.actor_role or "System",
                    "action":      log.action or "ACTION",
                    "entity_type": log.entity_type or "System",
                    "entity_name": log.entity_name,
                    "entity_id":   log.entity_id,
                    "ip_address":  log.ip_address,
                    "changes":     _activity_changes(log.changes),
                })

    # ── Source 2: employee_history (HR-side structural changes) ───────────────
    include_history = (not source or source == "history")
    if include_history:
        skip = actor_role and actor_role.lower() == "employee"
        if not skip:
            q = db.query(EmployeeHistory)
            if from_dt: q = q.filter(EmployeeHistory.created_at >= from_dt)
            if to_dt:   q = q.filter(EmployeeHistory.created_at <= to_dt)
            if search:
                emp_ids = [e[0] for e in db.query(Employee.id).filter(
                    Employee.full_name.ilike(f"%{search}%")
                ).all()]
                q = q.filter(
                    EmployeeHistory.created_by.ilike(f"%{search}%") |
                    EmployeeHistory.employee_id.in_(emp_ids)
                )

            emp_cache = {}
            for h in q.order_by(desc(EmployeeHistory.created_at)).limit(3000).all():
                if h.employee_id not in emp_cache:
                    emp = db.query(Employee).filter(Employee.id == h.employee_id).first()
                    emp_cache[h.employee_id] = emp.full_name if emp else f"Employee #{h.employee_id}"
                action_key = h.change_type.upper().replace(" ", "_") if h.change_type else "HISTORY"
                # Apply action filter
                if action and action not in (action_key, h.change_type):
                    continue
                entries.append({
                    "id":          f"h_{h.id}",
                    "source":      "history",
                    "timestamp":   h.created_at.isoformat() if h.created_at else "",
                    "actor":       h.created_by or "HR",
                    "actor_role":  "HR",
                    "action":      action_key,
                    "entity_type": "Employee",
                    "entity_name": emp_cache[h.employee_id],
                    "entity_id":   str(h.employee_id),
                    "ip_address":  None,
                    "changes":     _history_changes(h),
                })

    # ── Source 3: profile_update_logs (employee self-edits) ───────────────────
    include_profile = (not source or source == "profile")
    if include_profile:
        # Only for employee-role filter (or no filter)
        skip = actor_role and actor_role.lower() not in ("employee", "")
        if not skip:
            q = db.query(ProfileUpdateLog)
            if from_dt: q = q.filter(ProfileUpdateLog.changed_at >= from_dt)
            if to_dt:   q = q.filter(ProfileUpdateLog.changed_at <= to_dt)
            if search:
                emp_ids = [e[0] for e in db.query(Employee.id).filter(
                    Employee.full_name.ilike(f"%{search}%") |
                    Employee.email.ilike(f"%{search}%")
                ).all()]
                q = q.filter(ProfileUpdateLog.employee_id.in_(emp_ids))

            emp_cache2 = {}
            for p in q.order_by(desc(ProfileUpdateLog.changed_at)).limit(1000).all():
                if p.employee_id not in emp_cache2:
                    emp = db.query(Employee).filter(Employee.id == p.employee_id).first()
                    emp_cache2[p.employee_id] = emp
                emp = emp_cache2[p.employee_id]
                emp_name   = emp.full_name if emp else f"Employee #{p.employee_id}"
                actor_name = (emp.email or emp.full_name) if emp else f"emp_{p.employee_id}"

                if action and action not in ("UPDATE", "PROFILE_UPDATE"):
                    continue
                if entity_type and entity_type.lower() not in ("employee", ""):
                    continue

                entries.append({
                    "id":          f"p_{p.id}",
                    "source":      "profile",
                    "timestamp":   p.changed_at.isoformat() if p.changed_at else "",
                    "actor":       actor_name,
                    "actor_role":  "Employee",
                    "action":      "PROFILE_UPDATE",
                    "entity_type": "Employee",
                    "entity_name": emp_name,
                    "entity_id":   str(p.employee_id),
                    "ip_address":  None,
                    "changes":     _profile_changes(p.changes),
                })

    # ── Sort by timestamp desc, paginate ──────────────────────────────────────
    entries.sort(key=lambda e: e["timestamp"], reverse=True)
    total = len(entries)
    return {
        "total":   total,
        "entries": entries[offset: offset + limit],
    }


@router.get("/summary")
def get_audit_summary(request: Request = None, db: Session = Depends(get_db)):
    """Quick stats for the audit log header."""
    _require_access(request, db)

    from backend.models.activity_log import ActivityLog
    from backend.models.hrm import EmployeeHistory
    from backend.models.profile_update_log import ProfileUpdateLog
    from datetime import timedelta

    now  = datetime.utcnow()
    day  = now - timedelta(days=1)
    week = now - timedelta(days=7)

    total_activity = db.query(ActivityLog).count()
    total_history  = db.query(EmployeeHistory).count()
    total_profile  = db.query(ProfileUpdateLog).count()

    today_changes = (
        db.query(ActivityLog).filter(ActivityLog.created_at >= day).count() +
        db.query(EmployeeHistory).filter(EmployeeHistory.created_at >= day).count() +
        db.query(ProfileUpdateLog).filter(ProfileUpdateLog.changed_at >= day).count()
    )
    week_changes = (
        db.query(ActivityLog).filter(ActivityLog.created_at >= week).count() +
        db.query(EmployeeHistory).filter(EmployeeHistory.created_at >= week).count() +
        db.query(ProfileUpdateLog).filter(ProfileUpdateLog.changed_at >= week).count()
    )

    action_counts = {}
    for row in db.query(ActivityLog.action, ActivityLog.id).all():
        action_counts[row[0]] = action_counts.get(row[0], 0) + 1

    return {
        "total":         total_activity + total_history + total_profile,
        "today_changes": today_changes,
        "week_changes":  week_changes,
        "action_counts": action_counts,
    }
