#!/bin/sh
set -e

echo "Waiting for PostgreSQL to be ready..."
until python3 -c "
import psycopg2, os, sys
url = os.environ.get('DATABASE_URL', '')
try:
    psycopg2.connect(url)
    sys.exit(0)
except Exception as e:
    print(e); sys.exit(1)
" 2>/dev/null; do
    sleep 1
    printf '.'
done

echo ""
echo "PostgreSQL ready. Starting Artech HRMS..."

exec python3 -m uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2
