from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from backend.database import Base

# HR-portal features (Sidebar.jsx NAV keys)
HR_FEATURES = [
    "dashboard",
    "employees", "departments", "designations",
    "leaves", "work-mode-sheet", "leave-types", "leave-balances",
    "attendance", "holidays", "announcements", "assets",
    "salary-slips", "payroll-entry", "payroll-rules",
    "job-openings", "applicants", "appraisals",
    "edit-requests", "document-requests", "status-sheets",
    # My Portal section visible inside HR shell
    "my-profile", "my-leaves", "my-salary", "my-attendance",
    "my-documents", "my-status", "my-work-mode",
]

# Employee-portal features (EmployeeSidebar.jsx NAV keys)
EMP_FEATURES = [
    "emp-dashboard",
    "emp-profile", "emp-leaves", "emp-attendance", "emp-salary",
    "emp-appraisals", "emp-assets", "emp-documents",
    "emp-status", "emp-work-mode", "emp-edit-requests",
    "emp-announcements", "emp-holidays",
]

ALL_FEATURES = HR_FEATURES + EMP_FEATURES

DEFAULT_PERMISSIONS = {
    "HR": HR_FEATURES,
    "CEO": [
        "dashboard", "employees", "leaves", "work-mode-sheet",
        "leave-balances", "attendance", "holidays", "announcements",
        "document-requests", "appraisals", "status-sheets",
    ],
    "Employee": EMP_FEATURES,
}


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), unique=True, nullable=False)
    allowed_features = Column(JSONB, default=list)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
