from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from datetime import datetime
from backend.database import Base


class DocumentTemplate(Base):
    __tablename__ = "document_templates"

    id         = Column(Integer, primary_key=True, index=True)
    name       = Column(String(200), nullable=False)
    category   = Column(String(100), default="HR Letter")
    content    = Column(Text, nullable=False)   # full body text with {{placeholder}} vars
    variables  = Column(JSON, default=list)     # [{"key":"candidate_name","label":"Candidate Name","type":"text"}]
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
