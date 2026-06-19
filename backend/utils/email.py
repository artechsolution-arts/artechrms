"""
Fire-and-forget email utility using Python's built-in smtplib.
Runs on a background thread so it never blocks an API response.

Required env vars (leave unset to disable email silently):
  SMTP_HOST      e.g. smtp.gmail.com
  SMTP_PORT      default 587 (STARTTLS)
  SMTP_USER      your@gmail.com
  SMTP_PASSWORD  app password (not your login password)
  SMTP_FROM      optional — defaults to SMTP_USER
"""

import os
import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from concurrent.futures import ThreadPoolExecutor

log = logging.getLogger(__name__)

SMTP_HOST     = os.getenv("SMTP_HOST", "")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM     = os.getenv("SMTP_FROM", SMTP_USER)

_pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="email")


def _send_sync(to: str, subject: str, html: str) -> None:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = SMTP_FROM or SMTP_USER
        msg["To"]      = to
        msg.attach(MIMEText(html, "html", "utf-8"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.sendmail(SMTP_FROM or SMTP_USER, to, msg.as_string())
    except Exception as exc:
        log.error("Email to %s failed: %s", to, exc)


def send_email(to: str, subject: str, html: str) -> None:
    """Queue an email on a background thread. Returns immediately."""
    if not to or not SMTP_HOST or not SMTP_USER:
        return
    _pool.submit(_send_sync, to, subject, html)


# ── Email templates ──────────────────────────────────────────────────────────

def _base(content: str) -> str:
    return f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9fafb;padding:24px;border-radius:12px">
      <div style="background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
        <div style="background:#1e40af;padding:20px 24px">
          <h2 style="color:white;margin:0;font-size:18px">Artech HRMS</h2>
        </div>
        <div style="padding:24px">{content}</div>
        <div style="padding:16px 24px;background:#f3f4f6;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb">
          This is an automated message from Artech HRMS. Please do not reply.
        </div>
      </div>
    </div>"""


def leave_status_email(employee_name: str, leave_type: str,
                        from_date, to_date, days: float,
                        status: str, remarks: str = "") -> tuple[str, str]:
    """Return (subject, html) for a leave approval/rejection notification."""
    color   = "#16a34a" if status == "Approved" else "#dc2626"
    emoji   = "✅" if status == "Approved" else "❌"
    subject = f"{emoji} Leave {status} — {leave_type} ({days} day{'s' if days != 1 else ''})"

    remarks_block = (
        f'<p style="color:#374151;margin:16px 0 0"><b>Remarks:</b> {remarks}</p>'
        if remarks else ""
    )

    html = _base(f"""
        <h3 style="margin:0 0 16px;color:#111827">Hi {employee_name},</h3>
        <p style="color:#374151;margin:0 0 20px">
          Your leave request has been <strong style="color:{color}">{status}</strong>.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280;width:140px">Leave Type</td>
              <td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">{leave_type}</td></tr>
          <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280">From</td>
              <td style="padding:10px;border:1px solid #e5e7eb">{from_date}</td></tr>
          <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280">To</td>
              <td style="padding:10px;border:1px solid #e5e7eb">{to_date}</td></tr>
          <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280">Days</td>
              <td style="padding:10px;border:1px solid #e5e7eb">{days}</td></tr>
          <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280">Status</td>
              <td style="padding:10px;border:1px solid #e5e7eb;font-weight:700;color:{color}">{status}</td></tr>
        </table>
        {remarks_block}
    """)
    return subject, html


def new_leave_request_email(hr_name: str, employee_name: str, leave_type: str,
                             from_date, to_date, days: float) -> tuple[str, str]:
    """Notification to HR when a new leave request comes in."""
    subject = f"📋 New Leave Request — {employee_name} ({days} day{'s' if days != 1 else ''})"
    html = _base(f"""
        <h3 style="margin:0 0 16px;color:#111827">Hi {hr_name},</h3>
        <p style="color:#374151;margin:0 0 20px">
          A new leave request requires your approval.
        </p>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280;width:140px">Employee</td>
              <td style="padding:10px;border:1px solid #e5e7eb;font-weight:600">{employee_name}</td></tr>
          <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280">Leave Type</td>
              <td style="padding:10px;border:1px solid #e5e7eb">{leave_type}</td></tr>
          <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280">From</td>
              <td style="padding:10px;border:1px solid #e5e7eb">{from_date}</td></tr>
          <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280">To</td>
              <td style="padding:10px;border:1px solid #e5e7eb">{to_date}</td></tr>
          <tr><td style="padding:10px;background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280">Days</td>
              <td style="padding:10px;border:1px solid #e5e7eb">{days}</td></tr>
        </table>
        <p style="margin:20px 0 0;font-size:13px;color:#6b7280">
          Log in to Artech HRMS to review and take action.
        </p>
    """)
    return subject, html
