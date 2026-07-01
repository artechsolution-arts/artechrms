from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from backend.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_user_id = Column(Integer, nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)
    entity_id = Column(Integer, nullable=True)
    notif_type = Column(String(30), nullable=False, default="info")
    # info | approval_request | approval_result | alert
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    action = Column(String(100), nullable=True)
    priority = Column(String(10), default="medium")
    is_read = Column(Boolean, default=False, index=True)
    is_cc = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Deduplication key — if set, prevents duplicate notifications with the same key per user
    dedup_key = Column(String(200), nullable=True, index=True)
