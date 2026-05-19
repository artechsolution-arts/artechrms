#!/bin/sh
set -e

echo "⏳ Waiting for PostgreSQL to be ready..."
until python3 -c "
import psycopg2, os, sys, re
url = os.environ.get('DATABASE_URL', '')
m = re.match(r'postgresql://([^:]+):([^@]+)@([^:/]+):(\d+)/(.+)', url)
if not m:
    print('Bad DATABASE_URL'); sys.exit(1)
user, pwd, host, port, db = m.groups()
try:
    psycopg2.connect(host=host, port=int(port), user=user, password=pwd, dbname=db)
    sys.exit(0)
except Exception as e:
    print(e); sys.exit(1)
" 2>/dev/null; do
    sleep 1
    printf '.'
done

echo ""
echo "✅ PostgreSQL is ready. Starting Artech HRMS..."

exec python3 -m uvicorn backend.main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 2
