from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, DateTime, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base


class PayrollRules(Base):
    """Company-wide payroll calculation rules. Only one row ever exists (id=1)."""
    __tablename__ = "payroll_rules"

    id = Column(Integer, primary_key=True, index=True)

    # Section toggles
    pf_enabled  = Column(Boolean, default=True)
    esi_enabled = Column(Boolean, default=True)
    hra_enabled = Column(Boolean, default=True)

    # Provident Fund
    pf_employee_rate = Column(Float, default=12.0)    # % of basic
    pf_employee_cap  = Column(Float, default=1800.0)  # monthly cap (0 = no cap)
    pf_employer_rate = Column(Float, default=12.0)
    pf_employer_cap  = Column(Float, default=1800.0)

    # ESI
    esi_employee_rate = Column(Float, default=0.75)   # % of gross
    esi_employer_rate = Column(Float, default=3.25)
    esi_wage_ceiling  = Column(Float, default=21000.0)

    # Professional Tax
    pt_enabled = Column(Boolean, default=True)

    # HRA default (fallback when not configured on employee)
    default_hra_percent = Column(Float, default=40.0)

    # LOP (Loss of Pay)
    lop_enabled = Column(Boolean, default=False)
    lop_basis   = Column(String(20), default="calendar")  # calendar | working

    # Gratuity (employer provision)
    gratuity_enabled = Column(Boolean, default=False)
    gratuity_rate    = Column(Float, default=4.81)    # % of basic  (15/26/12 * 100)

    # Bonus
    bonus_enabled    = Column(Boolean, default=False)
    bonus_rate       = Column(Float, default=8.33)    # % of basic
    bonus_wage_ceil  = Column(Float, default=7000.0)  # apply on min(basic, ceiling)

    # ── Standard Salary Structure (% of Gross/CTC) ──────────────
    use_salary_structure = Column(Boolean, default=True)
    basic_pct    = Column(Float, default=50.0)   # Basic Pay  = 50% of Gross
    hra_pct      = Column(Float, default=20.0)   # HRA        = 20% of Gross (= 40% of Basic)
    ca_pct       = Column(Float, default=12.33)  # Conveyance = 12.33% of Gross
    others_pct   = Column(Float, default=17.67)  # Others     = 17.67% of Gross

    # Custom components: [{name, component_type, calc_type, value}]
    custom_components = Column(JSON, default=[])

    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class SalaryComponent(Base):
    __tablename__ = "salary_components"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    abbr = Column(String(20))
    component_type = Column(String(20), default="Earning")  # Earning, Deduction
    amount = Column(Float, default=0)
    formula = Column(String(500))
    is_tax = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    is_active = Column(Integer, default=1)
    components = Column(JSON, default=[])  # list of {component_id, amount, formula}
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class SalarySlip(Base):
    __tablename__ = "salary_slips"

    id = Column(Integer, primary_key=True, index=True)
    slip_id = Column(String(50), unique=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    start_date = Column(Date)
    end_date = Column(Date)
    gross_pay = Column(Float, default=0)
    total_deduction = Column(Float, default=0)
    net_pay = Column(Float, default=0)
    earnings = Column(JSON, default=[])
    deductions = Column(JSON, default=[])
    status = Column(String(20), default="Draft")  # Draft, Submitted
    payroll_entry_id = Column(Integer, ForeignKey("payroll_entries.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employee_rel = relationship("Employee", back_populates="salary_slips")


class PayrollEntry(Base):
    __tablename__ = "payroll_entries"

    id = Column(Integer, primary_key=True, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    company = Column(String(200), default="Artech Solutions")
    status = Column(String(20), default="Draft")  # Draft, Submitted
    total_employees = Column(Integer, default=0)
    total_gross = Column(Float, default=0)
    total_net = Column(Float, default=0)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    salary_slips = relationship("SalarySlip", backref="payroll_entry_rel")
