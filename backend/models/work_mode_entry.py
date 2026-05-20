from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class WorkModeEntry(Base):
    __tablename__ = "work_mode_entries"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    entry_date = Column(Date, nullable=False)
    work_mode = Column(String(50), nullable=False)   # WFH | PLANNED LEAVE | SICK LEAVE | CASUAL LEAVE
    reason = Column(String(300), nullable=True)
    duration = Column(String(30), default="FULL-DAY")  # FULL-DAY | HALF-DAY (Morning) | HALF-DAY (Afternoon)
    status = Column(String(20), default="Pending")    # Pending | Approved | Rejected
    hr_remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", backref="work_mode_entries")
