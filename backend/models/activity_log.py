from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.sql import func
from backend.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id          = Column(Integer, primary_key=True, index=True)
    actor       = Column(String(100), index=True)       # username who did the action
    actor_role  = Column(String(50))                     # HR / SuperAdmin / Employee
    action      = Column(String(50), index=True)         # LOGIN CREATE UPDATE DELETE APPROVE REJECT RETURN RUN_PAYROLL RESET_PASSWORD
    entity_type = Column(String(100), index=True)        # Employee Leave Asset User Payroll Permissions
    entity_id   = Column(String(100), nullable=True)
    entity_name = Column(String(300), nullable=True)     # human-readable label
    changes     = Column(JSON, nullable=True)            # optional detail dict
    ip_address  = Column(String(50), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), index=True)
