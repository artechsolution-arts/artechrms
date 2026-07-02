
"""
Central approval workflow engine.
Approval flows are configured in the approval_workflows table — not hardcoded in modules.
Default configs are seeded on startup via seed_workflows().
"""
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models.approval import ApprovalWorkflow, ApprovalRequest, ApprovalStep
from backend.models.auth import User

# ── Default workflow configs (used when the DB row doesn't exist yet) ─────────
_DEFAULTS = {
    "leave": {
        "levels": [{"level": 1, "role": "HR"}],
        "cc_roles": ["CEO"],
    },
    "hr_leave": {
        "levels": [{"level": 1, "role": "CEO"}],
        "cc_roles": [],
    },
    "salary_change": {
        "levels": [{"level": 1, "role": "CEO"}],
        "cc_roles": [],
    },
    "expense": {
        "levels": [{"level": 1, "role": "HR"}],
        "cc_roles": [],
    },
    "resignation": {
        "levels": [{"level": 1, "role": "HR"}],
        "cc_roles": ["CEO"],
    },
}


def seed_workflows(db: Session) -> None:
    """Ensure all default workflow rows exist. Called once on startup."""
    for module, cfg in _DEFAULTS.items():
        if not db.query(ApprovalWorkflow).filter(ApprovalWorkflow.module == module).first():
            db.add(ApprovalWorkflow(module=module, levels=cfg["levels"], cc_roles=cfg["cc_roles"]))
    try:
        db.commit()
    except Exception:
        db.rollback()


def get_workflow(db: Session, module: str) -> ApprovalWorkflow:
    wf = db.query(ApprovalWorkflow).filter(
        ApprovalWorkflow.module == module,
        ApprovalWorkflow.is_active == True,  # noqa: E712
    ).first()
    if not wf and module in _DEFAULTS:
        cfg = _DEFAULTS[module]
        wf = ApprovalWorkflow(module=module, levels=cfg["levels"], cc_roles=cfg["cc_roles"])
        db.add(wf)
        db.commit()
        db.refresh(wf)
    return wf


def create_request(
    db: Session,
    module: str,
    entity_id: int,
    requested_by_user_id: int,
    payload: dict = None,
) -> ApprovalRequest:
    """
    Create an approval request and all its step rows.
    Notifies the first-level approvers and any CC roles.
    """
    wf = get_workflow(db, module)
    if not wf:
        raise ValueError(f"No approval workflow configured for module '{module}'")

    req = ApprovalRequest(
        module=module,
        entity_id=entity_id,
        requested_by_user_id=requested_by_user_id,
        current_level=1,
        status="pending",
        payload=payload or {},
    )
    db.add(req)
    db.flush()

    for lv in sorted(wf.levels, key=lambda x: x["level"]):
        db.add(ApprovalStep(
            approval_request_id=req.id,
            level=lv["level"],
            approver_role=lv["role"],
            status="pending" if lv["level"] == 1 else "waiting",
        ))

    db.commit()
    db.refresh(req)

    _notify_approvers(db, req, wf, level=1)

    # CC roles get an informational notification
    for cc_role in (wf.cc_roles or []):
        from backend.services.notification_service import push_to_role
        module_label = _label(module)
        push_to_role(
            db,
            cc_role,
            entity_type=module,
            entity_id=req.entity_id,
            title=f"[CC] {module_label} Request Submitted",
            message=f"A {module_label} request (#{req.id}) has been submitted and is pending approval.",
            notif_type="info",
            action="ceo-approvals" if cc_role == "CEO" else "approvals",
            priority="low",
            dedup_key=f"approval_cc_{req.id}_{cc_role}",
            is_cc=True,
        )
    db.commit()

    return req


def process(
    db: Session,
    approval_request_id: int,
    approver_user: User,
    action: str,
    remarks: str = "",
) -> ApprovalRequest:
    """
    Approve or reject the current pending step.
    action must be "approve" or "reject".
    On final approval: applies changes (salary_change) and notifies requester.
    """
    req = db.query(ApprovalRequest).filter(ApprovalRequest.id == approval_request_id).first()
    if not req:
        raise ValueError("Approval request not found")
    if req.status != "pending":
        raise ValueError(f"Request is already {req.status}")

    wf = get_workflow(db, req.module)

    step = db.query(ApprovalStep).filter(
        ApprovalStep.approval_request_id == req.id,
        ApprovalStep.level == req.current_level,
    ).first()
    if not step:
        raise ValueError("Current approval step not found")

    if approver_user.role not in (step.approver_role, "SuperAdmin"):
        raise PermissionError(f"Only {step.approver_role} can act at level {req.current_level}")

    step.approver_user_id = approver_user.id
    step.remarks = remarks
    step.actioned_at = datetime.utcnow()

    if action == "reject":
        step.status = "rejected"
        req.status = "rejected"
        req.remarks = remarks
        db.commit()
        _notify_requester(db, req, "rejected", remarks)
        return req

    step.status = "approved"
    max_level = max(lv["level"] for lv in wf.levels)

    if req.current_level < max_level:
        req.current_level += 1
        next_step = db.query(ApprovalStep).filter(
            ApprovalStep.approval_request_id == req.id,
            ApprovalStep.level == req.current_level,
        ).first()
        if next_step:
            next_step.status = "pending"
        db.commit()
        _notify_approvers(db, req, wf, level=req.current_level)
    else:
        req.status = "approved"
        req.remarks = remarks
        db.commit()
        _apply_on_approve(db, req)
        _notify_requester(db, req, "approved", remarks)

    return req


def pending_for_user(db: Session, user: User) -> list:
    """Return all pending approval steps the current user can act on."""
    steps = db.query(ApprovalStep).filter(
        ApprovalStep.approver_role == user.role,
        ApprovalStep.status == "pending",
    ).all()

    result = []
    for step in steps:
        req = db.query(ApprovalRequest).filter(
            ApprovalRequest.id == step.approval_request_id,
            ApprovalRequest.status == "pending",
        ).first()
        if req:
            # Enrich with human-readable context
            context = _enrich_entity(db, req)
            result.append({
                "step_id": step.id,
                "approval_request_id": req.id,
                "module": req.module,
                "module_label": _label(req.module),
                "entity_id": req.entity_id,
                "level": step.level,
                "payload": req.payload,
                "context": context,
                "created_at": str(req.created_at)[:19],
            })
    return result


def get_history(
    db: Session,
    module: str = None,
    entity_id: int = None,
    status: str = None,
    limit: int = 50,
) -> list:
    q = db.query(ApprovalRequest)
    if module:
        q = q.filter(ApprovalRequest.module == module)
    if entity_id:
        q = q.filter(ApprovalRequest.entity_id == entity_id)
    if status:
        q = q.filter(ApprovalRequest.status == status)

    requests = q.order_by(ApprovalRequest.created_at.desc()).limit(limit).all()

    result = []
    for req in requests:
        steps = (
            db.query(ApprovalStep)
            .filter(ApprovalStep.approval_request_id == req.id)
            .order_by(ApprovalStep.level)
            .all()
        )
        result.append({
            "id": req.id,
            "module": req.module,
            "module_label": _label(req.module),
            "entity_id": req.entity_id,
            "context": _enrich_entity(db, req),
            "status": req.status,
            "current_level": req.current_level,
            "payload": req.payload,
            "remarks": req.remarks,
            "created_at": str(req.created_at)[:19],
            "updated_at": str(req.updated_at)[:19] if req.updated_at else None,
            "steps": [
                {
                    "level": s.level,
                    "approver_role": s.approver_role,
                    "status": s.status,
                    "remarks": s.remarks,
                    "actioned_at": str(s.actioned_at)[:19] if s.actioned_at else None,
                }
                for s in steps
            ],
        })
    return result


# ── Private helpers ────────────────────────────────────────────────────────────

def _label(module: str) -> str:
    return module.replace("_", " ").title()


def _notify_approvers(db: Session, req: ApprovalRequest, wf: ApprovalWorkflow, level: int):
    from backend.services.notification_service import push_to_role
    lv_cfg = next((lv for lv in wf.levels if lv["level"] == level), None)
    if not lv_cfg:
        return
    # Route to the role-specific approvals page
    _role = lv_cfg["role"]
    _action = "ceo-approvals" if _role == "CEO" else "approvals"
    push_to_role(
        db,
        _role,
        entity_type=req.module,
        entity_id=req.entity_id,
        title=f"Approval Required — {_label(req.module)}",
        message=f"A {_label(req.module)} request (#{req.id}) is waiting for your approval.",
        notif_type="approval_request",
        action=_action,
        priority="high",
        dedup_key=f"approval_req_{req.id}_l{level}",
    )
    db.commit()


def _notify_requester(db: Session, req: ApprovalRequest, action: str, remarks: str = ""):
    if not req.requested_by_user_id:
        return
    from backend.services.notification_service import push
    suffix = f" — {remarks}" if remarks else "."
    push(
        db,
        req.requested_by_user_id,
        entity_type=req.module,
        entity_id=req.entity_id,
        title=f"{_label(req.module)} Request {action.capitalize()}",
        message=f"Your {_label(req.module)} request #{req.id} has been {action}{suffix}",
        notif_type="approval_result",
        action="approvals",
        priority="high" if action == "rejected" else "medium",
        dedup_key=f"approval_result_{req.id}_{action}",
    )
    db.commit()


def _apply_on_approve(db: Session, req: ApprovalRequest):
    """Apply pending changes after final approval. Currently handles salary_change."""
    if req.module != "salary_change" or not req.entity_id or not req.payload:
        return

    from backend.models.employee import Employee
    emp = db.query(Employee).filter(Employee.id == req.entity_id).first()
    if not emp:
        return

    # Payload may be {"new": {...}, "old": {...}} (new format) or flat dict (legacy)
    new_values = req.payload.get("new", req.payload) if isinstance(req.payload, dict) else req.payload

    _SALARY_FIELDS = {"basic_salary", "hra_percent", "special_allowance", "lta", "other_allowance", "ca_allowance"}
    for field, value in new_values.items():
        if field in _SALARY_FIELDS:
            setattr(emp, field, value)
    db.commit()

    # Notify the employee that their salary changed
    if emp.user_id:
        from backend.services.notification_service import push
        push(
            db,
            emp.user_id,
            entity_type="salary_change",
            entity_id=emp.id,
            title="Salary Updated",
            message="Your salary package has been updated. It will reflect in your next payslip.",
            notif_type="info",
            action="emp-salary",
            priority="high",
        )
        db.commit()


def _enrich_entity(db: Session, req: ApprovalRequest) -> dict:
    """Add human-readable context to a pending approval for the UI."""
    try:
        if req.module == "salary_change" and req.entity_id:
            from backend.models.employee import Employee
            emp = db.query(Employee).filter(Employee.id == req.entity_id).first()
            if emp:
                return {"employee_name": emp.full_name, "employee_code": emp.employee_id}
    except Exception:
        pass
    return {}
