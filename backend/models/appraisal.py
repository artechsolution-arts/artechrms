from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base


class Appraisal(Base):
    __tablename__ = "appraisals"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    period = Column(String(50))  # e.g. "Q1 2024", "Annual 2024"
    goals = Column(JSON, default=[])  # [{title, weight, score, remarks}]
    total_score = Column(Float, default=0)
    status = Column(String(20), default="Draft")  # Draft, Submitted, Completed
    reviewer_comments = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    employee_rel = relationship("Employee", back_populates="appraisals")
