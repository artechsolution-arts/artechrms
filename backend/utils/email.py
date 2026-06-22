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


def _send_sync(to: str, subject: str, html: str, cc: str = "") -> None:
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"]    = SMTP_FROM or SMTP_USER
        msg["To"]      = to
        if cc:
            msg["Cc"] = cc
        msg.attach(MIMEText(html, "html", "utf-8"))

        all_recipients = [r.strip() for r in (to + ("," + cc if cc else "")).split(",") if r.strip()]
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.sendmail(SMTP_FROM or SMTP_USER, all_recipients, msg.as_string())
    except Exception as exc:
        log.error("Email to %s (cc %s) failed: %s", to, cc, exc)


def send_email(to: str, subject: str, html: str, cc: str = "") -> None:
    """Queue an email on a background thread. Returns immediately.
    `cc` is an optional comma-separated list of CC addresses.
    """
    if not to or not SMTP_HOST or not SMTP_USER:
        return
    _pool.submit(_send_sync, to, subject, html, cc)


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


def _ordinal(n: int) -> str:
    sfx = "th" if 11 <= n % 100 <= 13 else {1: "st", 2: "nd", 3: "rd"}.get(n % 10, "th")
    return f"{n}{sfx}"


def _pretty_date(d) -> str:
    """Format a date as '25th June'."""
    from datetime import date as _date
    if isinstance(d, str):
        d = _date.fromisoformat(str(d))
    months = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"]
    return f"{_ordinal(d.day)} {months[d.month - 1]}"


def _reason_clause(reason: str) -> str:
    """Turn the employee's reason field into a natural 'as I will be ...' clause."""
    r = reason.strip()
    if not r:
        return ""
    lower_r = r[0].lower() + r[1:]
    # Already first-person — just append
    if lower_r.startswith("i "):
        return f", {lower_r}"
    # Present-participle verbs — prefix with "as I will be"
    _gerund_starts = (
        "attend", "going", "travel", "visit", "participat",
        "celebrat", "tak", "journ", "undergo", "accompany",
    )
    if any(lower_r.startswith(g) for g in _gerund_starts):
        return f", as I will be {lower_r}"
    # Default — just "as"
    return f", as {lower_r}"


def new_leave_request_email(
    recipient_name: str,
    employee_name: str,
    leave_type: str,
    from_date,
    to_date,
    days: float,
    reason: str = "",
    is_cc: bool = False,
) -> tuple[str, str]:
    """Letter-style leave notification to HR (TO) or CEO (CC)."""
    from_pretty = _pretty_date(from_date)
    to_pretty   = _pretty_date(to_date)
    days_int    = int(days) if days == int(days) else days
    days_label  = f"{days_int} day{'s' if days_int != 1 else ''}"

    # Subject: date-based, just like a real leave email
    subject = f"Leave Request: {from_pretty} – {to_pretty}"
    if is_cc:
        subject = f"[CC] {subject} — {employee_name}"

    reason_clause = _reason_clause(reason)

    # Build the body paragraph(s)
    leave_sentence = (
        f"I would like to formally inform you that I will be on leave from "
        f"<strong>{from_pretty}</strong> to <strong>{to_pretty}</strong> "
        f"({days_label}){reason_clause}."
    )

    if is_cc:
        action_para = (
            "This is for your kind information and records."
        )
    else:
        action_para = (
            "I kindly request your approval for leave on the above-mentioned dates. "
            "Please let me know if any additional information or formalities are "
            "required from my end."
        )

    p = lambda txt: f'<p style="color:#1f2937;font-size:15px;line-height:1.75;margin:0 0 18px">{txt}</p>'

    html = _base(f"""
        <div style="padding:8px 0 24px;font-family:Arial,sans-serif">

          {p(f"Hello {recipient_name},")}

          {p(leave_sentence)}

          {p(action_para)}

          {p("Thank you for your understanding and support.")}

          <p style="color:#1f2937;font-size:15px;line-height:1.75;margin:0 0 4px">
            Yours sincerely,
          </p>
          <p style="color:#111827;font-size:15px;font-weight:700;margin:0 0 4px">{employee_name}</p>
          <p style="color:#6b7280;font-size:13px;margin:0">
            {leave_type}&nbsp;&nbsp;·&nbsp;&nbsp;{days_label}
          </p>
        </div>
    """)
    return subject, html
