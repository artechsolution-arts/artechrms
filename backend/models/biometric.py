from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from backend.database import Base


class BiometricDevice(Base):
    """An eSSL / ZKTeco biometric device on the local network."""
    __tablename__ = "biometric_devices"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)          # e.g. "Main Entrance"
    ip_address = Column(String(50), nullable=False)
    port = Column(Integer, default=4370)
    location = Column(String(120))                      # optional label
    is_active = Column(Boolean, default=True)
    last_sync_at = Column(DateTime(timezone=True), nullable=True)
    last_status = Column(String(200))                   # last connection/sync message
    created_at = Column(DateTime(timezone=True), server_default=func.now())
