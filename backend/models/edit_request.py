from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class EditRequest(Base):
    __tablename__ = "edit_requests"

    id            = Column(Integer, primary_key=True, index=True)
    employee_id   = Column(Integer, ForeignKey("employees.id"), nullable=False)
    request_type  = Column(String(50), nullable=False)   # Leave | Status Sheet | Attendance | Other
    target_date   = Column(Date, nullable=False)
    description   = Column(Text, nullable=False)
    reason        = Column(Text, nullable=False)
    status        = Column(String(20), default="Pending")  # Pending | Approved | Rejected
    hr_remarks    = Column(Text, nullable=True)
    created_at    = Column(DateTime, default=datetime.utcnow)
    resolved_at   = Column(DateTime, nullable=True)
    resolved_by   = Column(Integer, ForeignKey("users.id"), nullable=True)

    employee = relationship("Employee", backref="edit_requests")
