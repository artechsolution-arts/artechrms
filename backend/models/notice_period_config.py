from sqlalchemy import Column, Integer
from sqlalchemy.dialects.postgresql import JSONB
from backend.database import Base

EMPLOYMENT_TYPES = ["Full-time", "Part-time", "Contract", "Intern"]

DEFAULT_RULES = {
    "Full-time": 60,
    "Part-time": 15,
    "Contract": 15,
    "Intern": 15,
}


class NoticePeriodConfig(Base):
    __tablename__ = "notice_period_config"

    id = Column(Integer, primary_key=True)
    rules = Column(JSONB, default=lambda: dict(DEFAULT_RULES))
