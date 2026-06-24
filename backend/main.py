import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ── Sentry (error tracking) — only active when SENTRY_DSN is set ─────────────
import sentry_sdk
_SENTRY_DSN = os.getenv("SENTRY_DSN", "")
if _SENTRY_DSN:
    sentry_sdk.init(
        dsn=_SENTRY_DSN,
        traces_sample_rate=0.1,   # capture 10% of transactions for performance
        send_default_pii=False,   # don't send passwords/tokens to Sentry
    )

from fastapi import FastAPI, Request, HTTPException, Response, Depends
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.database import engine, Base, get_db
import backend.models  # noqa: F401 — registers all models

from backend.routers import employees, leaves, payroll, recruitment, appraisals, dashboard, ai
from backend.routers import auth as auth_router
from backend.routers import portal as portal_router
from backend.routers import hrm as hrm_router
from backend.routers import social as social_router
from backend.routers import admin_panel as admin_router
from backend.routers import notifications as notifications_router
from backend.routers import resignations as resignations_router
from backend.routers import notice_period_config as notice_period_config_router
from backend.routers import onboarding as onboarding_router
from backend.routers import biometric as biometric_router
from backend.routers import reports as reports_router
from backend.routers import health as health_router
from backend.routers import approvals as approvals_router
from backend.models import onboarding as _onboarding_models  # ensure tables created
from backend.models import biometric as _biometric_models    # ensure tables created
from backend.routers.reports import Report as _ReportModel  # ensure table created
from backend.auth_utils import decode_token_payload
from backend.database import SessionLocal
from backend.models.auth import User

# Create all tables — wrapped to handle multi-worker race on first boot
try:
    Base.metadata.create_all(bind=engine)
except Exception:
    pass

# Runtime column migrations (add new columns without Alembic)
with engine.connect() as _conn:
    for _stmt in [
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS profile_photo VARCHAR(500)",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS basic_salary FLOAT",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS hra_percent FLOAT DEFAULT 40",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS special_allowance FLOAT DEFAULT 0",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS ca_allowance FLOAT DEFAULT 0",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS lta FLOAT DEFAULT 0",
        "ALTER TABLE payroll_rules ADD COLUMN IF NOT EXISTS pf_enabled BOOLEAN DEFAULT TRUE",
        "ALTER TABLE payroll_rules ADD COLUMN IF NOT EXISTS esi_enabled BOOLEAN DEFAULT TRUE",
        "ALTER TABLE payroll_rules ADD COLUMN IF NOT EXISTS hra_enabled BOOLEAN DEFAULT TRUE",
        "ALTER TABLE payroll_rules ADD COLUMN IF NOT EXISTS use_salary_structure BOOLEAN DEFAULT TRUE",
        "ALTER TABLE payroll_rules ADD COLUMN IF NOT EXISTS basic_pct FLOAT DEFAULT 50.0",
        "ALTER TABLE payroll_rules ADD COLUMN IF NOT EXISTS hra_pct FLOAT DEFAULT 20.0",
        "ALTER TABLE payroll_rules ADD COLUMN IF NOT EXISTS ca_pct FLOAT DEFAULT 12.33",
        "ALTER TABLE payroll_rules ADD COLUMN IF NOT EXISTS others_pct FLOAT DEFAULT 17.67",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS other_allowance FLOAT DEFAULT 0",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS pf_applicable INTEGER DEFAULT 1",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS esi_applicable INTEGER DEFAULT 1",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS pt_state VARCHAR(50) DEFAULT 'Karnataka'",
        "ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500)",
        "ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(200)",
        "ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS social_platforms JSONB DEFAULT '[]'::jsonb",
        # Document requests table is created fresh by SQLAlchemy; no column patches needed
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS self_eval JSONB",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS manager_eval JSONB",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS business_eval JSONB",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS biz_head_eval JSONB",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS self_score FLOAT",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS manager_score FLOAT",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS business_score FLOAT",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS biz_head_score FLOAT",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS hr_eval JSONB",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS hr_score FLOAT",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS ceo_eval JSONB",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS ceo_score FLOAT",
        "ALTER TABLE appraisals ADD COLUMN IF NOT EXISTS perf_documents JSONB DEFAULT '[]'::jsonb",
        "ALTER TABLE appraisals ALTER COLUMN status TYPE VARCHAR(30)",
        # Migrate old status values to new flow
        "UPDATE appraisals SET status = 'Goals Set' WHERE status IN ('Draft')",
        "UPDATE appraisals SET status = 'Self Evaluated' WHERE status = 'Submitted'",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(20)",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(100)",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS aadhar_no VARCHAR(20)",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS pan_no VARCHAR(20)",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(30)",
        "ALTER TABLE work_mode_entries ADD COLUMN IF NOT EXISTS leave_id INTEGER REFERENCES leave_applications(id) ON DELETE SET NULL",
        "ALTER TABLE leave_applications ADD COLUMN IF NOT EXISTS leave_category VARCHAR(20) DEFAULT 'Planned'",
        "ALTER TABLE leave_applications ADD COLUMN IF NOT EXISTS cancellation_reason TEXT",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS logo_x_mm FLOAT DEFAULT 16.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS logo_y_mm FLOAT DEFAULT 10.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS logo_w_mm FLOAT DEFAULT 32.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS logo_h_mm FLOAT DEFAULT 32.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS footer_image_filename VARCHAR",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS signature_filename VARCHAR",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS sig_x_mm FLOAT DEFAULT 18.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS sig_w_mm FLOAT DEFAULT 40.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS sig_h_mm FLOAT DEFAULT 20.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS footer_x_mm FLOAT DEFAULT 0.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS footer_y_mm FLOAT DEFAULT 0.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS footer_w_mm FLOAT DEFAULT 210.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS footer_h_mm FLOAT DEFAULT 62.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS content_top_mm FLOAT DEFAULT 58.92",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS body_font VARCHAR(50) DEFAULT 'Source Sans 3'",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS body_font_size FLOAT DEFAULT 10.5",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS body_bold BOOLEAN DEFAULT FALSE",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS body_italic BOOLEAN DEFAULT FALSE",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS watermark_filename VARCHAR",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS watermark_opacity FLOAT DEFAULT 0.08",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS watermark_x_mm FLOAT DEFAULT 45.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS watermark_y_mm FLOAT DEFAULT 88.5",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS watermark_w_mm FLOAT DEFAULT 120.0",
        "ALTER TABLE letterhead_template ADD COLUMN IF NOT EXISTS watermark_h_mm FLOAT DEFAULT 120.0",
        "ALTER TABLE leave_applications ALTER COLUMN status TYPE VARCHAR(30)",
        "ALTER TABLE leave_policies ADD COLUMN IF NOT EXISTS cf_joined_h1 FLOAT DEFAULT 0",
        "ALTER TABLE leave_policies ADD COLUMN IF NOT EXISTS cf_joined_h2 FLOAT DEFAULT 0",
        # Consolidate roles: Admin → HR, HR User → HR, Manager → HR
        "UPDATE users SET role = 'HR' WHERE role IN ('Admin', 'HR User', 'Manager')",
        """CREATE TABLE IF NOT EXISTS leave_accrual_log (
            id SERIAL PRIMARY KEY,
            year_month VARCHAR(7) NOT NULL UNIQUE,
            run_at TIMESTAMP DEFAULT NOW(),
            employees_credited INTEGER DEFAULT 0
        )""",
        """CREATE TABLE IF NOT EXISTS hr_reminder_log (
            id SERIAL PRIMARY KEY,
            reminder_key VARCHAR(200) NOT NULL UNIQUE,
            sent_at TIMESTAMP DEFAULT NOW()
        )""",
        """CREATE TABLE IF NOT EXISTS edit_requests (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER NOT NULL REFERENCES employees(id),
            request_type VARCHAR(50) NOT NULL,
            target_date DATE NOT NULL,
            description TEXT NOT NULL,
            reason TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'Pending',
            hr_remarks TEXT,
            created_at TIMESTAMP DEFAULT NOW(),
            resolved_at TIMESTAMP,
            resolved_by INTEGER REFERENCES users(id)
        )""",
        # Readable view for status sheet — easy to query per employee/month in DB tools
        """
        CREATE OR REPLACE VIEW v_status_sheet AS
        SELECT
            se.id,
            e.employee_id               AS emp_code,
            e.full_name                 AS employee_name,
            d.name                      AS department,
            ds.name                     AS designation,
            TO_CHAR(se.entry_date, 'YYYY-MM') AS month,
            se.task_id,
            se.entry_date,
            se.task_name,
            se.due_date,
            se.status,
            se.percent_complete,
            se.updated_at
        FROM status_entries se
        JOIN employees e  ON e.id  = se.employee_id
        LEFT JOIN departments  d  ON d.id  = e.department_id
        LEFT JOIN designations ds ON ds.id = e.designation_id
        ORDER BY e.full_name, se.entry_date
        """,
        # Remove duplicate attendance rows before adding the unique constraint.
        # Keep the row with the most complete data (highest working_hours) per
        # employee+date; break ties by lowest id.
        """
        DELETE FROM attendance
        WHERE id NOT IN (
            SELECT DISTINCT ON (employee_id, date) id
            FROM attendance
            ORDER BY employee_id, date, working_hours DESC NULLS LAST, id ASC
        )
        """,
        # Enforce one row per employee per calendar day — prevents future duplicates
        # from concurrent sync runs.
        """
        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint WHERE conname = 'uq_attendance_emp_date'
            ) THEN
                ALTER TABLE attendance ADD CONSTRAINT uq_attendance_emp_date UNIQUE (employee_id, date);
            END IF;
        END $$
        """,
        # ── Performance indexes (safe to re-run with IF NOT EXISTS) ──────────
        "CREATE INDEX IF NOT EXISTS idx_leave_emp     ON leave_applications(employee_id)",
        "CREATE INDEX IF NOT EXISTS idx_leave_status  ON leave_applications(status)",
        "CREATE INDEX IF NOT EXISTS idx_leave_dates   ON leave_applications(from_date, to_date)",
        "CREATE INDEX IF NOT EXISTS idx_att_emp_date  ON attendance(employee_id, date)",
        "CREATE INDEX IF NOT EXISTS idx_att_status    ON attendance(status)",
        "CREATE INDEX IF NOT EXISTS idx_emp_status    ON employees(status)",
        "CREATE INDEX IF NOT EXISTS idx_emp_dept      ON employees(department_id)",
        "CREATE INDEX IF NOT EXISTS idx_expense_emp   ON expense_claims(employee_id)",
        "CREATE INDEX IF NOT EXISTS idx_expense_stat  ON expense_claims(status)",
        "CREATE INDEX IF NOT EXISTS idx_doc_emp       ON document_requests(employee_id)",
        "CREATE INDEX IF NOT EXISTS idx_doc_status    ON document_requests(status)",
        "CREATE INDEX IF NOT EXISTS idx_users_uname   ON users(username)",
        "CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email)",
        # ── Notification + Approval tables (safe with IF NOT EXISTS) ─────────
        """CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            recipient_user_id INTEGER NOT NULL,
            entity_type VARCHAR(50) NOT NULL,
            entity_id INTEGER,
            notif_type VARCHAR(30) NOT NULL DEFAULT 'info',
            title VARCHAR(300) NOT NULL,
            message TEXT NOT NULL,
            action VARCHAR(100),
            priority VARCHAR(10) DEFAULT 'medium',
            is_read BOOLEAN DEFAULT FALSE,
            is_cc BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS idx_notif_user    ON notifications(recipient_user_id)",
        "CREATE INDEX IF NOT EXISTS idx_notif_read    ON notifications(recipient_user_id, is_read)",
        "CREATE INDEX IF NOT EXISTS idx_notif_type    ON notifications(entity_type)",
        """CREATE TABLE IF NOT EXISTS approval_workflows (
            id SERIAL PRIMARY KEY,
            module VARCHAR(50) UNIQUE NOT NULL,
            levels JSONB NOT NULL,
            cc_roles JSONB DEFAULT '[]'::jsonb,
            is_active BOOLEAN DEFAULT TRUE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )""",
        """CREATE TABLE IF NOT EXISTS approval_requests (
            id SERIAL PRIMARY KEY,
            module VARCHAR(50) NOT NULL,
            entity_id INTEGER,
            requested_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            current_level INTEGER DEFAULT 1,
            status VARCHAR(20) DEFAULT 'pending',
            payload JSONB,
            remarks TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS idx_apprv_module  ON approval_requests(module)",
        "CREATE INDEX IF NOT EXISTS idx_apprv_status  ON approval_requests(status)",
        """CREATE TABLE IF NOT EXISTS approval_steps (
            id SERIAL PRIMARY KEY,
            approval_request_id INTEGER NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
            level INTEGER NOT NULL,
            approver_role VARCHAR(50) NOT NULL,
            approver_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            status VARCHAR(20) DEFAULT 'pending',
            remarks TEXT,
            actioned_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS idx_step_req      ON approval_steps(approval_request_id)",
        "CREATE INDEX IF NOT EXISTS idx_step_role     ON approval_steps(approver_role, status)",
        # OAuth CSRF state tokens — survive container restarts, auto-expire after 10 min
        """CREATE TABLE IF NOT EXISTS oauth_states (
            state      VARCHAR(100) PRIMARY KEY,
            platform   VARCHAR(50)  NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )""",
        "CREATE INDEX IF NOT EXISTS idx_oauth_created ON oauth_states(created_at)",
        # Company documents — metadata tracked alongside R2 objects
        """CREATE TABLE IF NOT EXISTS company_documents (
            id          SERIAL PRIMARY KEY,
            name        VARCHAR(255) NOT NULL UNIQUE,
            r2_key      VARCHAR(500) NOT NULL,
            uploaded_by VARCHAR(100),
            uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )""",
        # Deletion audit log — who deleted what and when
        """CREATE TABLE IF NOT EXISTS deletion_log (
            id           SERIAL PRIMARY KEY,
            entity_type  VARCHAR(100) NOT NULL,
            entity_name  TEXT         NOT NULL,
            deleted_by   VARCHAR(100),
            deleted_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            extra        JSONB
        )""",
        "CREATE INDEX IF NOT EXISTS idx_del_log_type ON deletion_log(entity_type, deleted_at DESC)",
    ]:
        try:
            _conn.execute(text(_stmt))
            _conn.commit()
        except Exception:
            pass

from backend.leave_accrual import start_accrual_scheduler, _run_accrual
start_accrual_scheduler()

from backend.work_hours_scheduler import start_work_hours_scheduler
start_work_hours_scheduler()

from backend.hr_reminders import start_reminder_scheduler
start_reminder_scheduler()

# Seed default approval workflow configs
from backend.database import SessionLocal as _SL
_seed_db = _SL()
try:
    from backend.services.approval_service import seed_workflows
    seed_workflows(_seed_db)
except Exception:
    pass
finally:
    _seed_db.close()

app = FastAPI(title="Artech HRMS", version="1.0.0")

# Rate limiter: 10 login attempts per minute per IP
_limiter = Limiter(key_func=get_remote_address, default_limits=["10/minute"])
app.state.limiter = _limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.on_event("startup")
def _start_biometric_sync():
    """Begin automatic biometric attendance sync (no-op if no device configured)."""
    try:
        from backend.biometric_scheduler import start_scheduler
        start_scheduler()
    except Exception:
        pass

ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:8000,http://127.0.0.1:8000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths that don't require a token
_PUBLIC_PREFIXES = (
    "/api/auth/login", "/api/auth/setup", "/api/auth/needs-setup",
    "/api/auth/microsoft",        # Microsoft SSO OAuth flow
    "/api/social/callback/",
    "/api/notifications/stream",  # SSE: auth handled inside via ?token= query param
    "/api/biometric/iclock",      # ZKTeco ADMS push — device has no Bearer token
    "/api/biometric/adms-status", # connectivity check — no sensitive data
    "/api/biometric/bulk-import", # secret-gated historical import
    "/iclock",                    # ZKTeco firmware hardcodes /iclock/ (no custom prefix)
    "/health",                    # uptime monitoring / load balancer
)

# Paths accessible by Employee role only
_EMPLOYEE_ALLOWED_PREFIXES = (
    "/api/portal/",
    "/api/auth/change-password",
    "/api/hrm/holidays",
    "/api/hrm/announcements",
    "/api/hrm/assets",
    "/api/hrm/letters/download",
    "/api/ai/",
    "/api/auth/",
    "/api/notifications",
    "/api/approvals/history",   # employees can view outcomes of their own requests
)

# SuperAdmin-only paths
_SUPERADMIN_ONLY_PREFIXES = ("/api/admin/",)


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["X-Content-Type-Options"]    = "nosniff"
    response.headers["X-Frame-Options"]           = "SAMEORIGIN"
    response.headers["Referrer-Policy"]           = "strict-origin-when-cross-origin"
    return response


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    # Only gate /api/* routes, skip public auth endpoints
    if path.startswith("/api/") and not path.startswith(_PUBLIC_PREFIXES):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse({"detail": "Not authenticated"}, status_code=401)

        payload = decode_token_payload(auth_header[7:])
        if not payload or not payload.get("sub"):
            return JSONResponse({"detail": "Invalid or expired token"}, status_code=401)

        username = payload["sub"]
        # Role is embedded in JWT — no DB query needed on every request.
        # Fall back to DB only for old tokens that predate the role claim.
        role = payload.get("role") or ""
        if not role:
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.username == username).first()
                role = user.role if user else "Employee"
            finally:
                db.close()

        request.state.username = username
        request.state.user_role = role

        # SuperAdmin can access everything
        if role == "SuperAdmin":
            pass
        # Employee restricted to portal + shared paths
        elif role == "Employee" and not any(path.startswith(p) for p in _EMPLOYEE_ALLOWED_PREFIXES):
            return JSONResponse({"detail": "Forbidden"}, status_code=403)
        # Non-SuperAdmin blocked from admin panel
        elif role != "SuperAdmin" and any(path.startswith(p) for p in _SUPERADMIN_ONLY_PREFIXES):
            return JSONResponse({"detail": "SuperAdmin access required"}, status_code=403)

    return await call_next(request)


# API routers
app.include_router(auth_router.router)
app.include_router(portal_router.router)
app.include_router(employees.router)
app.include_router(leaves.router)
app.include_router(payroll.router)
app.include_router(recruitment.router)
app.include_router(appraisals.router)
app.include_router(dashboard.router)
app.include_router(ai.router)
app.include_router(hrm_router.router)
app.include_router(social_router.router)
app.include_router(admin_router.router)
app.include_router(notifications_router.router)
app.include_router(resignations_router.router)
app.include_router(onboarding_router.router)
app.include_router(notice_period_config_router.router)
app.include_router(biometric_router.router)
app.include_router(reports_router.router)

# ── ZKTeco ADMS root-level paths ─────────────────────────────────────────────
# ZKTeco firmware hardcodes /iclock/ and ignores any path prefix you configure.
# These thin wrappers forward to the real handlers in biometric_router.
@app.get("/iclock/getrequest")
@app.get("/iclock/getrequest/{rest:path}")
@app.get("/iclock/getrequest.aspx")
@app.get("/iclock/getrequest.aspx/{rest:path}")
async def iclock_getrequest_root(request: Request):
    return await biometric_router.adms_getrequest(request)

@app.post("/iclock/cdata")
@app.post("/iclock/cdata.aspx")
async def iclock_cdata_root(request: Request, db=Depends(get_db)):
    return await biometric_router.adms_cdata(request, db)

@app.get("/iclock/cdata.aspx")
async def iclock_cdata_aspx_get(request: Request):
    return Response(content="OK\r\n", media_type="text/plain")
app.include_router(health_router.router)
app.include_router(approvals_router.router)

# Serve uploaded profile photos
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Serve React frontend
FRONTEND = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
ASSETS = os.path.join(FRONTEND, "assets")

if os.path.isdir(ASSETS):
    # Hashed filenames are immutable — safe to cache for 1 year
    from starlette.staticfiles import StaticFiles as _SF
    from starlette.responses import Response as _SR

    class _ImmutableStatic(_SF):
        async def __call__(self, scope, receive, send):
            async def send_with_cache(message):
                if message["type"] == "http.response.start":
                    headers = dict(message.get("headers", []))
                    headers[b"cache-control"] = b"public, max-age=31536000, immutable"
                    message = {**message, "headers": list(headers.items())}
                await send(message)
            await super().__call__(scope, receive, send_with_cache)

    app.mount("/assets", _ImmutableStatic(directory=ASSETS), name="assets")


@app.get("/files/{path:path}")
def serve_file(path: str):
    """Proxy R2 (or local fallback) files through the app server."""
    from backend.storage import download_file, _CONTENT_TYPES
    ext = path.rsplit(".", 1)[-1].lower() if "." in path else ""
    content_type = _CONTENT_TYPES.get(ext, "application/octet-stream")
    try:
        data = download_file(path)
        return Response(content=data, media_type=content_type,
                        headers={"Cache-Control": "max-age=3600"})
    except Exception:
        raise HTTPException(404, "File not found")


@app.get("/favicon.svg")
def favicon():
    f = os.path.join(FRONTEND, "favicon.svg")
    return FileResponse(f) if os.path.exists(f) else FileResponse(os.path.join(FRONTEND, "favicon.ico"))


_NO_CACHE = {"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache"}


@app.get("/")
def serve_app():
    return FileResponse(os.path.join(FRONTEND, "index.html"), headers=_NO_CACHE)


@app.get("/{path:path}")
def catch_all(path: str):
    full = os.path.join(FRONTEND, path)
    if os.path.isfile(full):
        return FileResponse(full)
    return FileResponse(os.path.join(FRONTEND, "index.html"), headers=_NO_CACHE)
