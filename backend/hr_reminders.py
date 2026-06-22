"""
Daily HR reminder scheduler.

Checks every 24 hours and sends in-app notifications to HR for:
  • Employee birthdays (on the day)
  • Work anniversaries — 1 yr, 2 yrs, … (on the day)
  • Probation completion — 7 days before, 1 day before, and on the day
  • New joiners — 1 day before joining date

Fully idempotent via the hr_reminder_log table.
"""
import threading
import time
import logging
from datetime import date, timedelta

logger = logging.getLogger(__name__)

_PROBATION_ALERT_DAYS = [7, 1, 0]


def _already_sent(db, key: str) -> bool:
    from sqlalchemy import text
    return db.execute(
        text("SELECT id FROM hr_reminder_log WHERE reminder_key = :k"),
        {"k": key},
    ).fetchone() is not None


def _mark_sent(db, key: str):
    from sqlalchemy import text
    db.execute(
        text("INSERT INTO hr_reminder_log (reminder_key) VALUES (:k) ON CONFLICT DO NOTHING"),
        {"k": key},
    )


def _run_reminders(today: date):
    from backend.database import SessionLocal
    from backend.models.employee import Employee
    from backend.services import notification_service as _notif

    db = SessionLocal()
    try:
        employees = db.query(Employee).filter(Employee.status != "Left").all()

        for emp in employees:
            name = emp.full_name or f"{emp.first_name} {emp.last_name or ''}".strip()

            # ── Birthday ─────────────────────────────────────────────────────
            if emp.date_of_birth:
                dob = emp.date_of_birth
                if dob.month == today.month and dob.day == today.day:
                    key = f"birthday:{emp.id}:{today}"
                    if not _already_sent(db, key):
                        _notif.push_to_role(
                            db, "HR", "reminder",
                            f"Birthday — {name}",
                            f"Today is {name}'s birthday! Don't forget to wish them.",
                            notif_type="info", priority="medium",
                        )
                        _mark_sent(db, key)

            # ── Work anniversary ─────────────────────────────────────────────
            if emp.date_of_joining and emp.status == "Active":
                doj = emp.date_of_joining
                if doj.month == today.month and doj.day == today.day and doj.year != today.year:
                    years = today.year - doj.year
                    key = f"anniversary:{emp.id}:{today}"
                    if not _already_sent(db, key):
                        _notif.push_to_role(
                            db, "HR", "reminder",
                            f"{years}-Year Anniversary — {name}",
                            f"{name} completes {years} year{'s' if years > 1 else ''} at Artech today!",
                            notif_type="info", priority="medium",
                        )
                        _mark_sent(db, key)

            # ── Probation completion ─────────────────────────────────────────
            if (
                emp.employment_type == "Probation"
                and emp.probation_period_days
                and emp.date_of_joining
            ):
                probation_end = emp.date_of_joining + timedelta(days=emp.probation_period_days)
                days_left = (probation_end - today).days
                if days_left in _PROBATION_ALERT_DAYS:
                    key = f"probation_d{days_left}:{emp.id}:{today}"
                    if not _already_sent(db, key):
                        if days_left == 0:
                            title = f"Probation Ends Today — {name}"
                            msg   = f"{name}'s probation ends today. Please confirm, extend, or release."
                        elif days_left == 1:
                            title = f"Probation Ends Tomorrow — {name}"
                            msg   = (f"{name}'s probation ends tomorrow "
                                     f"({probation_end.strftime('%d %b %Y')}). Action required.")
                        else:
                            title = f"Probation in {days_left} Days — {name}"
                            msg   = (f"{name}'s probation ends on "
                                     f"{probation_end.strftime('%d %b %Y')} ({days_left} days left).")
                        _notif.push_to_role(
                            db, "HR", "reminder", title, msg,
                            notif_type="warning", priority="high",
                        )
                        _mark_sent(db, key)

            # ── New joiner — alert 1 day before ─────────────────────────────
            if emp.date_of_joining == today + timedelta(days=1):
                key = f"new_joiner:{emp.id}:{today}"
                if not _already_sent(db, key):
                    _notif.push_to_role(
                        db, "HR", "reminder",
                        f"New Joiner Tomorrow — {name}",
                        f"{name} joins tomorrow ({emp.date_of_joining.strftime('%d %b %Y')}). Prepare onboarding.",
                        notif_type="info", priority="high",
                    )
                    _mark_sent(db, key)

        db.commit()
        logger.info("HR reminders processed for %s", today)

    except Exception:
        logger.exception("HR reminder run failed for %s", today)
        db.rollback()
    finally:
        db.close()


def _reminder_loop():
    while True:
        try:
            _run_reminders(date.today())
        except Exception:
            logger.exception("HR reminder loop error")
        time.sleep(24 * 3600)


def start_reminder_scheduler():
    """Start the daily HR reminder thread. Call once from app startup."""
    t = threading.Thread(target=_reminder_loop, daemon=True, name="hr-reminders")
    t.start()
    logger.info("HR reminder scheduler started")
