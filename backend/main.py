import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.database import engine, Base
import backend.models  # noqa: F401 — registers all models

from backend.routers import employees, leaves, payroll, recruitment, appraisals, dashboard, ai
from backend.routers import auth as auth_router
from backend.routers import portal as portal_router
from backend.routers import hrm as hrm_router
from backend.routers import social as social_router
from backend.routers import admin_panel as admin_router
from backend.auth_utils import decode_token
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
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS lta FLOAT DEFAULT 0",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS other_allowance FLOAT DEFAULT 0",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS pf_applicable INTEGER DEFAULT 1",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS esi_applicable INTEGER DEFAULT 1",
        "ALTER TABLE employees ADD COLUMN IF NOT EXISTS pt_state VARCHAR(50) DEFAULT 'Karnataka'",
        "ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS attachment_url VARCHAR(500)",
        "ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(200)",
        "ALTER TABLE job_openings ADD COLUMN IF NOT EXISTS social_platforms JSONB DEFAULT '[]'::jsonb",
        # Document requests table is created fresh by SQLAlchemy; no column patches needed
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()",
    ]:
        try:
            _conn.execute(text(_stmt))
            _conn.commit()
        except Exception:
            pass

app = FastAPI(title="Artech HRMS", version="1.0.0")

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
    "/api/social/callback/",
)

# Paths accessible by Employee role only
_EMPLOYEE_ALLOWED_PREFIXES = (
    "/api/portal/",
    "/api/hrm/holidays",
    "/api/hrm/announcements",
    "/api/hrm/assets",
    "/api/ai/",
    "/api/auth/",
)

# SuperAdmin-only paths
_SUPERADMIN_ONLY_PREFIXES = ("/api/admin/",)


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    path = request.url.path
    # Only gate /api/* routes, skip public auth endpoints
    if path.startswith("/api/") and not path.startswith(_PUBLIC_PREFIXES):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return JSONResponse({"detail": "Not authenticated"}, status_code=401)
        username = decode_token(auth_header[7:])
        if not username:
            return JSONResponse({"detail": "Invalid or expired token"}, status_code=401)
        request.state.username = username

        # Role-based access: Employee users may only access their own portal paths
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            role = user.role if user else "Employee"
        finally:
            db.close()

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

# Serve uploaded profile photos
UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static", "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Serve React frontend
FRONTEND = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
ASSETS = os.path.join(FRONTEND, "assets")

if os.path.isdir(ASSETS):
    app.mount("/assets", StaticFiles(directory=ASSETS), name="assets")


@app.get("/favicon.svg")
def favicon():
    f = os.path.join(FRONTEND, "favicon.svg")
    return FileResponse(f) if os.path.exists(f) else FileResponse(os.path.join(FRONTEND, "favicon.ico"))


@app.get("/")
def serve_app():
    return FileResponse(os.path.join(FRONTEND, "index.html"))


@app.get("/{path:path}")
def catch_all(path: str):
    full = os.path.join(FRONTEND, path)
    if os.path.isfile(full):
        return FileResponse(full)
    return FileResponse(os.path.join(FRONTEND, "index.html"))
