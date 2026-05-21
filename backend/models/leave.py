from sqlalchemy import Column, Integer, String, Date, Float, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base


class LeaveType(Base):
    __tablename__ = "leave_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    max_leaves = Column(Float, default=0)
    is_carry_forward = Column(Boolean, default=False)
    is_paid = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    applications = relationship("LeaveApplication", back_populates="leave_type_rel")


class LeaveApplication(Base):
    __tablename__ = "leave_applications"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    from_date = Column(Date, nullable=False)
    to_date = Column(Date, nullable=False)
    total_days = Column(Float, default=0)
    half_day = Column(Boolean, default=False)
    leave_category = Column(String(20), default='Planned')   # Planned | Unplanned
    reason = Column(Text)
    status = Column(String(30), default="Pending")  # Pending, Approved, Rejected, Cancellation Requested, Cancelled
    cancellation_reason = Column(Text, nullable=True)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    employee_rel = relationship("Employee", back_populates="leave_applications")
    leave_type_rel = relationship("LeaveType", back_populates="applications")


class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(20), default="Present")  # Present, Absent, On Leave, Half Day, WFH
    in_time = Column(String(10))
    out_time = Column(String(10))
    working_hours = Column(Float, default=0)
    late_entry = Column(Boolean, default=False)
    early_exit = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee_rel = relationship("Employee", back_populates="attendances")
