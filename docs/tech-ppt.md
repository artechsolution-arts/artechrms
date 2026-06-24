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
![PostgreSQL](https://img.shields.io/badge/NeonDB-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Pydantic](https://img.shields.io/badge/Pydantic-E92063?style=for-the-badge&logo=pydantic&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare_R2-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)
![ReportLab](https://img.shields.io/badge/ReportLab-PDF-red?style=for-the-badge)

**Frontend**

![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

**Ops / Integrations**
![Railway](https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![LinkedIn API](https://img.shields.io/badge/LinkedIn_API-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)
![Instagram API](https://img.shields.io/badge/Instagram_API-E4405F?style=for-the-badge&logo=instagram&logoColor=white)

---

## Slide 2 — Architecture

```
┌──────────────────────────── Browser (SPA) ────────────────────────────────┐
│        React 18 + Vite + Tailwind  ·  Chart.js  ·  lucide-react            │
└──────────────────────────────┬────────────────────────────────────────────┘
                                │ HTTPS / JSON  (Bearer JWT)
┌──────────────────────────────▼────────────────────────────────────────────┐
│                          FastAPI application                                │
│   Auth middleware (JWT) → RBAC guard → Routers → SQLAlchemy ORM             │
│   Also serves the pre-built React SPA as static files at  /                │
│   Background jobs: email delivery (ThreadPoolExecutor)                     │
└──────────────┬──────────────────────────────────┬─────────────────────────┘
               │                                   │ S3-compatible API
┌──────────────▼──────────────┐       ┌────────────▼──────────────────────┐
│  NeonDB  (PostgreSQL)       │       │  Cloudflare R2  (object storage)  │
│  employees, payroll, leave… │       │  photos, signed docs, letters,    │
│  OAuth state, doc templates │       │  JD files, social media assets    │
└─────────────────────────────┘       └───────────────────────────────────┘
        Deployed on Railway · Dockerfile build · pre-built frontend committed to git
```

- **Stateless API** (JWT, no sessions) → scales horizontally.
- FastAPI serves **both** the API and the SPA from one container.
- **NeonDB** — managed serverless PostgreSQL; no DB companion needed.
- **Cloudflare R2** — S3-compatible; zero egress fees; all user files routed here.

---

## Slide 3 — Data Model & Modules

```
User ──1:1── Employee ──N:1── Department / Designation / Manager(self)
                 ├──< LeaveApplication >── LeaveType      (+ LeaveBalance)
                 ├──< Attendance / WorkModeEntry
                 ├──< SalarySlip >── PayrollEntry
                 ├──< Appraisal (goals, evals, perf_documents)
                 ├──< Resignation · EditRequest · DocumentRequest
                 ├──< Onboarding / Offboarding Checklist
                 └──< DocumentTemplate (custom DOCX / letter templates)
RolePermission (role → allowed_features[])   ·   PayrollRules (single config row)
OAuthState (DB-backed; LinkedIn / Instagram tokens)
```

**Module highlights**
- **Payroll engine** — Gross/CTC auto-split (Basic/HRA/CA/Other %); PF, ESI, PT, LOP, Bonus, Gratuity each toggleable with rates & caps.
- **Appraisals** — weighted goals + multi-stage evals (Self → HR → Manager → CEO → Business) with per-stage scoring.
- **PDF letter generation** — ReportLab pipeline (`letter_generator.py`); 10 predefined templates + custom DOCX uploads; substituted variables rendered **bold** inline; ALL-CAPS & Title-Case heading detection; table support; letterhead config.
- **Manual / external entry** — letters can be generated for candidates not yet in the system; HR enters name, designation, dept, email etc. directly.
- **Email delivery** — generated PDFs attached to MNC-grade HTML emails; sent via MS Graph API or SMTP; fire-and-forget (background thread).
- **Social publishing** — LinkedIn (REST Posts API) + Instagram (Graph API) posts with R2-hosted images; OAuth 2.0 PKCE with DB-persisted state and checklist locking.
- **JSON columns** for fast-evolving shapes (goals, checklist items, custom components).

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

**OAuth state** — LinkedIn/Instagram OAuth state stored in DB (not in-memory); survives restarts and multi-instance deploys.

---

## Slide 5 — Frontend, Theming & Migrations

**Frontend architecture**
- One **role-aware shell** (`App.jsx`); `ROLE_HOME` picks landing page, `allowedFeatures` filters nav.
- **State-based routing** (PAGES map) — no URL router needed for an internal tool.
- **Hooks:** `useAuth`, `usePermissions`, `useTheme`, `useBackground`, `useToast`.
- Pre-built with Vite and committed to `frontend/`; Railway serves the static bundle directly — no Node.js at runtime.

**Design system**
- Tailwind + a `glass-*` layer (`backdrop-filter`) for frosted sidebar/topbar/modals.
- Selectable **background themes** (overlay + accent + light/dark) via a `has-bg-image` class.
- **Collapsible sidebar** (220px ⇆ 76px rail, persisted); mobile drawer + bottom nav.

**Migrations** — no Alembic: on boot `create_all()` + idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS` → zero-downtime schema evolution.

---

## Slide 6 — Deployment, Scale & Roadmap

**Deployment**
- Single Docker image: FastAPI (Uvicorn) serves API + pre-built SPA; **NeonDB** and **Cloudflare R2** are external managed services — no companion containers.
- Hosted on **Railway** (Dockerfile builder); deploy = `git push origin main` → Railway auto-builds and restarts.
- Frontend update cycle: `cd hrms-react && npm run build` → commit `frontend/` → push.

**Scale & extensibility**
- Stateless API → horizontal scaling · modular routers/models · runtime feature flags · clear upgrade paths.
- R2 handles all binary assets — no disk I/O on the app container.

**Roadmap**
- Alembic migrations + pytest/CI · background job queue (Celery/RQ) for payroll · SSE/WebSocket real-time · biometric & e-sign integrations · SSO/OIDC · observability (logs, metrics, error tracking).

# Thank You — Q & A
📧 artechnical707@gmail.com
