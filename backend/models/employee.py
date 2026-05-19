from sqlalchemy import Column, Integer, String, Date, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employees = relationship("Employee", back_populates="department_rel")


class Designation(Base):
    __tablename__ = "designations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    description = Column(String(500))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    employees = relationship("Employee", back_populates="designation_rel")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String(50), unique=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100))
    full_name = Column(String(200))
    email = Column(String(200), unique=True)
    mobile = Column(String(20))
    gender = Column(String(10))
    date_of_birth = Column(Date)
    date_of_joining = Column(Date, nullable=False)
    status = Column(String(20), default="Active")  # Active, Inactive, Left
    department_id = Column(Integer, ForeignKey("departments.id"))
    designation_id = Column(Integer, ForeignKey("designations.id"))
    reports_to_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    employment_type = Column(String(50), default="Full-time")
    bank_name = Column(String(100))
    bank_account_no = Column(String(50))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    profile_photo = Column(String(500), nullable=True)
    basic_salary = Column(Float, nullable=True)
    hra_percent = Column(Float, default=40.0)
    special_allowance = Column(Float, default=0.0)
    lta = Column(Float, default=0.0)
    other_allowance = Column(Float, default=0.0)
    pf_applicable = Column(Integer, default=1)
    esi_applicable = Column(Integer, default=1)
    pt_state = Column(String(50), default="Karnataka")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    department_rel = relationship("Department", back_populates="employees")
    designation_rel = relationship("Designation", back_populates="employees")
    leave_applications = relationship("LeaveApplication", back_populates="employee_rel")
    attendances = relationship("Attendance", back_populates="employee_rel")
    salary_slips = relationship("SalarySlip", back_populates="employee_rel")
    appraisals = relationship("Appraisal", back_populates="employee_rel")
