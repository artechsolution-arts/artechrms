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
from sqlalchemy import case as sa_case, func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from backend.models.employee import Employee
from backend.models.leave import Attendance

# Hours threshold below which a day counts as Half Day (only used when both punches exist)
HALF_DAY_HOURS = 4.0


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

    processed = 0
    unmatched_ids = set()
    matched_emps = set()

    tbl = Attendance.__table__

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

        # First punch = login, last punch = logout.
        # In-between punches are ignored — only first and last matter.
        # out_time is only set when there is more than one distinct punch.
        gap_hours = (last - first).total_seconds() / 3600.0
        out_time  = last.strftime("%H:%M") if last != first else None
        hours     = round(gap_hours, 2) if out_time else 0.0

        status = "Present"
        if out_time and hours < HALF_DAY_HOURS:
            status = "Half Day"

        # Atomic upsert — INSERT or UPDATE in one statement so two concurrent
        # sync runs (auto-sync + manual sync) can never create duplicate rows.
        stmt = pg_insert(tbl).values(
            employee_id=emp.id,
            date=d,
            in_time=in_time,
            out_time=out_time,
            working_hours=hours,
            status=status,
        )

        excl = stmt.excluded  # the new values being proposed

        stmt = stmt.on_conflict_do_update(
            constraint="uq_attendance_emp_date",
            set_={
                # Always refresh in_time.
                "in_time": excl.in_time,
                # Preserve existing out_time when this sync has no checkout
                # (mid-day sync, device memory gap, PC-off-overnight scenario).
                "out_time": func.coalesce(excl.out_time, tbl.c.out_time),
                # Keep hours consistent with whichever out_time wins.
                "working_hours": sa_case(
                    (excl.out_time.isnot(None), excl.working_hours),
                    else_=tbl.c.working_hours,
                ),
                # Don't overwrite a manually set leave/WFH status.
                # If we're preserving existing out_time, also preserve its status.
                "status": sa_case(
                    (tbl.c.status.in_(["On Leave", "WFH"]), tbl.c.status),
                    (
                        # New sync has no checkout but DB already has one →
                        # keep the existing status (could be Half Day).
                        (excl.out_time.is_(None)) & (tbl.c.out_time.isnot(None)),
                        tbl.c.status,
                    ),
                    else_=excl.status,
                ),
            },
        )

        db.execute(stmt)
        processed += 1

    db.commit()

    return {
        "punches_read": len(punches),
        "days_processed": len(grouped),
        "records_upserted": processed,
        "employees_matched": len(matched_emps),
        "unmatched_biometric_ids": sorted(unmatched_ids),
    }
