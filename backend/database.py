import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:Joseph%4029@127.0.0.1:5432/artechrms"
)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from backend import models  # noqa: F401 — registers all models
    Base.metadata.create_all(bind=engine)
    # Add columns introduced after initial deploy (safe to run repeatedly)
    with engine.connect() as conn:
        conn.execute(
            __import__("sqlalchemy").text(
                "ALTER TABLE biometric_devices ADD COLUMN IF NOT EXISTS password INTEGER DEFAULT 0"
            )
        )
        conn.commit()
