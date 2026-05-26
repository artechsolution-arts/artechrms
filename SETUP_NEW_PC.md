# Artech HRMS — New PC Setup Guide

This guide sets up the full Artech HRMS on a new machine and restores all existing data.

---

## What You Need to Transfer

Copy these files from the old PC to the new PC (all are in the project folder):

```
artechrms/
├── artechrms_backup.sql          ← PostgreSQL database dump (all HR data)
├── artechrms_minio_backup.tar.gz ← MinIO files (profile photos, documents, uploads)
├── artechrms_uploads_backup.tar.gz
├── docker-compose.yml
├── Dockerfile
├── docker-entrypoint.sh
├── backend/
├── frontend/
└── hrms-react/
```

Transfer the entire `artechrms/` folder via USB drive, Google Drive, or any file transfer method.

---

## Step 1 — Install Prerequisites on New PC

### Install Docker Desktop
- Download from: https://www.docker.com/products/docker-desktop/
- Install and start Docker Desktop
- Wait for Docker to fully start (whale icon in taskbar)

### Install PostgreSQL 17
- **Windows**: Download from https://www.postgresql.org/download/windows/
  - During install: set password to `Joseph@29`, port `5432` (defaults)
- **Mac**: `brew install postgresql@17` then `brew services start postgresql@17`

---

## Step 2 — Create the Database

Open Terminal / Command Prompt and run:

**Mac:**
```bash
psql -U postgres -c "CREATE DATABASE artechrms;"
```

**Windows (run in Command Prompt as Admin):**
```cmd
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -c "CREATE DATABASE artechrms;"
```
Enter password: `Joseph@29` when prompted.

---

## Step 3 — Restore Database Data

Navigate to the `artechrms/` project folder first:

```bash
cd /path/to/artechrms
```

**Mac:**
```bash
PGPASSWORD='Joseph@29' psql -h localhost -U postgres -d artechrms -f artechrms_backup.sql
```

**Windows:**
```cmd
set PGPASSWORD=Joseph@29
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d artechrms -f artechrms_backup.sql
```

You should see many `INSERT` lines — that means data is loading correctly.

---

## Step 4 — Start the Application with Docker

Navigate to the `artechrms/` project folder and run:

```bash
docker compose up -d --build
```

This will:
- Build the app container from source (~3–5 minutes first time)
- Start MinIO (file storage)
- Start the HRMS app on port 8000

Wait for it to finish, then check containers are running:
```bash
docker compose ps
```

Both `artechrms_app` and `artechrms_minio` should show `Up`.

---

## Step 5 — Restore File Storage (Photos & Documents)

Restore profile photos, uploaded documents, etc.:

**Mac:**
```bash
# Restore MinIO data (profile photos, company docs, uploaded documents)
docker run --rm \
  -v artechrms_minio_data:/minio_data \
  -v $(pwd):/backup \
  alpine sh -c "cd /minio_data && tar xzf /backup/artechrms_minio_backup.tar.gz"

# Restore uploads
docker run --rm \
  -v artechrms_uploads_data:/uploads_data \
  -v $(pwd):/backup \
  alpine sh -c "cd /uploads_data && tar xzf /backup/artechrms_uploads_backup.tar.gz"
```

**Windows (PowerShell):**
```powershell
# Restore MinIO data
docker run --rm `
  -v artechrms_minio_data:/minio_data `
  -v "${PWD}:/backup" `
  alpine sh -c "cd /minio_data && tar xzf /backup/artechrms_minio_backup.tar.gz"

# Restore uploads
docker run --rm `
  -v artechrms_uploads_data:/uploads_data `
  -v "${PWD}:/backup" `
  alpine sh -c "cd /uploads_data && tar xzf /backup/artechrms_uploads_backup.tar.gz"
```

---

## Step 6 — Restart and Verify

Restart the app to pick up the restored files:
```bash
docker compose restart app
```

Open the browser and go to: **http://localhost:8000**

You should see the Artech HRMS login page with all data intact.

---

## Troubleshooting

### "Cannot connect to database" error
The app container connects to PostgreSQL on the host machine via `host.docker.internal`.
- Make sure PostgreSQL is running before starting Docker
- Check the password in `docker-compose.yml` matches your PostgreSQL password

**If your PostgreSQL password is different**, edit `docker-compose.yml`:
```yaml
DATABASE_URL: postgresql://postgres:YOUR_PASSWORD@host.docker.internal:5432/artechrms
```
Then run: `docker compose up -d --build`

### On Windows: `host.docker.internal` not resolving
This usually works automatically with Docker Desktop. If not, add to `docker-compose.yml`:
```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

### Check app logs
```bash
docker compose logs app --tail=50
```

---

## Quick Summary (All Steps)

```bash
# 1. Install Docker Desktop + PostgreSQL 17 on new PC

# 2. Create database
psql -U postgres -c "CREATE DATABASE artechrms;"

# 3. Restore database
PGPASSWORD='Joseph@29' psql -h localhost -U postgres -d artechrms -f artechrms_backup.sql

# 4. Start app
docker compose up -d --build

# 5. Restore files
docker run --rm -v artechrms_minio_data:/minio_data -v $(pwd):/backup \
  alpine sh -c "cd /minio_data && tar xzf /backup/artechrms_minio_backup.tar.gz"

# 6. Open http://localhost:8000
```
