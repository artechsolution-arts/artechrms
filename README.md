<div align="center">

# AR Peopliz

**Full-stack HRMS — Web · Android · iOS · Desktop**

*by Artech Solutions*

<p>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Capacitor-119EFF?style=for-the-badge&logo=capacitor&logoColor=white" />
  <img src="https://img.shields.io/badge/Tauri-FFC131?style=for-the-badge&logo=tauri&logoColor=black" />
  <img src="https://img.shields.io/badge/Railway-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" />
</p>

</div>

---

## Overview

AR Peopliz is a production-ready Human Resource Management System that covers the full employee lifecycle — from recruitment and onboarding to payroll, leaves, appraisals, and offboarding — across all platforms from a single codebase.

| Platform | How |
|----------|-----|
| **Web** | React SPA served by FastAPI, deployed on Railway |
| **Android** | Capacitor APK — built via GitHub Actions on every release tag |
| **iOS** | Capacitor — built and validated via GitHub Actions on every release tag |
| **Desktop** | Tauri (Windows + macOS) — installers attached to GitHub Releases |

---

## Modules

| Module | Description |
|--------|-------------|
| **Onboarding / Offboarding** | Entry-point for new hires — creates employee record, assigns assets, uploads joining docs (Offer Letter, NDA, HR Policy…), opens wizard automatically |
| **Employee Management** | Profiles, org chart, salary structure, documents, profile photos |
| **Dashboard** | Real-time KPIs for HR and CEO — headcount, attendance, payroll summary |
| **Leave Management** | Apply, approve/reject, balance tracking, manager approval workflow |
| **Payroll** | CTC breakdown — Basic, HRA, PF, ESI, PT, LTA; payslip PDF generation |
| **Recruitment** | Job openings, applicant pipeline, JD attachments |
| **Appraisals** | Goals, self/manager ratings, 360° feedback cycles |
| **Asset Management** | Issue and track company assets per employee; linked to onboarding |
| **Attendance / Biometric** | Attendance records, shift management, biometric ID mapping |
| **Announcements** | Company-wide announcements with priority and expiry |
| **Company Documents** | Letterhead templates, policy documents |
| **AI Assistant** | Claude-powered HR Q&A (requires Anthropic API key) |
| **Employee Self-Service** | Payslips, leave requests, profile editing, salary slip download |
| **Notifications** | In-app notification feed |
| **Reports** | Exportable HR reports |
| **SuperAdmin Panel** | User management, role permissions, feature-flag toggles |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS 3, Lucide React, Chart.js |
| **Backend** | FastAPI, SQLAlchemy 2.0, Python 3.11 |
| **Database** | PostgreSQL |
| **Auth** | JWT (HS256, Bearer token) |
| **Mobile** | Capacitor 8 (Android + iOS) |
| **Desktop** | Tauri 2 (Windows, macOS Intel + ARM) |
| **AI** | Anthropic Claude API |
| **Web Deploy** | Railway (Docker, auto-deploy on push to `main`) |
| **CI/CD** | GitHub Actions — mobile builds (Android/iOS) + Tauri desktop on `v*` tags |

---

## Quick Start (Local Dev)

### Prerequisites

- Python 3.11+
- Node.js 22+
- PostgreSQL running locally

### Backend

```bash
cd artechrms

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r backend/requirements.txt

export DATABASE_URL="postgresql://postgres:<password>@127.0.0.1:5432/artechrms"
export SECRET_KEY="your-secret-key"

uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd hrms-react
npm install
npm run dev       # dev server at http://localhost:5173 (proxies /api to :8000)
```

---

## Deploying to Railway (Web)

Railway builds the Docker image from `Dockerfile`. The frontend is **pre-built and committed** to the `frontend/` directory — Railway does not run `npm build` itself.

**Every time you change frontend source files, run this before pushing:**

```bash
cd hrms-react
npm run build           # outputs to ../frontend/

cd ..
git add frontend/
git commit -m "build: rebuild frontend"
git push origin main    # Railway auto-deploys on push to main
```

> The `Dockerfile` copies `frontend/` directly into the Python image. This keeps Railway deploys fast — no Node.js stage, no npm install on the server.

### Environment Variables (set in Railway dashboard)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (Railway provides this automatically) |
| `SECRET_KEY` | JWT signing key — use a long random string |
| `ALLOWED_ORIGINS` | Your Railway app URL, e.g. `https://arpeopliz.up.railway.app` |
| `ANTHROPIC_API_KEY` | Enables the AI Assistant module |
| `VITE_BACKEND_URL` | Backend URL used by Capacitor/Tauri mobile and desktop builds |

---

## Releasing Mobile & Desktop Builds

Push a version tag — GitHub Actions builds Android APK, iOS (simulator check), and Tauri installers automatically:

```bash
git tag v1.x.x
git push origin v1.x.x
```

Artifacts are attached to the GitHub Release:
- `ar-peopliz-debug.apk` — Android debug APK
- `ar-peopliz-release-unsigned.apk` — Android release APK (unsigned)
- Windows `.exe` / `.msi` installer
- macOS `.dmg` (Intel + Apple Silicon)

### Required GitHub Secrets

| Secret | Used by |
|--------|---------|
| `GITHUB_TOKEN` | All workflows (auto-provided) |
| `VITE_BACKEND_URL` | Mobile + Tauri builds (sets the API base URL) |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri update signing |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | Tauri update signing |

---

## Project Structure

```
artechrms/
├── backend/
│   ├── main.py              # FastAPI app, middleware, startup
│   ├── database.py          # SQLAlchemy engine & session
│   ├── auth_utils.py        # JWT helpers, password hashing
│   ├── models/              # ORM models (employee, leave, payroll…)
│   └── routers/             # API route handlers (one per module)
│       ├── employees.py
│       ├── onboarding.py    # Onboarding + HR doc upload endpoints
│       ├── payroll.py
│       ├── leaves.py
│       ├── hrm.py           # Assets, attendance, announcements
│       ├── recruitment.py
│       ├── appraisals.py
│       └── ai.py            # Claude AI assistant
├── hrms-react/
│   ├── src/
│   │   ├── App.jsx          # Auth shell + role-based routing
│   │   ├── pages/           # One component per module
│   │   ├── components/      # Shared design-system components
│   │   │   ├── Select.jsx   # Custom dropdown
│   │   │   ├── DatePicker.jsx
│   │   │   └── Modal.jsx
│   │   └── api.js           # fetch wrapper (JWT, 401 handling)
│   ├── android/             # Capacitor Android project
│   ├── ios/                 # Capacitor iOS project
│   ├── src-tauri/           # Tauri desktop config & Rust shell
│   └── vite.config.js       # outDir: ../frontend (Railway build)
├── frontend/                # Pre-built React bundle (committed to git)
├── .github/workflows/
│   ├── deploy.yml           # Builds + pushes Docker image to GHCR
│   ├── mobile-build.yml     # Android APK + iOS build check
│   └── tauri-build.yml      # Windows + macOS desktop installers
├── Dockerfile               # Python-only image (copies pre-built frontend/)
├── railway.toml             # Railway build config + health check
└── docker-entrypoint.sh     # Wait-for-postgres + uvicorn start
```

---

## Role-Based Access

| Role | Panel | Access |
|------|-------|--------|
| `SuperAdmin` | SuperAdmin Panel | Full access + user management + feature toggles |
| `Admin` / `HR Manager` | HR Dashboard | All HR modules (configurable per feature) |
| `Manager` | HR Dashboard | Subset of HR features |
| `HR User` | HR Dashboard | Subset of HR features |
| `Employee` | Employee Portal | Self-service only (payslips, leaves, profile) |
| `CEO` | CEO Dashboard | Executive KPIs and headcount view |

---

## Production Checklist

- [ ] Set `SECRET_KEY` to a long random string (min 32 chars)
- [ ] Set `ALLOWED_ORIGINS` to your production domain
- [ ] Use a strong PostgreSQL password
- [ ] Mount `/app/static/uploads` to persistent storage (Railway volume or S3)
- [ ] Set `ANTHROPIC_API_KEY` if using the AI assistant
- [ ] Set `VITE_BACKEND_URL` for mobile/desktop builds

---

<div align="center">

Built with ❤️ by **Artech Solutions**

<p>
  <img src="https://img.shields.io/badge/Web-Railway-0B0D0E?style=flat-square&logo=railway" />
  <img src="https://img.shields.io/badge/Mobile-Capacitor-119EFF?style=flat-square&logo=capacitor" />
  <img src="https://img.shields.io/badge/Desktop-Tauri-FFC131?style=flat-square&logo=tauri" />
  <img src="https://img.shields.io/badge/AI-Claude-D97757?style=flat-square" />
</p>

</div>
