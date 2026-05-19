from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from backend.database import Base

ALL_FEATURES = [
    "dashboard", "employees", "departments", "designations",
    "leaves", "leave-types", "leave-balances", "attendance",
    "holidays", "announcements",
    "salary-slips", "payroll-entry", "salary-components",
    "expenses", "assets",
    "job-openings", "applicants", "appraisals",
    "document-requests",
]

DEFAULT_PERMISSIONS = {
    "Admin": ALL_FEATURES,
    "Manager": ["dashboard", "employees", "leaves", "leave-balances", "attendance", "appraisals", "announcements"],
    "HR User": ["dashboard", "employees", "leaves", "leave-types", "leave-balances", "attendance", "holidays", "announcements", "document-requests"],
}


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), unique=True, nullable=False)
    allowed_features = Column(JSONB, default=list)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
