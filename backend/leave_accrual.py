"""
Monthly leave accrual — adds 1 Casual Leave + 1 Sick Leave per month
to every Active, non-Probation employee.

Runs automatically in the background on app startup.
Safe to call multiple times in the same month (idempotent via accrual log).
"""
import threading
import time
import logging
from datetime import datetime, date

logger = logging.getLogger(__name__)

# Leave type IDs (Casual=3, Sick=2 as seeded in the DB)
_CL_NAME = "Casual Leave"
_SL_NAME = "Sick Leave"
_ACCRUAL_PER_MONTH = 1.0   # per leave type


def _run_accrual(year_month: str) -> int:
    """
    Accrue 1 CL + 1 SL for all active non-probation employees for the given
    year_month (e.g. "2026-05"). Returns the number of employees credited.
    Skips if the month is already in the accrual log.
    """
    from backend.database import SessionLocal
    from backend.models.hrm import LeaveBalance
    from backend.models.leave import LeaveType
    from backend.models.employee import Employee
    from sqlalchemy import text

    db = SessionLocal()
    try:
        # Check if already done
        already = db.execute(
            text("SELECT id FROM leave_accrual_log WHERE year_month = :ym"),
            {"ym": year_month},
        ).fetchone()
        if already:
            return 0

        year = int(year_month[:4])

        cl = db.query(LeaveType).filter(LeaveType.name == _CL_NAME).first()
        sl = db.query(LeaveType).filter(LeaveType.name == _SL_NAME).first()
        if not cl or not sl:
            logger.warning("Leave accrual: Casual Leave or Sick Leave type not found")
            return 0

        employees = db.query(Employee).filter(
            Employee.status == "Active",
            Employee.employment_type != "Probation",
        ).all()

        credited = 0
        for emp in employees:
            for lt_id, lt_name in ((cl.id, _CL_NAME), (sl.id, _SL_NAME)):
                bal = db.query(LeaveBalance).filter(
                    LeaveBalance.employee_id == emp.id,
                    LeaveBalance.leave_type_id == lt_id,
                    LeaveBalance.year == year,
                ).first()
                if bal:
                    bal.allocated += _ACCRUAL_PER_MONTH
                else:
                    bal = LeaveBalance(
                        employee_id=emp.id,
                        leave_type_id=lt_id,
                        year=year,
                        allocated=_ACCRUAL_PER_MONTH,
                        used=0,
                        carried_forward=0,
                    )
                    db.add(bal)
            credited += 1

        db.execute(
            text("INSERT INTO leave_accrual_log (year_month, employees_credited) VALUES (:ym, :n)"),
            {"ym": year_month, "n": credited},
        )
        db.commit()
        logger.info("Leave accrual for %s: %d employees credited", year_month, credited)
        return credited

    except Exception:
        logger.exception("Leave accrual failed for %s", year_month)
        db.rollback()
        return 0
    finally:
        db.close()


def _accrual_loop():
    """Background thread: check every 6 hours; accrue if a new month has arrived."""
    while True:
        try:
            ym = date.today().strftime("%Y-%m")
            _run_accrual(ym)
        except Exception:
            logger.exception("Accrual loop error")
        time.sleep(6 * 3600)  # check every 6 hours


def start_accrual_scheduler():
    """Start the background accrual thread. Call once from app startup."""
    t = threading.Thread(target=_accrual_loop, daemon=True, name="leave-accrual")
    t.start()
    logger.info("Leave accrual scheduler started")
