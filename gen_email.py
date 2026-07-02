import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.path.insert(0, "C:/artechrms")
from backend.utils.email import leave_status_email

s1, h1 = leave_status_email(
    employee_name="Saifa Khan",
    leave_type="Casual Leave",
    from_date="2026-06-25",
    to_date="2026-06-27",
    days=3.0,
    status="Approved",
    remarks="",
)
print("Approved subject:", s1)
with open("C:/artechrms/sample_approved_email.html", "w", encoding="utf-8") as f:
    f.write("<html><body style='margin:0;padding:40px;background:#e5e7eb'>" + h1 + "</body></html>")

s2, h2 = leave_status_email(
    employee_name="Saifa Khan",
    leave_type="Casual Leave",
    from_date="2026-06-25",
    to_date="2026-06-27",
    days=3.0,
    status="Rejected",
    remarks="We are short-staffed on those dates due to a critical project deadline.",
)
print("Rejected subject:", s2)
with open("C:/artechrms/sample_rejected_email.html", "w", encoding="utf-8") as f:
    f.write("<html><body style='margin:0;padding:40px;background:#e5e7eb'>" + h2 + "</body></html>")
print("Done.")
