import sys
sys.path.insert(0, '/app')
from backend.database import SessionLocal, engine
from sqlalchemy import text
from backend.models.leave import Attendance
from datetime import date, timedelta
from sqlalchemy import asc

with engine.connect() as conn:
    res = conn.execute(text("SELECT conname FROM pg_constraint WHERE conname = 'uq_attendance_emp_date'"))
    row = res.fetchone()
    print("Unique constraint:", row[0] if row else "NOT FOUND")

db = SessionLocal()
yesterday = date.today() - timedelta(days=1)
records = db.query(Attendance).filter(Attendance.date == yesterday).order_by(asc(Attendance.id)).all()
print(f"Records for {yesterday}: {len(records)}")
missing = [r for r in records if not r.out_time]
print(f"Missing out_time: {len(missing)}")
for r in records[:8]:
    print(f"  id={r.id} emp={r.employee_id} in={r.in_time} out={r.out_time} hrs={r.working_hours}")
db.close()
