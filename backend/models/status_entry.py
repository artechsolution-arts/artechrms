from sqlalchemy import Column, Integer, String, Date, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class StatusEntry(Base):
    __tablename__ = "status_entries"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    task_id = Column(String(20), nullable=False)
    entry_date = Column(Date, nullable=False)
    task_name = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)
    status = Column(String(50), default="In Progress")
    percent_complete = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", backref="status_entries")
