from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


class DocumentRequest(Base):
    __tablename__ = "document_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    doc_type = Column(String(100), nullable=False)
    remarks = Column(Text, nullable=True)
    status = Column(String(20), default="Pending")  # Pending | Fulfilled
    requested_at = Column(DateTime, default=datetime.utcnow)
    fulfilled_at = Column(DateTime, nullable=True)
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(200), nullable=True)

    employee = relationship("Employee", backref="document_requests")
