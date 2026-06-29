"""
Fire-and-forget email utility.

Preferred: Microsoft Graph API — emails arrive FROM the real sender's address,
           exactly like sending from Outlook.
Fallback:  SMTP (office365 / Gmail) — used when Graph creds are not set.

Graph env vars (set all three to enable):
  MS_CLIENT_ID      Azure AD app client ID
  MS_CLIENT_SECRET  Azure AD app client secret
  MS_TENANT_ID      Azure AD directory (tenant) ID
  (App must have Mail.Send *application* permission with admin consent)

SMTP env vars (fallback):
  SMTP_HOST      e.g. smtp.office365.com
  SMTP_PORT      default 587 (STARTTLS)
  SMTP_USER      sender@yourdomain.com
  SMTP_PASSWORD  account password or app password
  SMTP_FROM      optional display name override
"""

import os
import time
import threading
import smtplib
import logging
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from concurrent.futures import ThreadPoolExecutor

log = logging.getLogger(__name__)

# ── Microsoft Graph ───────────────────────────────────────────────────────────
MS_CLIENT_ID     = os.getenv("MS_CLIENT_ID", "")
MS_CLIENT_SECRET = os.getenv("MS_CLIENT_SECRET", "")
MS_TENANT_ID     = os.getenv("MS_TENANT_ID", "")
# Fixed sender mailbox that the Azure app is authorised to send from.
# If set, ALL outgoing mails use this address (shared/service mailbox).
# This is the recommended pattern for Mail.Send application permission.
MS_SENDER_EMAIL  = os.getenv("MS_SENDER_EMAIL", "")

_token_cache = {"token": "", "expires_at": 0.0}
_token_lock  = threading.Lock()


def _get_graph_token() -> str:
    with _token_lock:
        if time.time() < _token_cache["expires_at"] - 60:
            return _token_cache["token"]
        import httpx
        resp = httpx.post(
            f"https://login.microsoftonline.com/{MS_TENANT_ID}/oauth2/v2.0/token",
            data={
                "client_id":     MS_CLIENT_ID,
                "client_secret": MS_CLIENT_SECRET,
                "scope":         "https://graph.microsoft.com/.default",
                "grant_type":    "client_credentials",
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        _token_cache["token"]      = data["access_token"]
        _token_cache["expires_at"] = time.time() + float(data.get("expires_in", 3600))
        return _token_cache["token"]


def _send_graph(from_email: str, to: str, subject: str, html: str,
                cc: str = "", attachments: list | None = None) -> None:
    """Send via Microsoft Graph API — FROM is the real sender's address."""
    try:
        import httpx
        token    = _get_graph_token()
        to_list  = [{"emailAddress": {"address": a.strip()}} for a in to.split(",")  if a.strip()]
        cc_list  = [{"emailAddress": {"address": a.strip()}} for a in cc.split(",")  if a.strip()] if cc else []
        att_list = []
        for fname, data, ctype in (attachments or []):
            att_list.append({
                "@odata.type":  "#microsoft.graph.fileAttachment",
                "name":         fname,
                "contentType":  ctype,
                "contentBytes": base64.b64encode(data).decode(),
            })
        payload  = {
            "message": {
                "subject":      subject,
                "body":         {"contentType": "HTML", "content": html},
                "toRecipients": to_list,
                "ccRecipients": cc_list,
                "attachments":  att_list,
            },
            "saveToSentItems": True,
        }
        resp = httpx.post(
            f"https://graph.microsoft.com/v1.0/users/{from_email}/sendMail",
            json=payload,
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        if not resp.is_success:
            log.error("Graph sendMail failed [%s → %s]: %s %s",
                      from_email, to, resp.status_code, resp.text[:300])
    except Exception as exc:
        log.error("Graph email from %s to %s failed: %s", from_email, to, exc)


# ── SMTP fallback ─────────────────────────────────────────────────────────────
SMTP_HOST     = os.getenv("SMTP_HOST", "")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM     = os.getenv("SMTP_FROM", SMTP_USER)

_pool = ThreadPoolExecutor(max_workers=2, thread_name_prefix="email")


def _send_smtp(to: str, subject: str, html: str, cc: str = "",
               from_email: str = "", attachments: list | None = None) -> None:
    try:
        sender = from_email or SMTP_FROM or SMTP_USER
        msg = MIMEMultipart("mixed")
        msg["Subject"] = subject
        msg["From"]    = sender
        msg["To"]      = to
        if cc:
            msg["Cc"] = cc
        msg.attach(MIMEText(html, "html", "utf-8"))
        for fname, data, ctype in (attachments or []):
            main_type, sub_type = ctype.split("/", 1)
            part = MIMEBase(main_type, sub_type)
            part.set_payload(data)
            encoders.encode_base64(part)
            part.add_header("Content-Disposition", f'attachment; filename="{fname}"')
            msg.attach(part)
        all_recipients = [r.strip() for r in (to + ("," + cc if cc else "")).split(",") if r.strip()]
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.sendmail(sender, all_recipients, msg.as_string())
    except Exception as exc:
        log.error("SMTP email to %s (cc %s) failed: %s", to, cc, exc)


# ── Public API ────────────────────────────────────────────────────────────────

def send_email(to: str, subject: str, html: str, cc: str = "",
               from_email: str = "",
               attachments: list | None = None) -> None:
    """Queue an email on a background thread. Returns immediately.

    attachments — list of (filename, bytes_data, mime_type) tuples,
                  e.g. [("Letter.pdf", pdf_bytes, "application/pdf")]
    from_email  — the sender's real Microsoft 365 address (Graph) or
                  overrides SMTP_FROM. Falls back to SMTP_USER if not set.
    """
    if not to:
        return
    if MS_CLIENT_ID and MS_CLIENT_SECRET and MS_TENANT_ID:
        # MS_SENDER_EMAIL (dedicated mailbox) takes priority — avoids 403 when
        # the app only has permission for one authorised sender address.
        # Falls back to from_email, then SMTP_USER.
        sender = MS_SENDER_EMAIL or from_email or SMTP_USER
        if sender:
            _pool.submit(_send_graph, sender, to, subject, html, cc, attachments)
            return
    if not SMTP_HOST or not SMTP_USER:
        return
    _pool.submit(_send_smtp, to, subject, html, cc, from_email, attachments)


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
    """Letter-style approval / rejection notification to the employee."""
    from_pretty = _pretty_date(from_date)
    to_pretty   = _pretty_date(to_date)
    days_int    = int(days) if days == int(days) else days
    days_label  = f"{days_int} day{'s' if days_int != 1 else ''}"

    approved = status == "Approved"
    subject  = (
        f"Leave Approved: {from_pretty} – {to_pretty}"
        if approved else
        f"Leave Rejected: {from_pretty} – {to_pretty}"
    )

    if approved:
        opening = (
            f"I am pleased to inform you that your leave request from "
            f"<strong>{from_pretty}</strong> to <strong>{to_pretty}</strong> "
            f"({days_label}) has been <strong style='color:#16a34a'>approved</strong>."
        )
        closing_para = (
            "Please ensure all pending work is handed over before your leave begins. "
            "We wish you a pleasant time off."
        )
    else:
        opening = (
            f"We regret to inform you that your leave request from "
            f"<strong>{from_pretty}</strong> to <strong>{to_pretty}</strong> "
            f"({days_label}) has been <strong style='color:#dc2626'>rejected</strong>."
        )
        closing_para = (
            "If you have any concerns or would like to discuss this further, "
            "please reach out to HR at the earliest."
        )

    remarks_para = (
        f'<p style="color:#1f2937;font-size:15px;line-height:1.75;margin:0 0 18px">'
        f'<strong>Remarks:</strong> {remarks.strip()}</p>'
        if (remarks or "").strip() else ""
    )

    p = lambda txt: f'<p style="color:#1f2937;font-size:15px;line-height:1.75;margin:0 0 18px">{txt}</p>'

    html = _base(f"""
        <div style="padding:8px 0 24px;font-family:Arial,sans-serif">

          {p(f"Hello {employee_name},")}

          {p(opening)}

          {remarks_para}

          {p(closing_para)}

          {p("Thank you for your understanding and support.")}

          <p style="color:#1f2937;font-size:15px;line-height:1.75;margin:0 0 4px">
            Yours sincerely,
          </p>
          <p style="color:#111827;font-size:15px;font-weight:700;margin:0 0 4px">HR Team</p>
          <p style="color:#6b7280;font-size:13px;margin:0">
            {leave_type}&nbsp;&nbsp;·&nbsp;&nbsp;{days_label}
          </p>
        </div>
    """)
    return subject, html


# ── Resignation emails ────────────────────────────────────────────────────────

def new_resignation_email(recipient_name: str, employee_name: str,
                           last_working_date, reason: str = "",
                           is_cc: bool = False) -> tuple:
    """Letter-style resignation notice sent from employee to HR (and CC CEO)."""
    lwd_pretty = _pretty_date(last_working_date)
    subject = f"Resignation Notice — {employee_name} (Last Working Day: {lwd_pretty})"
    if is_cc:
        subject = f"[CC] {subject}"

    reason_sentence = ""
    if (reason or "").strip():
        r = reason.strip()
        if r.lower().startswith("i "):
            reason_sentence = f" {r[0].upper()}{r[1:]}{'.' if not r.endswith('.') else ''}"
        else:
            reason_sentence = f" The reason for my decision is {r[0].lower()}{r[1:]}{'.' if not r.endswith('.') else ''}"

    approval_line = (
        "Please treat this as my formal notice. I kindly request you to acknowledge this resignation and initiate the necessary exit formalities."
        if not is_cc else
        "This is for your kind information and records."
    )

    p = lambda txt: f'<p style="color:#1f2937;font-size:15px;line-height:1.75;margin:0 0 18px">{txt}</p>'
    html = _base(f"""
        <div style="padding:8px 0 24px;font-family:Arial,sans-serif">
          {p(f"Hello {recipient_name},")}
          {p(f"I would like to formally inform you that I am submitting my resignation from Artech Solutions, "
             f"with my last working day being <strong>{lwd_pretty}</strong>.{reason_sentence}")}
          {p("I remain fully committed to completing all pending responsibilities and ensuring a smooth and complete handover before my departure.")}
          {p(approval_line)}
          {p("Thank you for the opportunity and support during my time at Artech.")}
          <p style="color:#1f2937;font-size:15px;line-height:1.75;margin:0 0 4px">Yours sincerely,</p>
          <p style="color:#111827;font-size:15px;font-weight:700;margin:0 0 4px">{employee_name}</p>
          <p style="color:#6b7280;font-size:13px;margin:0">Resignation Notice&nbsp;&nbsp;·&nbsp;&nbsp;Last Working Day: {lwd_pretty}</p>
        </div>
    """)
    return subject, html


def resignation_status_email(employee_name: str, status: str,
                              last_working_date=None,
                              approved_last_working_date=None,
                              hr_remarks: str = "") -> tuple:
    """Letter-style approval / rejection of resignation sent to employee."""
    approved = status == "Approved"

    if approved:
        lwd = approved_last_working_date or last_working_date
        lwd_pretty = _pretty_date(lwd) if lwd else "as agreed"
        subject = f"Resignation Accepted — Last Working Day: {lwd_pretty}"
        opening = (
            f"We acknowledge receipt of your resignation and wish to formally confirm that it has been "
            f"<strong style='color:#16a34a'>accepted</strong>. "
            f"Your last working day has been confirmed as <strong>{lwd_pretty}</strong>."
        )
        closing = (
            "We request you to complete all handover formalities and clear pending tasks before your last day. "
            "HR will reach out to you shortly regarding the exit process."
        )
    else:
        subject = "Resignation Not Accepted — Please Connect with HR"
        opening = (
            "We have reviewed your resignation request and regret to inform you that it has been "
            f"<strong style='color:#dc2626'>not accepted</strong> at this time."
        )
        closing = "We encourage you to speak with HR at the earliest to discuss the matter further."

    remarks_para = (
        f'<p style="color:#1f2937;font-size:15px;line-height:1.75;margin:0 0 18px">'
        f'<strong>Remarks from HR:</strong> {hr_remarks.strip()}</p>'
        if (hr_remarks or "").strip() else ""
    )

    p = lambda txt: f'<p style="color:#1f2937;font-size:15px;line-height:1.75;margin:0 0 18px">{txt}</p>'
    html = _base(f"""
        <div style="padding:8px 0 24px;font-family:Arial,sans-serif">
          {p(f"Hello {employee_name},")}
          {p(opening)}
          {remarks_para}
          {p(closing)}
          {p("We wish you all the best in your future endeavours." if approved else "Thank you for your understanding.")}
          <p style="color:#1f2937;font-size:15px;line-height:1.75;margin:0 0 4px">Yours sincerely,</p>
          <p style="color:#111827;font-size:15px;font-weight:700;margin:0 0 4px">HR Team</p>
          <p style="color:#6b7280;font-size:13px;margin:0">Artech HRMS</p>
        </div>
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


def document_ready_email(
    recipient_name: str,
    letter_type: str,
    company_name: str = "AR Tech Solutions",
) -> tuple[str, str]:
    """MNC-grade professional email delivering a generated letter as an attachment."""
    from datetime import date as _date
    today = _date.today()
    months = ["January","February","March","April","May","June",
              "July","August","September","October","November","December"]
    date_str = f"{today.day} {months[today.month - 1]}, {today.year}"
    ref = f"HR/DOC/{today.year}/{today.month:02d}{today.day:02d}"

    subject = f"Issuance of {letter_type} — {recipient_name} | {company_name}"

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background-color:#f0f2f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.10);">

        <!-- ── Header Band ── -->
        <tr>
          <td style="background:#0f2044;padding:0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:28px 36px 24px;">
                  <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">{company_name}</p>
                  <p style="margin:6px 0 0;font-size:11px;font-weight:400;color:#93afd4;letter-spacing:1.8px;text-transform:uppercase;">Human Resources Department</p>
                </td>
                <td align="right" style="padding:28px 36px 24px;vertical-align:middle;">
                  <p style="margin:0;font-size:10px;color:#6b8ab5;letter-spacing:0.5px;">OFFICIAL CORRESPONDENCE</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Gold Rule ── -->
        <tr><td style="background:#c8a456;height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- ── Ref & Date Bar ── -->
        <tr>
          <td style="background:#f7f9fc;padding:12px 36px;border-bottom:1px solid #e4e9f0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:11px;color:#64748b;">
                  <span style="font-weight:600;color:#374151;">Ref No.:</span>&nbsp;{ref}
                </td>
                <td align="right" style="font-size:11px;color:#64748b;">
                  <span style="font-weight:600;color:#374151;">Date:</span>&nbsp;{date_str}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Body ── -->
        <tr>
          <td style="padding:36px 36px 28px;">

            <!-- Subject Line -->
            <p style="margin:0 0 24px;font-size:13px;color:#374151;">
              <span style="font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">Subject:</span>&nbsp;
              Issuance of {letter_type}
            </p>

            <!-- Salutation -->
            <p style="margin:0 0 20px;font-size:15px;color:#1e293b;line-height:1.7;">
              Dear <strong>{recipient_name}</strong>,
            </p>

            <!-- Opening -->
            <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.8;">
              We are pleased to issue your <strong>{letter_type}</strong> as requested. Please find the
              official document attached to this communication for your records and reference.
            </p>

            <!-- Details box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-radius:4px;overflow:hidden;border:1px solid #dde3ed;">
              <tr>
                <td style="background:#f1f5fb;padding:10px 18px;border-bottom:1px solid #dde3ed;">
                  <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;letter-spacing:1.2px;text-transform:uppercase;">Document Details</p>
                </td>
              </tr>
              <tr>
                <td style="padding:14px 18px;">
                  <table width="100%" cellpadding="4" cellspacing="0" style="font-size:13px;color:#374151;">
                    <tr>
                      <td style="width:38%;color:#64748b;font-weight:600;">Document Type</td>
                      <td style="color:#1e293b;">{letter_type}</td>
                    </tr>
                    <tr>
                      <td style="color:#64748b;font-weight:600;">Issued To</td>
                      <td style="color:#1e293b;">{recipient_name}</td>
                    </tr>
                    <tr>
                      <td style="color:#64748b;font-weight:600;">Issued By</td>
                      <td style="color:#1e293b;">{company_name} — HR Department</td>
                    </tr>
                    <tr>
                      <td style="color:#64748b;font-weight:600;">Date of Issue</td>
                      <td style="color:#1e293b;">{date_str}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- Body paragraphs -->
            <p style="margin:0 0 18px;font-size:15px;color:#374151;line-height:1.8;">
              Kindly review the attached document and retain it for your personal records.
              Should you have any queries or require any corrections, please do not hesitate
              to contact the Human Resources Department at your earliest convenience.
            </p>

            <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.8;">
              We wish you continued success and look forward to your valuable contributions
              to the organisation.
            </p>

            <!-- Signature block -->
            <p style="margin:0 0 4px;font-size:14px;color:#374151;line-height:1.6;">Yours sincerely,</p>
            <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0f2044;">HR Department</p>
            <p style="margin:0 0 2px;font-size:13px;color:#374151;">{company_name}</p>
            <p style="margin:16px 0 0;display:inline-block;padding:4px 0;font-size:12px;color:#c8a456;border-top:2px solid #c8a456;letter-spacing:0.4px;">
              This document has been digitally processed and issued via the HRMS portal.
            </p>
          </td>
        </tr>

        <!-- ── Divider ── -->
        <tr><td style="padding:0 36px;"><hr style="border:none;border-top:1px solid #e4e9f0;margin:0;"/></td></tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="padding:20px 36px 28px;background:#f7f9fc;">
            <p style="margin:0 0 6px;font-size:11px;color:#94a3b8;line-height:1.7;">
              <strong style="color:#64748b;">CONFIDENTIALITY NOTICE:</strong>&nbsp;
              This email and any attachments are intended solely for the named recipient and may contain
              confidential and/or legally privileged information. If you have received this email in error,
              please notify the sender immediately and delete this message from your system.
            </p>
            <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;">
              © {today.year} {company_name}. All rights reserved.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""

    return subject, html


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
