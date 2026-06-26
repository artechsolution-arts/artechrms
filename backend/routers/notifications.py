"""
Notifications layer — two complementary systems:

1. Computed (legacy): derived on-the-fly from existing tables.
   Used by the SSE stream and the main bell-icon GET endpoint.
   No DB table — always fresh, never stale.

2. Persistent (new): rows in the `notifications` table.
   Supports read/unread, filtering by type, and badge counts.
   Created by notification_service.push() from anywhere in the app.
"""
import asyncio
import json
from typing import Optional
from fastapi import APIRouter, Request, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta

from backend.database import get_db, SessionLocal
from backend.auth_utils import decode_token
from backend.models.auth import User
from backend.models.employee import Employee
from backend.models.leave import LeaveApplication
from backend.models.hrm import ExpenseClaim, Announcement
from backend.models.document_request import DocumentRequest
from backend.models.recruitment import JobApplicant
from backend.models.profile_update_log import ProfileUpdateLog
from backend.models.resignation import Resignation
from backend.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


def _get_user(request: Request, db: Session):
    auth = request.headers.get("Authorization", "")
    username = decode_token(auth[7:]) if auth.startswith("Bearer ") else None
    if not username:
        return None
    return db.query(User).filter(User.username == username).first()


def _get_employee(user: User, db: Session):
    if not user or not user.email:
        return None
    return db.query(Employee).filter(Employee.email == user.email).first()


def _emp_name_map(emp_ids: list, db: Session) -> dict:
    """Fetch employee names for a list of IDs in ONE query — eliminates N+1."""
    if not emp_ids:
        return {}
    rows = db.query(Employee.id, Employee.full_name).filter(Employee.id.in_(emp_ids)).all()
    return {r.id: r.full_name for r in rows}


def _compute_notifications(user: User, db: Session) -> list:
    """Core logic: build notification list for a given user. Shared by REST + SSE."""
    notifications = []
    now = datetime.utcnow()

    # ── HR / Admin / SuperAdmin notifications ──────────────────
    if user.role in ("HR", "SuperAdmin", "CEO"):

        pending_leaves = db.query(LeaveApplication).filter(
            LeaveApplication.status == "Pending"
        ).order_by(LeaveApplication.created_at.desc()).limit(10).all()

        cancel_requests = db.query(LeaveApplication).filter(
            LeaveApplication.status == "Cancellation Requested"
        ).order_by(LeaveApplication.created_at.desc()).limit(10).all()

        edit_requests = db.query(LeaveApplication).filter(
            LeaveApplication.status == "Edit Requested"
        ).order_by(LeaveApplication.created_at.desc()).limit(10).all()

        pending_expenses = db.query(ExpenseClaim).filter(
            ExpenseClaim.status == "Pending"
        ).order_by(ExpenseClaim.created_at.desc()).limit(5).all()

        pending_docs = db.query(DocumentRequest).filter(
            DocumentRequest.status == "Pending"
        ).order_by(DocumentRequest.requested_at.desc()).limit(5).all()

        pending_resignations = db.query(Resignation).filter(
            Resignation.status == "Pending"
        ).order_by(Resignation.created_at.desc()).limit(10).all()

        profile_updates = db.query(ProfileUpdateLog).filter(
            ProfileUpdateLog.seen_by_hr == False  # noqa: E712
        ).order_by(ProfileUpdateLog.changed_at.desc()).limit(10).all()

        # Collect all employee IDs, then fetch names in ONE query
        all_emp_ids = list({
            *[l.employee_id for l in pending_leaves],
            *[l.employee_id for l in cancel_requests],
            *[l.employee_id for l in edit_requests],
            *[e.employee_id for e in pending_expenses],
            *[d.employee_id for d in pending_docs],
            *[r.employee_id for r in pending_resignations],
            *[p.employee_id for p in profile_updates],
        })
        emp_names = _emp_name_map(all_emp_ids, db)

        for leave in pending_leaves:
            emp_name = emp_names.get(leave.employee_id, "An employee")
            days = (leave.to_date - leave.from_date).days + 1 if leave.from_date and leave.to_date else 1
            notifications.append({
                "id": f"leave-{leave.id}", "type": "leave", "icon": "🗓️",
                "title": "Leave Request Pending",
                "message": f"{emp_name} applied for {days} day{'s' if days > 1 else ''} leave",
                "action": "leaves",
                "employee_id": leave.employee_id,
                "time": str(leave.created_at)[:10] if leave.created_at else "",
                "priority": "high",
            })

        for leave in cancel_requests:
            emp_name = emp_names.get(leave.employee_id, "An employee")
            days = (leave.to_date - leave.from_date).days + 1 if leave.from_date and leave.to_date else 1
            notifications.append({
                "id": f"cancel-{leave.id}", "type": "cancel_request", "icon": "🔄",
                "title": "Leave Cancellation Request",
                "message": f"{emp_name} wants to cancel {days} day{'s' if days > 1 else ''} leave",
                "action": "leaves",
                "employee_id": leave.employee_id,
                "time": str(leave.created_at)[:10] if leave.created_at else "",
                "priority": "high",
            })

        for leave in edit_requests:
            emp_name = emp_names.get(leave.employee_id, "An employee")
            notifications.append({
                "id": f"edit-{leave.id}", "type": "edit_request", "icon": "✏️",
                "title": "Leave Date Change Request",
                "message": f"{emp_name} wants to change approved leave dates",
                "action": "leaves",
                "employee_id": leave.employee_id,
                "time": str(leave.created_at)[:10] if leave.created_at else "",
                "priority": "high",
            })

        for exp in pending_expenses:
            emp_name = emp_names.get(exp.employee_id, "An employee")
            notifications.append({
                "id": f"expense-{exp.id}", "type": "expense", "icon": "💰",
                "title": "Expense Claim Pending",
                "message": f"{emp_name} submitted ₹{int(exp.amount):,} for {exp.expense_type}",
                "action": "expenses",
                "employee_id": exp.employee_id,
                "time": str(exp.created_at)[:10] if exp.created_at else "",
                "priority": "medium",
            })

        for doc in pending_docs:
            emp_name = emp_names.get(doc.employee_id, "An employee")
            notifications.append({
                "id": f"doc-{doc.id}", "type": "document", "icon": "📄",
                "title": "Document Request",
                "message": f"{emp_name} requested {doc.doc_type}",
                "action": "document-requests",
                "employee_id": doc.employee_id,
                "time": str(doc.requested_at)[:10] if doc.requested_at else "",
                "priority": "medium",
            })

        for res in pending_resignations:
            emp_name = emp_names.get(res.employee_id, "An employee")
            lwd = f" — LWD: {res.last_working_date}" if res.last_working_date else ""
            notifications.append({
                "id": f"resignation-{res.id}", "type": "resignation", "icon": "📝",
                "title": "Resignation Submitted",
                "message": f"{emp_name} has submitted a resignation{lwd}",
                "action": "resignations",
                "employee_id": res.employee_id,
                "time": str(res.created_at)[:10] if res.created_at else "",
                "priority": "high",
            })

        for pu in profile_updates:
            emp_name = emp_names.get(pu.employee_id, "An employee")
            fields = ", ".join(v["label"] for v in pu.changes.values()) if pu.changes else "profile"
            notifications.append({
                "id": f"profile-update-{pu.id}", "type": "profile_update", "icon": "👤",
                "title": "Profile Updated",
                "message": f"{emp_name} updated their {fields}",
                "action": "employees",
                "employee_id": pu.employee_id,
                "time": str(pu.changed_at)[:10] if pu.changed_at else "",
                "priority": "medium",
            })

        week_ago = date.today() - timedelta(days=7)
        new_applicants = db.query(JobApplicant).filter(
            JobApplicant.created_at >= week_ago
        ).count()

        if new_applicants > 0:
            notifications.append({
                "id": "applicants-recent",
                "type": "recruitment",
                "icon": "👤",
                "title": "New Applicants",
                "message": f"{new_applicants} new job application{'s' if new_applicants > 1 else ''} this week",
                "action": "applicants",
                "time": str(date.today()),
                "priority": "low",
            })

    # ── Employee notifications ──────────────────────────────────
    elif user.role == "Employee":
        emp = _get_employee(user, db)
        if emp:
            recent_leaves = db.query(LeaveApplication).filter(
                LeaveApplication.employee_id == emp.id,
                LeaveApplication.status.in_(["Approved", "Rejected"]),
            ).order_by(LeaveApplication.created_at.desc()).limit(5).all()

            for leave in recent_leaves:
                icon = "✅" if leave.status == "Approved" else "❌"
                notifications.append({
                    "id": f"my-leave-{leave.id}",
                    "type": "leave",
                    "icon": icon,
                    "title": f"Leave {leave.status}",
                    "message": f"Your leave from {leave.from_date} to {leave.to_date} was {leave.status.lower()}",
                    "action": "emp-leaves",
                    "time": str(leave.created_at)[:10] if leave.created_at else "",
                    "priority": "high" if leave.status == "Rejected" else "medium",
                })

            fulfilled_docs = db.query(DocumentRequest).filter(
                DocumentRequest.employee_id == emp.id,
                DocumentRequest.status == "Fulfilled",
            ).order_by(DocumentRequest.fulfilled_at.desc()).limit(3).all()

            for doc in fulfilled_docs:
                notifications.append({
                    "id": f"my-doc-{doc.id}",
                    "type": "document",
                    "icon": "📥",
                    "title": "Document Ready",
                    "message": f"Your {doc.doc_type} is ready to download",
                    "action": "emp-documents",
                    "time": str(doc.fulfilled_at)[:10] if doc.fulfilled_at else "",
                    "priority": "high",
                })

            announcements = db.query(Announcement).filter(
                Announcement.is_active == True  # noqa: E712
            ).order_by(Announcement.created_at.desc()).limit(3).all()

            # Resignation status updates
            my_resignations = db.query(Resignation).filter(
                Resignation.employee_id == emp.id,
                Resignation.status.in_(["Approved", "Rejected"]),
            ).order_by(Resignation.actioned_at.desc()).limit(3).all()

            for res in my_resignations:
                icon = "✅" if res.status == "Approved" else "❌"
                lwd = f" — LWD: {res.approved_last_working_date or res.last_working_date}" if (res.approved_last_working_date or res.last_working_date) else ""
                notifications.append({
                    "id": f"my-resignation-{res.id}",
                    "type": "resignation",
                    "icon": icon,
                    "title": f"Resignation {res.status}",
                    "message": f"Your resignation has been {res.status.lower()}{lwd}",
                    "action": "emp-resignation",
                    "time": str(res.actioned_at)[:10] if res.actioned_at else "",
                    "priority": "high",
                })

            for ann in announcements:
                notifications.append({
                    "id": f"ann-{ann.id}",
                    "type": "announcement",
                    "icon": "📢",
                    "title": ann.title,
                    "message": ann.content[:80] + ("…" if ann.content and len(ann.content) > 80 else "") if ann.content else "",
                    "action": "emp-announcements",
                    "time": str(ann.created_at)[:10] if ann.created_at else "",
                    "priority": ann.priority.lower() if ann.priority else "low",
                })

    priority_order = {"high": 0, "medium": 1, "low": 2}
    notifications = sorted(notifications, key=lambda n: (priority_order.get(n["priority"], 3), ""))
    return notifications[:20]


# ── Persistent notification endpoints ─────────────────────────────────────────

@router.get("/persistent")
def get_persistent_notifications(
    request: Request,
    db: Session = Depends(get_db),
    unread_only: bool = False,
    entity_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
):
    """Persistent in-app notifications with read/unread status and type filtering."""
    user = _get_user(request, db)
    if not user:
        return []
    from backend.services.notification_service import get_notifications
    notifs = get_notifications(db, user.id, unread_only=unread_only, entity_type=entity_type,
                               limit=limit, offset=offset)
    return [
        {
            "id": n.id,
            "entity_type": n.entity_type,
            "entity_id": n.entity_id,
            "notif_type": n.notif_type,
            "title": n.title,
            "message": n.message,
            "action": n.action,
            "priority": n.priority,
            "is_read": n.is_read,
            "is_cc": n.is_cc,
            "created_at": str(n.created_at)[:19] if n.created_at else None,
        }
        for n in notifs
    ]


@router.get("/unread-count")
def get_unread_count(request: Request, db: Session = Depends(get_db)):
    """Badge count for the notification bell."""
    user = _get_user(request, db)
    if not user:
        return {"count": 0}
    from backend.services.notification_service import unread_count
    return {"count": unread_count(db, user.id)}


@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: int, request: Request, db: Session = Depends(get_db)):
    """Mark a single persistent notification as read."""
    user = _get_user(request, db)
    if not user:
        return {"ok": False}
    from backend.services.notification_service import mark_read
    ok = mark_read(db, notification_id, user.id)
    return {"ok": ok}


@router.post("/read-all")
def mark_all_notifications_read(request: Request, db: Session = Depends(get_db)):
    """Mark all persistent notifications as read for the current user."""
    user = _get_user(request, db)
    if not user:
        return {"ok": False, "count": 0}
    from backend.services.notification_service import mark_all_read
    count = mark_all_read(db, user.id)
    return {"ok": True, "count": count}


# ── Existing endpoints ──────────────────────────────────────────────────────────

@router.post("/profile-update/{log_id}/seen")
def mark_profile_update_seen(log_id: int, request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user or user.role not in ("HR", "SuperAdmin", "CEO"):
        return {"ok": False}
    log = db.query(ProfileUpdateLog).filter(ProfileUpdateLog.id == log_id).first()
    if log:
        log.seen_by_hr = True
        db.commit()
    return {"ok": True}


@router.get("")
def get_notifications(request: Request, db: Session = Depends(get_db)):
    user = _get_user(request, db)
    if not user:
        return []
    return _compute_notifications(user, db)


@router.get("/stream")
async def stream_notifications(request: Request, token: str = ""):
    """SSE endpoint — pushes notification updates in real time (no polling needed on client)."""
    username = decode_token(token) if token else None

    async def generator():
        if not username:
            yield "event: auth_error\ndata: {}\n\n"
            return

        last_fingerprint = None
        heartbeat_ticks = 0

        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                break

            db = SessionLocal()
            try:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    yield "event: auth_error\ndata: {}\n\n"
                    break

                notifs = _compute_notifications(user, db)
                # Fingerprint: sorted IDs joined — changes whenever the list changes
                fp = "|".join(sorted(str(n["id"]) for n in notifs))

                if fp != last_fingerprint:
                    last_fingerprint = fp
                    heartbeat_ticks = 0
                    yield f"data: {json.dumps(notifs)}\n\n"
                else:
                    heartbeat_ticks += 1
                    # Send a keep-alive comment every ~60s (3 ticks × 20s)
                    if heartbeat_ticks >= 3:
                        heartbeat_ticks = 0
                        yield ": ping\n\n"
            except Exception:
                yield ": error\n\n"
            finally:
                db.close()

            await asyncio.sleep(20)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
