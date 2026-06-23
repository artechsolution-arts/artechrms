"""
Central notification service.
All in-app notification creation goes through push() or push_to_role().
Email is optional — reuses existing backend/utils/email.py.
"""
from sqlalchemy.orm import Session
from backend.models.notification import Notification
from backend.models.auth import User


def push(
    db: Session,
    recipient_user_id: int,
    entity_type: str,
    title: str,
    message: str,
    *,
    entity_id: int = None,
    notif_type: str = "info",
    action: str = None,
    priority: str = "medium",
    is_cc: bool = False,
    send_email: bool = False,
    email_html: str = None,
) -> Notification:
    """Create one persistent in-app notification. Optionally fires an email."""
    notif = Notification(
        recipient_user_id=recipient_user_id,
        entity_type=entity_type,
        entity_id=entity_id,
        notif_type=notif_type,
        title=title,
        message=message,
        action=action,
        priority=priority,
        is_cc=is_cc,
    )
    db.add(notif)
    db.flush()

    if send_email and email_html:
        _fire_email(recipient_user_id, title, email_html, db)

    return notif


def push_to_role(
    db: Session,
    roles,
    entity_type: str,
    title: str,
    message: str,
    *,
    exclude_user_id: int = None,
    **kwargs,
) -> list:
    """Push a notification to every active user with the given role(s)."""
    if isinstance(roles, str):
        roles = [roles]
    users = (
        db.query(User)
        .filter(User.role.in_(roles), User.is_active == True)  # noqa: E712
        .all()
    )
    notifs = []
    for user in users:
        if exclude_user_id and user.id == exclude_user_id:
            continue
        n = push(db, user.id, entity_type, title, message, **kwargs)
        notifs.append(n)
    return notifs


def push_many(
    db: Session,
    user_ids: list,
    entity_type: str,
    title: str,
    message: str,
    **kwargs,
) -> list:
    """Push to a specific list of user IDs."""
    return [push(db, uid, entity_type, title, message, **kwargs) for uid in user_ids if uid]


def mark_read(db: Session, notification_id: int, user_id: int) -> bool:
    notif = (
        db.query(Notification)
        .filter(Notification.id == notification_id, Notification.recipient_user_id == user_id)
        .first()
    )
    if notif:
        notif.is_read = True
        db.commit()
        return True
    return False


def mark_all_read(db: Session, user_id: int) -> int:
    count = (
        db.query(Notification)
        .filter(Notification.recipient_user_id == user_id, Notification.is_read == False)  # noqa: E712
        .update({"is_read": True})
    )
    db.commit()
    return count


def get_notifications(
    db: Session,
    user_id: int,
    *,
    unread_only: bool = False,
    entity_type: str = None,
    limit: int = 50,
    offset: int = 0,
) -> list:
    q = db.query(Notification).filter(Notification.recipient_user_id == user_id)
    if unread_only:
        q = q.filter(Notification.is_read == False)  # noqa: E712
    if entity_type:
        q = q.filter(Notification.entity_type == entity_type)
    return q.order_by(Notification.created_at.desc()).offset(offset).limit(limit).all()


def unread_count(db: Session, user_id: int) -> int:
    return (
        db.query(Notification)
        .filter(Notification.recipient_user_id == user_id, Notification.is_read == False)  # noqa: E712
        .count()
    )


def _fire_email(user_id: int, subject: str, html: str, db: Session):
    """Fire-and-forget email to a user. No-op if SMTP not configured."""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.email:
            from backend.utils.email import send_email
            send_email(user.email, subject, html)
    except Exception:
        pass


def fire_leave_request_emails(
    db: Session,
    employee_name: str,
    leave_type: str,
    from_date,
    to_date,
    days: float,
    reason: str,
    requester_role: str = "Employee",
    employee_email: str = "",
):
    """Send leave-request emails based on who applied.

    Employee → TO: all HR users, CC: all CEO users.
    HR       → TO: all CEO users, CC: none.
    employee_email is used as the Graph API sender so the email arrives
    FROM the employee's real address (like sending from Outlook).
    """
    from backend.utils.email import send_email, new_leave_request_email

    hr_users  = db.query(User).filter(User.role == "HR",  User.is_active == True).all()  # noqa: E712
    ceo_users = db.query(User).filter(User.role == "CEO", User.is_active == True).all()  # noqa: E712

    hr_emails  = [u.email for u in hr_users  if u.email]
    ceo_emails = [u.email for u in ceo_users if u.email]

    kwargs = dict(
        employee_name=employee_name,
        leave_type=leave_type,
        from_date=from_date,
        to_date=to_date,
        days=days,
        reason=reason,
    )

    if requester_role == "HR":
        # HR leave → only CEO receives, no CC
        for u in ceo_users:
            if u.email:
                subj, html = new_leave_request_email(
                    recipient_name=u.full_name or u.email,
                    is_cc=False,
                    **kwargs,
                )
                send_email(u.email, subj, html, from_email=employee_email)
    else:
        # Employee leave → HR (TO) + CEO (CC)
        cc_str = ",".join(ceo_emails)
        for u in hr_users:
            if u.email:
                subj, html = new_leave_request_email(
                    recipient_name=u.full_name or u.email,
                    is_cc=False,
                    **kwargs,
                )
                send_email(u.email, subj, html, cc=cc_str, from_email=employee_email)
        # Also send a CC copy directly to CEO users
        for u in ceo_users:
            if u.email:
                subj, html = new_leave_request_email(
                    recipient_name=u.full_name or u.email,
                    is_cc=True,
                    **kwargs,
                )
                send_email(u.email, subj, html, from_email=employee_email)
