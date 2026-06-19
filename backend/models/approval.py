from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.sql import func
from backend.database import Base


class ApprovalWorkflow(Base):
    """Configuration: which roles approve at each level for a given module."""
    __tablename__ = "approval_workflows"

    id = Column(Integer, primary_key=True)
    module = Column(String(50), unique=True, nullable=False)
    # levels: [{level: 1, role: "HR"}, {level: 2, role: "CEO"}]
    levels = Column(JSON, nullable=False)
    # cc_roles: roles to CC-notify when a request is created
    cc_roles = Column(JSON, default=list)
    is_active = Column(Boolean, default=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ApprovalRequest(Base):
    """One approval request per business action (salary change, etc.)."""
    __tablename__ = "approval_requests"

    id = Column(Integer, primary_key=True, index=True)
    module = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=True)   # e.g. employee_id for salary_change
    requested_by_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    current_level = Column(Integer, default=1)
    status = Column(String(20), default="pending", index=True)  # pending | approved | rejected
    payload = Column(JSON, nullable=True)   # proposed values (salary fields, etc.)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class ApprovalStep(Base):
    """One row per level per request — tracks who acted and when."""
    __tablename__ = "approval_steps"

    id = Column(Integer, primary_key=True)
    approval_request_id = Column(
        Integer,
        ForeignKey("approval_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    level = Column(Integer, nullable=False)
    approver_role = Column(String(50), nullable=False)
    approver_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    # pending | waiting | approved | rejected
    status = Column(String(20), default="pending")
    remarks = Column(Text, nullable=True)
    actioned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
