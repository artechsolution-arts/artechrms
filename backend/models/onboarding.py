from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.database import Base


ONBOARDING_ITEMS = [
    # Pre-Joining
    ("pre_joining", "Offer Letter Signed"),
    ("pre_joining", "Employment Agreement Signed"),
    ("pre_joining", "NDA / Confidentiality Agreement Signed"),
    ("pre_joining", "Background Verification (BGV) Initiated"),
    ("pre_joining", "Medical Fitness Certificate Received"),
    # Documents
    ("documents", "Aadhaar Card Submitted"),
    ("documents", "PAN Card Submitted"),
    ("documents", "Passport Copy Submitted"),
    ("documents", "Educational Certificates Submitted"),
    ("documents", "Previous Employment Certificate Submitted"),
    ("documents", "Relieving Letter from Last Employer"),
    ("documents", "Last 3 Month Salary Slips"),
    # Bank & Statutory
    ("statutory", "Bank Account Details Submitted"),
    ("statutory", "PF Nomination Form (Form 2) Submitted"),
    ("statutory", "ESI Nomination Form Submitted"),
    ("statutory", "Gratuity Nomination Form Submitted"),
    ("statutory", "Emergency Contact Details Provided"),
    # Company Setup
    ("setup", "Employee ID Issued"),
    ("setup", "Official Email ID Created"),
    ("setup", "System / Application Access Granted"),
    ("setup", "Laptop / Equipment Assigned"),
    ("setup", "ID Card & Access Card Issued"),
    ("setup", "HR Policy Handbook Acknowledged"),
    ("setup", "Code of Conduct Signed"),
    ("setup", "IT Security Policy Acknowledged"),
    ("setup", "Induction / Orientation Completed"),
    ("setup", "Buddy / Mentor Assigned"),
]

OFFBOARDING_ITEMS = [
    # Exit Initiation
    ("exit_initiation", "Resignation Letter Received"),
    ("exit_initiation", "Last Working Day Confirmed"),
    ("exit_initiation", "Exit Interview Scheduled"),
    ("exit_initiation", "Notice Period Completed / Waived"),
    # Knowledge Transfer
    ("knowledge_transfer", "KT Plan Document Prepared"),
    ("knowledge_transfer", "Knowledge Transfer Completed"),
    ("knowledge_transfer", "Pending Tasks Handed Over"),
    ("knowledge_transfer", "Project Documentation Updated"),
    # Asset Return
    ("asset_return", "Laptop / Device Returned"),
    ("asset_return", "ID Card & Access Card Returned"),
    ("asset_return", "Company Mobile Returned"),
    ("asset_return", "Other Company Assets Returned"),
    # Access Revocation
    ("access_revocation", "Official Email Deactivated"),
    ("access_revocation", "System / Application Access Revoked"),
    ("access_revocation", "VPN Access Removed"),
    ("access_revocation", "Cloud / Software Licenses Released"),
    # Finance & Settlement
    ("settlement", "Leave Encashment Calculated"),
    ("settlement", "Pending Expenses Settled"),
    ("settlement", "Final Salary Processed"),
    ("settlement", "PF Withdrawal / Transfer Initiated"),
    ("settlement", "Gratuity Amount Calculated"),
    # Exit Documents
    ("exit_documents", "Exit Interview Completed"),
    ("exit_documents", "Experience Letter Issued"),
    ("exit_documents", "Relieving Letter Issued"),
    ("exit_documents", "NOC (No Objection Certificate) Issued"),
    ("exit_documents", "Form 16 Issued"),
]


class OnboardingChecklist(Base):
    __tablename__ = "onboarding_checklists"

    id          = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, unique=True)
    items       = Column(Text, nullable=False, default="{}")  # JSON string {item_key: {done, done_at, note}}
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", foreign_keys=[employee_id])


class OffboardingChecklist(Base):
    __tablename__ = "offboarding_checklists"

    id          = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, unique=True)
    items       = Column(Text, nullable=False, default="{}")
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", foreign_keys=[employee_id])
