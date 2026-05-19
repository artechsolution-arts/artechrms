from sqlalchemy import Column, Integer, String, Date, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base


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
