"""
Automatic biometric attendance sync.

Runs as a background daemon thread inside the FastAPI process. On a fixed
interval it pulls punch logs from the configured eSSL/ZK device(s) and writes
login/logout times into the attendance table — no manual action required.

Device configuration (set on the SERVER where the device is reachable):
    BIOMETRIC_DEVICE_IP        e.g. 192.168.1.201   (required to enable sync)
    BIOMETRIC_DEVICE_PORT      default 4370
    BIOMETRIC_SYNC_INTERVAL_MIN default 15
    BIOMETRIC_SYNC_BACKFILL_DAYS default 1  (also re-sync the previous N days
                                             to catch late check-outs)

If BIOMETRIC_DEVICE_IP is not set AND no devices exist in the DB, the scheduler
stays idle — so it's a harmless no-op on a dev machine with no device on the LAN.
"""
import os
import threading
import time
import logging
from datetime import date, timedelta

logger = logging.getLogger("biometric")


def _interval_seconds() -> int:
    try:
        return max(1, int(os.getenv("BIOMETRIC_SYNC_INTERVAL_MIN", "15"))) * 60
    except ValueError:
        return 15 * 60


def _backfill_days() -> int:
    try:
        return max(0, int(os.getenv("BIOMETRIC_SYNC_BACKFILL_DAYS", "1")))
    except ValueError:
        return 1


def _collect_devices(db) -> list:
    """Devices to sync: env-configured one + any active rows in biometric_devices."""
    devices = []
    env_ip = os.getenv("BIOMETRIC_DEVICE_IP", "").strip()
    if env_ip:
        try:
            env_port = int(os.getenv("BIOMETRIC_DEVICE_PORT", "4370"))
        except ValueError:
            env_port = 4370
        devices.append((env_ip, env_port, None))

    try:
        from backend.models.biometric import BiometricDevice
        for d in db.query(BiometricDevice).filter(BiometricDevice.is_active == True).all():  # noqa: E712
            if not any(d.ip_address == ip and d.port == port for ip, port, _ in devices):
                devices.append((d.ip_address, d.port, d))
    except Exception:
        pass
    return devices


def _run_once():
    from backend.database import SessionLocal
    from backend import biometric_zk
    from datetime import datetime

    db = SessionLocal()
    try:
        devices = _collect_devices(db)
        if not devices:
            return  # nothing configured — idle
        to_date = date.today()
        from_date = to_date - timedelta(days=_backfill_days())
        for ip, port, row in devices:
            try:
                summary = biometric_zk.sync_device(db, ip, port, from_date, to_date)
                logger.info("Biometric sync %s:%s → %s", ip, port, summary)
                if row is not None:
                    row.last_sync_at = datetime.utcnow()
                    row.last_status = (
                        f"Auto-synced {summary['records_created']} new / "
                        f"{summary['records_updated']} updated"
                    )
                    db.commit()
            except Exception as e:
                logger.warning("Biometric sync failed for %s:%s — %s", ip, port, e)
                if row is not None:
                    try:
                        row.last_status = f"Auto-sync error: {e}"
                        db.commit()
                    except Exception:
                        db.rollback()
    finally:
        db.close()


def _loop():
    interval = _interval_seconds()
    # small initial delay so the app finishes booting first
    time.sleep(20)
    while True:
        try:
            _run_once()
        except Exception as e:
            logger.warning("Biometric scheduler tick error: %s", e)
        time.sleep(interval)


_started = False


def start_scheduler():
    """Start the background sync thread once. Safe to call on startup."""
    global _started
    if _started:
        return
    _started = True
    t = threading.Thread(target=_loop, name="biometric-sync", daemon=True)
    t.start()
    logger.info("Biometric auto-sync scheduler started (interval=%ss)", _interval_seconds())
