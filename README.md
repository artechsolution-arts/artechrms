<div align="center">

# Artech HRMS

**A modern, full-stack Human Resource Management System**

<p>
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite"/>
</p>

</div>

---

## Overview

Artech HRMS is a production-ready Human Resource Management System built for modern teams. It covers the full employee lifecycle — from recruitment and onboarding to payroll, leaves, appraisals, and offboarding — all in a single unified platform.

---

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time KPIs, headcount trends, attendance heatmap |
| **Employee Management** | Profiles, org chart, documents, profile photos |
| **Leave Management** | Apply, approve/reject, leave balance tracking |
| **Payroll** | Salary structure (CTC), HRA, PF, ESI, PT, payslip generation |
| **Recruitment** | Job openings, applicant pipeline, JD attachments |
| **Appraisals** | Goals, ratings, 360° feedback cycles |
| **HRM Tools** | Attendance, shifts, announcements |
| **Social** | Internal announcements, Instagram post scheduler |
| **AI Assistant** | Claude-powered HR Q&A (requires Anthropic API key) |
| **Employee Portal** | Self-service: payslips, leaves, profile |
| **SuperAdmin Panel** | User management, role permissions, feature toggles |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Tailwind CSS 3, Chart.js |
| **Backend** | FastAPI, SQLAlchemy 2.0, Python 3.11 |
| **Database** | PostgreSQL 16 |
| **Auth** | JWT (HS256, 8-hour expiry) |
| **Containerization** | Docker, Docker Compose |
| **AI** | Anthropic Claude API |

---

## Quick Start (Docker)

> **Prerequisite:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

```bash
# 1. Clone or copy the project folder
git clone <your-repo-url> artechrms
cd artechrms

# 2. Build and start everything
docker compose up --build

# 3. Open the app
open http://localhost:8000
```

> First boot takes **2–3 minutes** — Docker downloads Node 20 + Python 3.11 images, builds the React app, and installs all Python packages. Subsequent starts take **~10 seconds** (fully cached).

---

## Docker Commands

```bash
# Start in the foreground (with live logs)
docker compose up --build

# Start in background
docker compose up -d --build

# Stop containers
docker compose down

# Stop and wipe all data (fresh start)
docker compose down -v

# View live application logs
docker compose logs -f app

# Rebuild after code changes
docker compose up --build
```

---

## Local Development (Without Docker)

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 16+ running locally

### Backend

```bash
cd artechrms

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Install dependencies
pip install -r backend/requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://postgres:<password>@127.0.0.1:5432/artechrms"
export SECRET_KEY="your-secret-key"

# Start the API server
uvicorn backend.main:app --reload --port 8000
```

### Frontend

```bash
cd hrms-react

# Install dependencies
npm install

# Start dev server (proxies API calls to localhost:8000)
npm run dev
```

Open `http://localhost:5173` for the dev server with hot reload.

---

## Environment Variables

Configure these in `docker-compose.yml` or as shell exports for local dev:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:postgres@db:5432/artechrms` | PostgreSQL connection string |
| `SECRET_KEY` | built-in default | JWT signing key — **change in production** |
| `ALLOWED_ORIGINS` | `http://localhost:8000` | Comma-separated CORS origins |
| `ANTHROPIC_API_KEY` | _(unset)_ | Enables the AI Assistant module |

---

## Project Structure

```
artechrms/
├── backend/
│   ├── main.py              # FastAPI app, middleware, startup
│   ├── database.py          # SQLAlchemy engine & session
│   ├── auth_utils.py        # JWT encode/decode, password hashing
│   ├── models/              # SQLAlchemy ORM models
│   └── routers/             # API route handlers (one per module)
├── hrms-react/
│   ├── src/
│   │   ├── App.jsx          # Auth shell + role-based routing
│   │   ├── SuperAdminApp.jsx
│   │   ├── EmployeeApp.jsx
│   │   ├── pages/           # Page components per module
│   │   ├── components/      # Shared UI components
│   │   ├── hooks/           # useAuth, useApi
│   │   └── api.js           # Axios instance + interceptors
│   ├── vite.config.js
│   └── tailwind.config.js
├── Dockerfile               # Multi-stage build (Node → Python)
├── docker-compose.yml       # App + PostgreSQL orchestration
├── docker-entrypoint.sh     # Wait-for-postgres + uvicorn start
└── README.md
```

---

## Role-Based Access

| Role | Panel | Permissions |
|------|-------|-------------|
| `SuperAdmin` | SuperAdmin Panel | Full access to all modules + user management + feature permissions |
| `Admin` / `HR Manager` | HR Dashboard | All HR modules (configurable per feature) |
| `Manager` | HR Dashboard | Subset of HR features (configurable) |
| `HR User` | HR Dashboard | Subset of HR features (configurable) |
| `Employee` | Employee Portal | Self-service only (payslips, leaves, profile) |

---

## Production Checklist

- [ ] Change `SECRET_KEY` to a long random string (min 32 chars)
- [ ] Set `ALLOWED_ORIGINS` to your actual domain
- [ ] Use a strong PostgreSQL password
- [ ] Mount `/app/static/uploads` to persistent storage
- [ ] Set `ANTHROPIC_API_KEY` if using the AI assistant
- [ ] Place the app behind a reverse proxy (nginx/Caddy) with HTTPS

---

<div align="center">

Built with ❤️ by **Artech**

<p>
  <img src="https://img.shields.io/badge/Made_with-FastAPI-009688?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/UI-React_+_Tailwind-61DAFB?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/DB-PostgreSQL-316192?style=flat-square&logo=postgresql" />
  <img src="https://img.shields.io/badge/Deploy-Docker-2496ED?style=flat-square&logo=docker" />
</p>

</div>
