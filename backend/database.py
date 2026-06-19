import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:Joseph%4029@127.0.0.1:5432/artechrms"
)

# Neon DB (and some platforms like Railway/Heroku) may give "postgres://" URLs.
# SQLAlchemy requires "postgresql://".
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

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

    sql = __import__("sqlalchemy").text

    with engine.connect() as conn:
        # Columns added after initial deploy (safe to run repeatedly)
        conn.execute(sql(
            "ALTER TABLE biometric_devices ADD COLUMN IF NOT EXISTS password INTEGER DEFAULT 0"
        ))

        # Readable view: status sheet with employee details joined in
        conn.execute(sql("""
            CREATE OR REPLACE VIEW v_status_sheet AS
            SELECT
                se.id,
                e.employee_id           AS emp_code,
                e.full_name             AS employee_name,
                e.department,
                e.designation,
                TO_CHAR(se.entry_date, 'YYYY-MM')  AS month,
                se.task_id,
                se.entry_date,
                se.task_name,
                se.due_date,
                se.status,
                se.percent_complete,
                se.updated_at
            FROM status_entries se
            JOIN employees e ON e.id = se.employee_id
            ORDER BY e.full_name, se.entry_date
        """))

        conn.commit()
