"""Fire-and-forget activity logging. Call log_activity() before db.commit()."""
from sqlalchemy.orm import Session
from fastapi import Request
from backend.models.activity_log import ActivityLog


def log_activity(
    db: Session,
    request: Request | None,
    action: str,
    entity_type: str,
    entity_id=None,
    entity_name: str | None = None,
    changes: dict | None = None,
    actor: str | None = None,
    actor_role: str | None = None,
) -> None:
    """Add an ActivityLog row. Does NOT commit — the caller must commit."""
    if request is not None:
        _actor = actor or getattr(request.state, "username", None) or "system"
        _role  = actor_role or getattr(request.state, "user_role", None) or "unknown"
        _ip    = request.client.host if request.client else None
    else:
        _actor = actor or "system"
        _role  = actor_role or "system"
        _ip    = None

    entry = ActivityLog(
        actor       = _actor,
        actor_role  = _role,
        action      = action,
        entity_type = entity_type,
        entity_id   = str(entity_id) if entity_id is not None else None,
        entity_name = entity_name,
        changes     = changes,
        ip_address  = _ip,
    )
    db.add(entry)
