"""
Work hours alert scheduler.
Runs as a background daemon thread (same pattern as leave_accrual.py).

Weekly check  : every Monday — alerts employees whose total hours last week < threshold.
Monthly check : 1st of each month — alerts employees whose total hours last month < threshold.

Thresholds (configurable via env vars):
  WORK_HOURS_WEEKLY_MIN   default 40
  WORK_HOURS_MONTHLY_MIN  default 160
"""
import os
import threading
import time
import logging
from datetime import date, timedelta

logger = logging.getLogger(__name__)

_WEEKLY_MIN = float(os.getenv("WORK_HOURS_WEEKLY_MIN", "40"))
_MONTHLY_MIN = float(os.getenv("WORK_HOURS_MONTHLY_MIN", "160"))

# In-memory guard so we don't alert twice in the same period (resets on restart — acceptable).
_done_weekly: set = set()   # ISO week strings, e.g. "2026-W25"
_done_monthly: set = set()  # "YYYY-MM" strings


def _run_weekly_check(week_label: str) -> int:
    """Check last week's hours for all active employees. Returns alert count."""
    if week_label in _done_weekly:
        return 0

    from backend.database import SessionLocal
    from backend.models.employee import Employee
    from backend.models.leave import Attendance
    from backend.services.notification_service import push
    from sqlalchemy import func

    today = date.today()
    # Last Monday to Sunday
    last_monday = today - timedelta(days=today.weekday() + 7)
    last_sunday = last_monday + timedelta(days=6)

    db = SessionLocal()
    try:
        employees = db.query(Employee).filter(Employee.status == "Active").all()
        alerted = 0

        for emp in employees:
            total = (
                db.query(func.sum(Attendance.working_hours))
                .filter(
                    Attendance.employee_id == emp.id,
                    Attendance.date >= last_monday,
                    Attendance.date <= last_sunday,
                )
                .scalar()
            ) or 0.0

            if total < _WEEKLY_MIN:
                msg = (
                    f"Your logged hours last week ({total:.1f}h) are below "
                    f"the required {_WEEKLY_MIN:.0f} hours."
                )
                # Notify employee
                if emp.user_id:
                    push(
                        db,
                        emp.user_id,
                        entity_type="work_hours",
                        entity_id=emp.id,
                        title="Low Work Hours — Weekly Alert",
                        message=msg,
                        notif_type="alert",
                        action="my-attendance",
                        priority="medium",
                        send_email=True,
                        email_html=f"<p>{msg}</p><p>Please ensure your attendance is recorded correctly.</p>",
                    )

                # CC HR
                from backend.services.notification_service import push_to_role
                push_to_role(
                    db,
                    "HR",
                    entity_type="work_hours",
                    entity_id=emp.id,
                    title=f"Low Hours Alert — {emp.full_name}",
                    message=f"{emp.full_name} logged only {total:.1f}h last week (min {_WEEKLY_MIN:.0f}h).",
                    notif_type="alert",
                    action="employees",
                    priority="low",
                    is_cc=True,
                )

                db.commit()
                alerted += 1

        _done_weekly.add(week_label)
        logger.info("Weekly work hours check (%s): %d alerts sent", week_label, alerted)
        return alerted

    except Exception:
        logger.exception("Weekly work hours check failed for %s", week_label)
        db.rollback()
        return 0
    finally:
        db.close()


def _run_monthly_check(month_label: str) -> int:
    """Check previous month's hours for all active employees. Returns alert count."""
    if month_label in _done_monthly:
        return 0

    from backend.database import SessionLocal
    from backend.models.employee import Employee
    from backend.models.leave import Attendance
    from backend.services.notification_service import push, push_to_role
    from sqlalchemy import func
    import calendar

    today = date.today()
    # Previous month
    first_of_this = today.replace(day=1)
    last_month_end = first_of_this - timedelta(days=1)
    last_month_start = last_month_end.replace(day=1)

    db = SessionLocal()
    try:
        employees = db.query(Employee).filter(Employee.status == "Active").all()
        alerted = 0

        for emp in employees:
            total = (
                db.query(func.sum(Attendance.working_hours))
                .filter(
                    Attendance.employee_id == emp.id,
                    Attendance.date >= last_month_start,
                    Attendance.date <= last_month_end,
                )
                .scalar()
            ) or 0.0

            if total < _MONTHLY_MIN:
                period = last_month_start.strftime("%B %Y")
                msg = (
                    f"Your logged hours for {period} ({total:.1f}h) are below "
                    f"the required {_MONTHLY_MIN:.0f} hours."
                )
                if emp.user_id:
                    push(
                        db,
                        emp.user_id,
                        entity_type="work_hours",
                        entity_id=emp.id,
                        title=f"Low Work Hours — {period}",
                        message=msg,
                        notif_type="alert",
                        action="my-attendance",
                        priority="high",
                        send_email=True,
                        email_html=f"<p>{msg}</p><p>Please contact HR if there is a discrepancy.</p>",
                    )

                push_to_role(
                    db,
                    "HR",
                    entity_type="work_hours",
                    entity_id=emp.id,
                    title=f"Monthly Low Hours — {emp.full_name}",
                    message=f"{emp.full_name} logged only {total:.1f}h in {period} (min {_MONTHLY_MIN:.0f}h).",
                    notif_type="alert",
                    action="employees",
                    priority="medium",
                    is_cc=True,
                )

                db.commit()
                alerted += 1

        _done_monthly.add(month_label)
        logger.info("Monthly work hours check (%s): %d alerts sent", month_label, alerted)
        return alerted

    except Exception:
        logger.exception("Monthly work hours check failed for %s", month_label)
        db.rollback()
        return 0
    finally:
        db.close()


def _scheduler_loop():
    while True:
        try:
            today = date.today()

            # Weekly: run on Monday
            if today.weekday() == 0:
                week_label = today.strftime("%G-W%V")
                _run_weekly_check(week_label)

            # Monthly: run on 1st of each month
            if today.day == 1:
                # Check for previous month
                prev = (today.replace(day=1) - timedelta(days=1))
                month_label = prev.strftime("%Y-%m")
                _run_monthly_check(month_label)

        except Exception:
            logger.exception("Work hours scheduler error")

        time.sleep(3600)  # check every hour


def start_work_hours_scheduler():
    """Start the background work-hours alert thread. Call once on app startup."""
    t = threading.Thread(target=_scheduler_loop, daemon=True, name="work-hours-alerts")
    t.start()
    logger.info("Work hours alert scheduler started (weekly min=%.0fh, monthly min=%.0fh)",
                _WEEKLY_MIN, _MONTHLY_MIN)
