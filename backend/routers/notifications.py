"""
Computed notifications endpoint — returns role-aware notifications for the bell icon.
No separate DB table; notifications are derived from existing data in real time.
Supports both REST polling (/api/notifications) and SSE push (/api/notifications/stream).
"""
import asyncio
import json
from fastapi import APIRouter, Request, Depends
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


def _compute_notifications(user: User, db: Session) -> list:
    """Core logic: build notification list for a given user. Shared by REST + SSE."""
    notifications = []
    now = datetime.utcnow()

    # ── HR / Admin / SuperAdmin notifications ──────────────────
    if user.role in ("HR", "SuperAdmin", "CEO"):

        pending_leaves = db.query(LeaveApplication).filter(
            LeaveApplication.status == "Pending"
        ).order_by(LeaveApplication.created_at.desc()).limit(10).all()

        for leave in pending_leaves:
            emp = db.query(Employee).filter(Employee.id == leave.employee_id).first()
            emp_name = emp.full_name if emp else "An employee"
            days = (leave.to_date - leave.from_date).days + 1 if leave.from_date and leave.to_date else 1
            notifications.append({
                "id": f"leave-{leave.id}",
                "type": "leave",
                "icon": "🗓️",
                "title": "Leave Request Pending",
                "message": f"{emp_name} applied for {days} day{'s' if days > 1 else ''} leave",
                "action": "leaves",
                "time": str(leave.created_at)[:10] if leave.created_at else "",
                "priority": "high",
            })

        cancel_requests = db.query(LeaveApplication).filter(
            LeaveApplication.status == "Cancellation Requested"
        ).order_by(LeaveApplication.created_at.desc()).limit(10).all()

        for leave in cancel_requests:
            emp = db.query(Employee).filter(Employee.id == leave.employee_id).first()
            emp_name = emp.full_name if emp else "An employee"
            days = (leave.to_date - leave.from_date).days + 1 if leave.from_date and leave.to_date else 1
            notifications.append({
                "id": f"cancel-{leave.id}",
                "type": "cancel_request",
                "icon": "🔄",
                "title": "Leave Cancellation Request",
                "message": f"{emp_name} wants to cancel {days} day{'s' if days > 1 else ''} leave",
                "action": "leaves",
                "time": str(leave.created_at)[:10] if leave.created_at else "",
                "priority": "high",
            })

        pending_expenses = db.query(ExpenseClaim).filter(
            ExpenseClaim.status == "Pending"
        ).order_by(ExpenseClaim.created_at.desc()).limit(5).all()

        for exp in pending_expenses:
            emp = db.query(Employee).filter(Employee.id == exp.employee_id).first()
            emp_name = emp.full_name if emp else "An employee"
            notifications.append({
                "id": f"expense-{exp.id}",
                "type": "expense",
                "icon": "💰",
                "title": "Expense Claim Pending",
                "message": f"{emp_name} submitted ₹{int(exp.amount):,} for {exp.expense_type}",
                "action": "expenses",
                "time": str(exp.created_at)[:10] if exp.created_at else "",
                "priority": "medium",
            })

        pending_docs = db.query(DocumentRequest).filter(
            DocumentRequest.status == "Pending"
        ).order_by(DocumentRequest.requested_at.desc()).limit(5).all()

        for doc in pending_docs:
            emp = db.query(Employee).filter(Employee.id == doc.employee_id).first()
            emp_name = emp.full_name if emp else "An employee"
            notifications.append({
                "id": f"doc-{doc.id}",
                "type": "document",
                "icon": "📄",
                "title": "Document Request",
                "message": f"{emp_name} requested {doc.doc_type}",
                "action": "document-requests",
                "time": str(doc.requested_at)[:10] if doc.requested_at else "",
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
                    # Send a keep-alive comment every ~30s (6 ticks × 5s)
                    if heartbeat_ticks >= 6:
                        heartbeat_ticks = 0
                        yield ": ping\n\n"
            except Exception:
                yield ": error\n\n"
            finally:
                db.close()

            await asyncio.sleep(5)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
