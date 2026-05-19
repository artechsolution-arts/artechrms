# ─────────────────────────────────────────────
# Stage 1 — Build the React frontend
# ─────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Install dependencies first (cache-friendly)
COPY hrms-react/package.json hrms-react/package-lock.json ./
RUN npm ci --silent

# Copy source and build
COPY hrms-react/ ./
RUN npm run build
# Output lands in /build/../frontend → /frontend (relative to the project root)
# vite outDir is '../frontend', so the built files are at /frontend

# ─────────────────────────────────────────────
# Stage 2 — Python app + built frontend
# ─────────────────────────────────────────────
FROM python:3.11-slim

# System dependencies for psycopg2, Pillow, bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    libffi-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir pillow

# Copy backend source
COPY backend/ ./backend/

# Copy built frontend from Stage 1
# vite builds to ../frontend relative to hrms-react/, which is the project root /frontend
COPY --from=frontend-builder /frontend ./frontend/

# Static uploads directory
RUN mkdir -p static/uploads/jd static/uploads/ig_posts

# Environment defaults (override via docker-compose or -e flags)
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/artechrms
ENV SECRET_KEY=change-me-in-production-use-a-long-random-string
ENV ALLOWED_ORIGINS=http://localhost:8000

# Expose the app port
EXPOSE 8000

# Entrypoint: wait for postgres then start uvicorn
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
