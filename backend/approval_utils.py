"""
Shared approval-hierarchy logic.

SuperAdmin only manages accounts & permissions — it has NO approval powers.

Rule:
  • Employee-raised request → HR **or** CEO can approve/reject (equal power)
  • HR-raised request       → only CEO can approve/reject
  • CEO-raised request       → top of the chain, nobody approves
  • SuperAdmin               → no approval powers at all
"""
from fastapi import Request, HTTPException
from sqlalchemy.orm import Session
from backend.models.employee import Employee
from backend.models.auth import User


def get_requester_role(db: Session, employee_id: int) -> str:
    """Return the role of the person who raised a request (via their linked user account)."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp or not emp.user_id:
        return "Employee"
    user = db.query(User).filter(User.id == emp.user_id).first()
    return user.role if user else "Employee"


def can_approve(approver_role: str, requester_role: str) -> bool:
    """Whether approver_role may approve/reject a request raised by requester_role."""
    if requester_role == "Employee":
        return approver_role in ("HR", "CEO")
    if requester_role == "HR":
        return approver_role == "CEO"
    if requester_role == "CEO":
        return False  # top of the chain — nobody approves
    # Unknown requester role → treat as employee
    return approver_role in ("HR", "CEO")


def require_approval_rights(request: Request, db: Session, employee_id: int):
    """Raise 403 if the current user cannot approve a request from this employee."""
    approver_role = getattr(request.state, "user_role", "Employee")
    requester_role = get_requester_role(db, employee_id)
    if not can_approve(approver_role, requester_role):
        if requester_role == "HR":
            raise HTTPException(403, "Only the CEO can approve requests raised by HR")
        if requester_role == "CEO":
            raise HTTPException(403, "CEO requests are top-level — they cannot be approved by anyone")
        raise HTTPException(403, "You do not have permission to approve this request")
    return {"approver_role": approver_role, "requester_role": requester_role}
