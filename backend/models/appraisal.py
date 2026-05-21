from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base


class Appraisal(Base):
    __tablename__ = "appraisals"

    id          = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    period      = Column(String(50))   # e.g. "H1 2025", "Annual 2025"

    # Goals set by HR: [{title, weight, target}]
    goals = Column(JSON, default=list)

    # Per-stage evaluations
    # {scores: [{idx, score, comments}], overall_comments, submitted_at, submitted_by}
    self_eval     = Column(JSON, nullable=True)
    manager_eval  = Column(JSON, nullable=True)
    business_eval = Column(JSON, nullable=True)
    biz_head_eval = Column(JSON, nullable=True)

    # Weighted average per stage (1-5 scale)
    self_score     = Column(Float, nullable=True)
    manager_score  = Column(Float, nullable=True)
    business_score = Column(Float, nullable=True)
    biz_head_score = Column(Float, nullable=True)
    total_score    = Column(Float, default=0)

    # Goals Set → Self Evaluated → Manager Evaluated → Business Evaluated → Completed
    status = Column(String(30), default="Goals Set")

    reviewer_comments = Column(Text, nullable=True)  # legacy field

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    employee_rel = relationship("Employee", back_populates="appraisals")
