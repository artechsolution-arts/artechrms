from sqlalchemy import Column, Integer, String, Date, Boolean, ForeignKey, DateTime, Text, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base


class LetterheadTemplate(Base):
    """Singleton row (id=1) — HR-configurable letterhead for all generated letters."""
    __tablename__ = "letterhead_template"
    id             = Column(Integer, primary_key=True, default=1)
    company_name   = Column(String, default="AR TECH SOLUTIONS")
    tagline        = Column(String, default="Driven By Innovation")
    logo_filename  = Column(String, nullable=True)
    logo_x_mm      = Column(Float, default=16.0)
    logo_y_mm      = Column(Float, default=10.0)
    logo_w_mm      = Column(Float, default=32.0)
    logo_h_mm      = Column(Float, default=32.0)
    footer_image_filename = Column(String, nullable=True)
    footer_x_mm  = Column(Float, default=0.0)
    signature_filename = Column(String, nullable=True)
    sig_x_mm     = Column(Float, default=18.0)
    sig_w_mm     = Column(Float, default=40.0)
    sig_h_mm     = Column(Float, default=20.0)
    footer_y_mm  = Column(Float, default=0.0)
    footer_w_mm  = Column(Float, default=210.0)
    footer_h_mm  = Column(Float, default=62.0)
    content_top_mm = Column(Float, default=58.92)
    body_font      = Column(String, default="Source Sans 3")
    body_font_size = Column(Float, default=10.5)
    body_bold      = Column(Boolean, default=False)
    body_italic    = Column(Boolean, default=False)
    watermark_filename = Column(String, nullable=True)
    watermark_opacity  = Column(Float, default=0.08)
    watermark_x_mm     = Column(Float, default=45.0)
    watermark_y_mm     = Column(Float, default=88.5)
    watermark_w_mm     = Column(Float, default=120.0)
    watermark_h_mm     = Column(Float, default=120.0)
    addr1          = Column(String, default="Flat: 402, 4th Floor, 1-11-254 & 255")
    addr2          = Column(String, default="Naiks's Vijayasri Nivas, Prakash Nagar,")
    addr3          = Column(String, default="Begumpet, Hyderabad,")
    addr4          = Column(String, default="Telangana – 500016")
    phone1         = Column(String, default="+91 7993013344")
    phone2         = Column(String, default="+91 7993013355")
    email          = Column(String, default="info@artechsolution.co.in")
    website        = Column(String, default="www.artechsolution.co.in")
    header_color   = Column(String, default="#1764B4")
    accent_color   = Column(String, default="#01BEB0")
    hr_signatory   = Column(String, default="Radhika Yalamanchili")
    hr_role        = Column(String, default="Human Resource Executive")
    updated_at     = Column(DateTime, server_default=func.now(), onupdate=func.now())


class EmergencyContact(Base):
    __tablename__ = "emergency_contacts"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    name = Column(String(200), nullable=False)
    relationship_type = Column(String(100), nullable=False)
    phone = Column(String(30), nullable=False)
    email = Column(String(200), nullable=True)
    is_primary = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee_rel = relationship("Employee", foreign_keys=[employee_id])


class EmployeeDocument(Base):
    __tablename__ = "employee_documents"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    document_type = Column(
        String(100),
        nullable=False,
        # Aadhaar / PAN / Passport / Offer Letter / Experience Letter / Education Certificate / Other
    )
    document_name = Column(String(300), nullable=False)
    file_url = Column(String(500), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    employee_rel = relationship("Employee", foreign_keys=[employee_id])


class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    date = Column(Date, nullable=False)
    holiday_type = Column(String(50), default="Public")   # Public / Optional / Restricted
    description = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type_id = Column(Integer, ForeignKey("leave_types.id"), nullable=False)
    year = Column(Integer, nullable=False)
    allocated = Column(Float, default=0)
    used = Column(Float, default=0)
    carried_forward = Column(Float, default=0)

    __table_args__ = (
        UniqueConstraint("employee_id", "leave_type_id", "year", name="uq_leave_balance"),
    )

    employee_rel = relationship("Employee", foreign_keys=[employee_id])
    leave_type_rel = relationship("LeaveType", foreign_keys=[leave_type_id])


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    content = Column(Text, nullable=False)
    priority = Column(String(20), default="Medium")   # Low / Medium / High
    is_active = Column(Boolean, default=True)
    created_by = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_on = Column(Date, nullable=True)


class ExpenseClaim(Base):
    __tablename__ = "expense_claims"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    claim_date = Column(Date, nullable=False)
    expense_type = Column(
        String(100),
        nullable=False,
        # Travel / Food / Accommodation / Equipment / Medical / Training / Other
    )
    amount = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    receipt_url = Column(String(500), nullable=True)
    status = Column(String(30), default="Pending")    # Pending / Approved / Rejected / Paid
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_on = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee_rel = relationship("Employee", foreign_keys=[employee_id])
    approver_rel = relationship("User", foreign_keys=[approved_by])


class EmployeeAsset(Base):
    __tablename__ = "employee_assets"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    asset_name = Column(String(200), nullable=False)
    asset_type = Column(String(100), nullable=False)   # Laptop / Mobile / Vehicle / Furniture / Other
    serial_number = Column(String(100), nullable=True)
    allocated_date = Column(Date, nullable=False)
    returned_date = Column(Date, nullable=True)
    condition = Column(String(20), default="Good")     # Good / Fair / Poor
    notes = Column(String(500), nullable=True)
    status = Column(String(30), default="Allocated")   # Allocated / Returned
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee_rel = relationship("Employee", foreign_keys=[employee_id])


class EmployeeHistory(Base):
    __tablename__ = "employee_history"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    change_type = Column(
        String(100),
        default="Transfer",
        # Joining / Transfer / Promotion / Demotion /
        # Department Change / Role Change / Status Change
    )
    from_department = Column(String(200), nullable=True)
    to_department = Column(String(200), nullable=True)
    from_designation = Column(String(200), nullable=True)
    to_designation = Column(String(200), nullable=True)
    effective_date = Column(Date, nullable=False)
    salary_before = Column(Float, nullable=True)
    salary_after = Column(Float, nullable=True)
    last_working_date = Column(Date, nullable=True)
    remarks = Column(Text, nullable=True)
    created_by = Column(String(200), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee_rel = relationship("Employee", foreign_keys=[employee_id])
