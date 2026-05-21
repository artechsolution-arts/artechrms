from sqlalchemy import Column, Integer, ForeignKey, DateTime, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base


class ProfileUpdateLog(Base):
    __tablename__ = "profile_update_logs"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    changes = Column(JSON, nullable=False)   # {"email": "new@...", "mobile": "..."}
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    seen_by_hr = Column(Boolean, default=False)

    employee_rel = relationship("Employee", foreign_keys=[employee_id])
