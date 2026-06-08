from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from backend.database import Base

# Employee self-service features (My Portal — same keys across all roles)
PORTAL_FEATURES = [
    "emp-dashboard", "start-journey",
    "my-profile", "my-leaves", "my-attendance", "my-salary",
    "my-appraisals", "my-assets", "my-documents", "my-status",
    "my-work-mode", "my-edit-requests", "my-resignation",
    "my-announcements", "my-holidays",
]

# HR-portal features (Sidebar.jsx NAV keys)
HR_FEATURES = [
    "dashboard",
    "employees", "departments", "designations",
    "leaves", "work-mode-sheet", "leave-types", "leave-balances",
    "attendance", "holidays", "announcements", "assets",
    "salary-slips", "payroll-entry", "payroll-rules",
    "onboarding", "job-openings", "applicants", "appraisals",
    "edit-requests", "resignations", "document-requests", "status-sheets", "company-docs",
] + PORTAL_FEATURES

# Employee-portal features
EMP_FEATURES = list(PORTAL_FEATURES)

ALL_FEATURES = sorted(set(HR_FEATURES + EMP_FEATURES + ["ceo-dashboard"]))

DEFAULT_PERMISSIONS = {
    "HR": HR_FEATURES,
    "CEO": [
        "ceo-dashboard", "employees", "leaves", "work-mode-sheet",
        "attendance", "holidays", "announcements", "onboarding",
        "document-requests", "appraisals", "status-sheets", "company-docs",
    ] + PORTAL_FEATURES,
    "Employee": EMP_FEATURES,
}


class RolePermission(Base):
    __tablename__ = "role_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), unique=True, nullable=False)
    allowed_features = Column(JSONB, default=list)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
