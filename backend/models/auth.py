from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from backend.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(200), unique=True, index=True)
    full_name = Column(String(200))
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default="Employee")  # Admin, HR Manager, HR User, Employee
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
