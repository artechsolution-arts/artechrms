from sqlalchemy import Column, Integer, ForeignKey, DateTime, Date, String, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base


class Resignation(Base):
    __tablename__ = "resignations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    reason = Column(Text, nullable=False)
    last_working_date = Column(Date, nullable=True)   # requested by employee
    notice_period_days = Column(Integer, nullable=True)
    status = Column(String(20), default="Pending")    # Pending / Approved / Rejected / Withdrawn
    hr_remarks = Column(Text, nullable=True)
    approved_last_working_date = Column(Date, nullable=True)  # HR-confirmed LWD
    actioned_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    actioned_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    employee_rel = relationship("Employee", foreign_keys=[employee_id])
    actioned_by_rel = relationship("User", foreign_keys=[actioned_by])
