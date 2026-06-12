"""
eSSL / ZKTeco biometric device integration (direct device pull over LAN).

Reads punch logs stored inside the device's own memory using the ZK protocol
(port 4370 by default) — no eTimeTrackLite software or SQL database required.

Punches are collapsed per employee per day:
    first punch of the day  -> login  (in_time)
    last  punch of the day  -> logout (out_time)
and written into the `attendance` table.
"""
from datetime import date as _date, datetime
from collections import defaultdict
from sqlalchemy.orm import Session

from backend.models.employee import Employee
from backend.models.leave import Attendance

# Hours threshold below which a day counts as Half Day (only used when both punches exist)
HALF_DAY_HOURS = 4.0

# Minimum hours gap between first and last punch to treat the last punch as a real
# checkout. Anything shorter is assumed to be a break/coffee punch — out_time is left
# blank so the employee isn't wrongly flagged as Half Day.
MIN_CHECKOUT_HOURS = 2.0


def _connect(ip: str, port: int = 4370, timeout: int = 10, password: int = 0):
    """Open a ZK connection. Raises a clear error if pyzk is missing or device unreachable."""
    try:
        from zk import ZK
    except ImportError as e:
        raise RuntimeError(
            "The 'pyzk' library is not installed on the server. "
            "Install it with: pip install pyzk"
        ) from e
    zk = ZK(ip, port=int(port), timeout=timeout, password=int(password), force_udp=False, ommit_ping=True)
    return zk.connect()


def test_connection(ip: str, port: int = 4370, password: int = 0) -> dict:
    """Quick reachability/identity check for a device."""
    conn = None
    try:
        conn = _connect(ip, port, password=password)
        name = ""
        serial = ""
        users = 0
        try:
            name = conn.get_device_name() or ""
        except Exception:
            pass
        try:
            serial = conn.get_serialnumber() or ""
        except Exception:
            pass
        try:
            users = len(conn.get_users())
        except Exception:
            pass
        return {"ok": True, "device_name": name, "serial": serial, "enrolled_users": users}
    finally:
        if conn:
            try:
                conn.disconnect()
            except Exception:
                pass


def get_device_users(ip: str, port: int = 4370, password: int = 0) -> list:
    """List enrolled users on the device (enrollment id + name) — used for mapping."""
    conn = None
    try:
        conn = _connect(ip, port, password=password)
        out = []
        for u in conn.get_users():
            out.append({"biometric_id": str(u.user_id), "name": (u.name or "").strip()})
        return out
    finally:
        if conn:
            try:
                conn.disconnect()
            except Exception:
                pass


def _fetch_punches(ip: str, port: int, password: int = 0):
    """Return list of (biometric_id:str, timestamp:datetime) from the device."""
    conn = None
    try:
        conn = _connect(ip, port, password=password)
        # Freeze the device briefly so logs don't change mid-read
        try:
            conn.disable_device()
        except Exception:
            pass
        records = conn.get_attendance() or []
        punches = []
        for r in records:
            ts = getattr(r, "timestamp", None)
            uid = getattr(r, "user_id", None)
            if ts is None or uid is None:
                continue
            punches.append((str(uid), ts))
        return punches
    finally:
        if conn:
            try:
                conn.enable_device()
            except Exception:
                pass
            try:
                conn.disconnect()
            except Exception:
                pass


def sync_device(db: Session, ip: str, port: int, from_date: _date, to_date: _date, password: int = 0) -> dict:
    """
    Pull punches in [from_date, to_date], collapse to login/logout per employee/day,
    and upsert into the attendance table.
    Returns a summary dict.
    """
    punches = _fetch_punches(ip, port, password=password)

    # Map device enrollment id -> Employee
    emp_by_bio = {}
    for e in db.query(Employee).filter(Employee.biometric_id.isnot(None)).all():
        if e.biometric_id:
            emp_by_bio[str(e.biometric_id).strip()] = e

    # Group: (biometric_id, date) -> list[datetime]
    grouped = defaultdict(list)
    for bio_id, ts in punches:
        d = ts.date()
        if d < from_date or d > to_date:
            continue
        grouped[(bio_id, d)].append(ts)

    created = updated = 0
    unmatched_ids = set()
    matched_emps = set()

    for (bio_id, d), times in grouped.items():
        emp = emp_by_bio.get(bio_id)
        if not emp:
            unmatched_ids.add(bio_id)
            continue
        matched_emps.add(emp.id)
        times.sort()
        first = times[0]
        last  = times[-1]
        in_time = first.strftime("%H:%M")

        # Only treat the last punch as checkout if the gap from first punch is
        # large enough to be a real work session — short gaps are break punches.
        gap_hours = (last - first).total_seconds() / 3600.0
        out_time = last.strftime("%H:%M") if gap_hours >= MIN_CHECKOUT_HOURS else None

        hours = 0.0
        if out_time:
            hours = round(gap_hours, 2)

        # status: any punch => Present; both punches but short day => Half Day
        status = "Present"
        if out_time and hours and hours < HALF_DAY_HOURS:
            status = "Half Day"

        existing = db.query(Attendance).filter(
            Attendance.employee_id == emp.id,
            Attendance.date == d,
        ).first()

        if existing:
            existing.in_time = in_time
            existing.out_time = out_time
            existing.working_hours = hours
            # Don't override a manually set leave/WFH unless it was Absent/Present
            if existing.status in (None, "", "Absent", "Present", "Half Day"):
                existing.status = status
            updated += 1
        else:
            db.add(Attendance(
                employee_id=emp.id, date=d, status=status,
                in_time=in_time, out_time=out_time, working_hours=hours,
            ))
            created += 1

    db.commit()

    return {
        "punches_read": len(punches),
        "days_processed": len(grouped),
        "records_created": created,
        "records_updated": updated,
        "employees_matched": len(matched_emps),
        "unmatched_biometric_ids": sorted(unmatched_ids),
    }
