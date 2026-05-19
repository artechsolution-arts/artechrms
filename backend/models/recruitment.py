from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from backend.database import Base


class JobOpening(Base):
    __tablename__ = "job_openings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    designation_id = Column(Integer, ForeignKey("designations.id"), nullable=True)
    no_of_positions = Column(Integer, default=1)
    status = Column(String(20), default="Open")  # Open, Closed
    closes_on = Column(Date)
    description = Column(Text)
    expected_ctc = Column(Float)
    attachment_url = Column(String(500), nullable=True)
    attachment_name = Column(String(200), nullable=True)
    social_platforms = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class JobApplicant(Base):
    __tablename__ = "job_applicants"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), nullable=False)
    phone = Column(String(20))
    job_opening_id = Column(Integer, ForeignKey("job_openings.id"), nullable=False)
    status = Column(String(20), default="Applied")  # Applied, Screening, Interview, Offered, Rejected, Hired
    resume_url = Column(String(500))
    cover_letter = Column(Text)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
