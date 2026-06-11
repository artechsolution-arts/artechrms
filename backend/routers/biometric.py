from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

from backend.database import get_db
from backend.models.biometric import BiometricDevice
from backend import biometric_zk

router = APIRouter(prefix="/api/biometric", tags=["Biometric"])


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
