import os
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from sqlalchemy.dialects.postgresql import insert as pg_insert
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from backend.database import get_db, SessionLocal
from backend.models.biometric import BiometricDevice
from backend.models.employee import Employee
from backend.models.leave import Attendance
from backend import biometric_zk

router = APIRouter(prefix="/api/biometric", tags=["Biometric"])

# ── ZKTeco ADMS push receiver (device → cloud) ──────────────────────────────
# Configure on the device: Menu → Comm → Cloud Server
#   Server IP  : www.arpeopliz.com
#   Server Port: 443
#   HTTPS      : Yes
#   API Path   : /iclock   (some firmware uses /api/biometric/iclock)
# The device will push attendance records here every few minutes.

_ADMS_PREFIX = "/iclock"

HALF_DAY_HOURS = 4.0

# Per-device stamp tracking (in-memory; resets on restart → triggers full resync, safe due to upsert)
# Key: device serial number (SN), Value: unix timestamp of last punch we processed
_device_stamps: dict[str, int] = {}


def _upsert_punch(db: Session, bio_id: str, ts: datetime):
    """Insert or merge a single punch into the attendance table.

    Rule: first punch of the day = in_time (login).
          every later punch = out_time (logout), only advancing forward.
          in-between punches are naturally overwritten by the last one.
    """
    emp = db.query(Employee).filter(Employee.biometric_id == bio_id.strip()).first()
    if not emp:
        return False

    d          = ts.date()
    punch_time = ts.strftime("%H:%M")

    existing = db.query(Attendance).filter(
        Attendance.employee_id == emp.id,
        Attendance.date        == d,
    ).first()

    if existing:
        if not existing.in_time:
            return True
        in_dt = datetime.strptime(f"{d} {existing.in_time}", "%Y-%m-%d %H:%M")
        if ts <= in_dt:
            return True  # earlier than or same as check-in — ignore

        # Only advance out_time — never overwrite a later punch with an earlier one
        if existing.out_time:
            out_dt = datetime.strptime(f"{d} {existing.out_time}", "%Y-%m-%d %H:%M")
            if ts <= out_dt:
                return True  # not the latest punch yet — skip

        gap = (ts - in_dt).total_seconds() / 3600.0
        existing.out_time      = punch_time
        existing.working_hours = round(gap, 2)
        if existing.status not in ("On Leave", "WFH"):
            existing.status = "Half Day" if gap < HALF_DAY_HOURS else "Present"
        db.commit()
    else:
        tbl  = Attendance.__table__
        stmt = pg_insert(tbl).values(
            employee_id=emp.id, date=d,
            in_time=punch_time, out_time=None, working_hours=0.0, status="Present",
        ).on_conflict_do_nothing(constraint="uq_attendance_emp_date")
        db.execute(stmt)
        db.commit()

    return True


@router.get(_ADMS_PREFIX + "/getrequest")
@router.get(_ADMS_PREFIX + "/getrequest/{rest:path}")
async def adms_getrequest(request: Request):
    """Device polls here for commands.
    Return GetStamp=0 on first contact so device sends full history.
    Return last-processed timestamp on subsequent calls so device only sends new punches.
    """
    sn = request.query_params.get("SN", "unknown")
    stamp = _device_stamps.get(sn, 0)   # 0 = "send everything you have"
    return Response(
        content=f"OK\r\nGetStamp={stamp}\r\n",
        media_type="text/plain",
    )


@router.post(_ADMS_PREFIX + "/cdata")
async def adms_cdata(request: Request, db: Session = Depends(get_db)):
    """
    Receive attendance push from ZKTeco device.
    Each line: UserID\\tTimestamp\\tStatus\\tVerify\\tWorkCode\\tReserved
    Status 0=CheckIn 1=CheckOut 2=BreakOut 3=BreakIn 4=OTIn 5=OTOut
    """
    table = request.query_params.get("table", "")
    sn    = request.query_params.get("SN", "")

    body = (await request.body()).decode("utf-8", errors="ignore")

    if table != "ATTLOG" or not body.strip():
        return Response(content="OK: 0\r\n", media_type="text/plain")

    accepted   = 0
    latest_unix = _device_stamps.get(sn, 0)

    for line in body.strip().splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        bio_id = parts[0].strip()
        try:
            ts = datetime.strptime(parts[1].strip(), "%Y-%m-%d %H:%M:%S")
        except ValueError:
            continue
        try:
            if _upsert_punch(db, bio_id, ts):
                accepted += 1
            # advance stamp even for unmatched punches so device doesn't re-send them
            unix_ts = int(ts.timestamp())
            if unix_ts > latest_unix:
                latest_unix = unix_ts
        except Exception:
            pass

    # Persist the latest timestamp so next GetStamp call returns it
    if sn and latest_unix > _device_stamps.get(sn, 0):
        _device_stamps[sn] = latest_unix

    return Response(content=f"OK: {accepted}\r\n", media_type="text/plain")


class DeviceIn(BaseModel):
    name: str
    ip_address: str
    port: int = 4370
    location: Optional[str] = None
    is_active: bool = True


class SyncIn(BaseModel):
    device_id: int
    from_date: date
    to_date: date


def _ser(d: BiometricDevice) -> dict:
    return {
        "id": d.id, "name": d.name, "ip_address": d.ip_address, "port": d.port,
        "location": d.location, "is_active": d.is_active,
        "last_sync_at": str(d.last_sync_at) if d.last_sync_at else None,
        "last_status": d.last_status,
    }


# ── Device CRUD ──────────────────────────────────────────────
@router.get("/devices")
def list_devices(db: Session = Depends(get_db)):
    return [_ser(d) for d in db.query(BiometricDevice).order_by(BiometricDevice.id).all()]


@router.post("/devices")
def add_device(data: DeviceIn, db: Session = Depends(get_db)):
    d = BiometricDevice(**data.model_dump())
    db.add(d)
    db.commit()
    db.refresh(d)
    return _ser(d)


@router.put("/devices/{device_id}")
def update_device(device_id: int, data: DeviceIn, db: Session = Depends(get_db)):
    d = db.query(BiometricDevice).filter(BiometricDevice.id == device_id).first()
    if not d:
        raise HTTPException(404, "Device not found")
    for k, v in data.model_dump().items():
        setattr(d, k, v)
    db.commit()
    return _ser(d)


@router.delete("/devices/{device_id}")
def delete_device(device_id: int, db: Session = Depends(get_db)):
    d = db.query(BiometricDevice).filter(BiometricDevice.id == device_id).first()
    if not d:
        raise HTTPException(404, "Device not found")
    db.delete(d)
    db.commit()
    return {"ok": True}


# ── Connectivity & mapping helpers ───────────────────────────
@router.post("/devices/{device_id}/test")
def test_device(device_id: int, db: Session = Depends(get_db)):
    d = db.query(BiometricDevice).filter(BiometricDevice.id == device_id).first()
    if not d:
        raise HTTPException(404, "Device not found")
    try:
        res = biometric_zk.test_connection(d.ip_address, d.port)
        d.last_status = f"Connected · {res.get('enrolled_users', 0)} users"
        db.commit()
        return res
    except Exception as e:
        d.last_status = f"Error: {e}"
        db.commit()
        raise HTTPException(400, f"Could not reach device: {e}")


@router.get("/devices/{device_id}/users")
def device_users(device_id: int, db: Session = Depends(get_db)):
    d = db.query(BiometricDevice).filter(BiometricDevice.id == device_id).first()
    if not d:
        raise HTTPException(404, "Device not found")
    try:
        return biometric_zk.get_device_users(d.ip_address, d.port)
    except Exception as e:
        raise HTTPException(400, f"Could not read users: {e}")


# ── Sync punches → attendance ────────────────────────────────
@router.post("/sync")
def sync(data: SyncIn, db: Session = Depends(get_db)):
    d = db.query(BiometricDevice).filter(BiometricDevice.id == data.device_id).first()
    if not d:
        raise HTTPException(404, "Device not found")
    if data.from_date > data.to_date:
        raise HTTPException(400, "from_date must be on or before to_date")
    try:
        summary = biometric_zk.sync_device(db, d.ip_address, d.port, data.from_date, data.to_date)
        d.last_sync_at = datetime.utcnow()
        d.last_status = (
            f"Synced {summary['records_created']} new / {summary['records_updated']} updated"
        )
        db.commit()
        return {"ok": True, **summary}
    except Exception as e:
        d.last_status = f"Sync error: {e}"
        db.commit()
        raise HTTPException(400, f"Sync failed: {e}")
