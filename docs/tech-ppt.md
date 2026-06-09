# Artech HRMS — Technical Presentation

> Architecture, stack, data model, security & deployment for engineers.

---

## Slide 1 — Title & Stack

# Artech HRMS — Engineering Overview
### Full-stack, role-based HR platform

**Backend**

![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![SQLAlchemy](https://img.shields.io/badge/SQLAlchemy-D71F00?style=for-the-badge&logo=sqlalchemy&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![MinIO](https://img.shields.io/badge/MinIO-C72E49?style=for-the-badge&logo=minio&logoColor=white)

**Frontend**

![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Ops** ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## Slide 2 — Architecture

```
┌───────────────────────────── Browser (SPA) ──────────────────────────────┐
│        React 18 + Vite + Tailwind  ·  Chart.js  ·  lucide-react           │
└───────────────────────────────┬──────────────────────────────────────────┘
                                 │ HTTPS / JSON  (Bearer JWT)
┌───────────────────────────────▼──────────────────────────────────────────┐
│                          FastAPI application                               │
│   Auth middleware (JWT) → RBAC guard → Routers → SQLAlchemy ORM            │
│   Also serves the built React SPA as static files at  /                   │
└───────────────┬─────────────────────────────────────┬────────────────────┘
                │                                       │ S3 API
┌───────────────▼─────────────┐               ┌─────────▼─────────────────────┐
│  PostgreSQL  (relational)   │               │  MinIO  (object storage)      │
│  employees, payroll, leave… │               │  photos, signed docs, files   │
└─────────────────────────────┘               └───────────────────────────────┘
            Containerised & shipped via Docker  (container: artechrms_app)
```

- **Stateless API** (JWT, no sessions) → scales horizontally.
- FastAPI serves **both** the API and the SPA from one image.

---

## Slide 3 — Data Model & Modules

```
User ──1:1── Employee ──N:1── Department / Designation / Manager(self)
                 ├──< LeaveApplication >── LeaveType      (+ LeaveBalance)
                 ├──< Attendance / WorkModeEntry
                 ├──< SalarySlip >── PayrollEntry
                 ├──< Appraisal (goals, evals, perf_documents)
                 ├──< Resignation · EditRequest · DocumentRequest
                 └──< Onboarding / Offboarding Checklist
RolePermission (role → allowed_features[])   ·   PayrollRules (single config row)
```

**Module highlights**
- **Payroll engine** — Gross/CTC auto-split (Basic/HRA/CA/Other %); PF, ESI, PT, LOP, Bonus, Gratuity each toggleable with rates & caps.
- **Appraisals** — weighted goals + multi-stage evals (Self → HR → Manager → CEO → Business) with per-stage scoring.
- **JSON columns** for fast-evolving shapes (goals, checklist items, custom components).
- **Files** in MinIO; DB stores URLs.

---

## Slide 4 — Security & Authorization

**Auth** — `POST /api/auth/login` → bcrypt verify → **JWT**; `Authorization: Bearer` on every call; middleware decodes token → sets `request.state.user_role`.

**Two-tier RBAC**
- **Path-level (middleware):** Employee restricted to portal/shared prefixes; admin routes SuperAdmin-only.
- **Feature-level (data-driven):** `role_permissions` table → toggle any feature per role at runtime via the Feature Permissions matrix.

**Approval hierarchy** — enforced server-side (`approval_utils.py`):
```python
def can_approve(approver, requester):
    if requester == "Employee": return approver in ("HR", "CEO")  # equal power
    if requester == "HR":       return approver == "CEO"           # escalate
    if requester == "CEO":      return False                       # top of chain
```
Applied to leave, resignations and edit requests; the UI mirrors it (hides disallowed actions).

---

## Slide 5 — Frontend, Theming & Migrations

**Frontend architecture**
- One **role-aware shell** (`App.jsx`); `ROLE_HOME` picks landing page, `allowedFeatures` filters nav.
- **State-based routing** (PAGES map) — no URL router needed for an internal tool.
- **Hooks:** `useAuth`, `usePermissions`, `useTheme`, `useBackground`, `useToast`.

**Design system**
- Tailwind + a `glass-*` layer (`backdrop-filter`) for frosted sidebar/topbar/modals.
- Selectable **background themes** (overlay + accent + light/dark) via a `has-bg-image` class.
- **Collapsible sidebar** (220px ⇆ 76px rail, persisted); mobile drawer + bottom nav.

**Migrations** — no Alembic: on boot `create_all()` + idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS` → zero-downtime schema evolution.

---

## Slide 6 — Deployment, Scale & Roadmap

**Deployment**
- Single Docker image (`artechrms_app`): FastAPI (Uvicorn) serves API + SPA; PostgreSQL + MinIO as companions.
- Ship: `npm run build` → `docker cp` frontend/backend → `docker restart` (near-instant).

**Scale & extensibility**
- Stateless API → horizontal scaling · modular routers/models · runtime feature flags · clear upgrade paths.

**Roadmap**
- Alembic migrations + pytest/CI · background job queue for payroll · SSE/WebSocket real-time · integrations (biometric, e-sign, accounting, SSO/OIDC) · observability (logs, metrics, error tracking).

# Thank You — Q & A
📧 artechnical707@gmail.com
