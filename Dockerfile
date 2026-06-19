# Frontend is pre-built locally and committed to git (frontend/ directory).
# This keeps Railway deploys fast — no Node.js stage, no npm ci/build.
# Before deploying: cd hrms-react && npm run build

FROM python:3.11-slim

# System dependencies for psycopg2, Pillow, bcrypt, cairosvg (PDF logo), fonts
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    libffi-dev \
    libjpeg-dev \
    zlib1g-dev \
    libcairo2 \
    libglib2.0-0 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    fonts-dejavu-core \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python dependencies (cached layer — only re-runs when requirements.txt changes)
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir pillow

# Copy backend source
COPY backend/ ./backend/

# Copy pre-built frontend from repo (no Node.js needed)
COPY frontend/ ./frontend/

# Static uploads directory + logo for PDF generation
RUN mkdir -p static/uploads/jd static/uploads/ig_posts static
COPY hrms-react/public/logo.svg ./static/logo.svg

# Environment defaults (override via Railway env vars)
ENV DATABASE_URL=postgresql://postgres:postgres@db:5432/artechrms
ENV SECRET_KEY=change-me-in-production-use-a-long-random-string
ENV ALLOWED_ORIGINS=http://localhost:8000

EXPOSE 8000

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
