#!/usr/bin/env bash
# Run Celery worker on the HOST (not inside Docker).
# Uses localhost for Redis/Postgres — docker compose must expose ports 6379 / 5432.
#
# Prereqs:
#   docker compose up -d redis postgres
#   cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT}/backend"

if [[ ! -d ".venv" ]]; then
  echo "Missing backend/.venv — create: python3 -m venv .venv && pip install -r requirements.txt" >&2
  exit 1
fi

# shellcheck source=/dev/null
source ".venv/bin/activate"
export PYTHONPATH="${ROOT}/backend${PYTHONPATH:+:${PYTHONPATH}}"

# Override Docker-only hostnames when running on the host machine
export REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"
export DATABASE_URL="${DATABASE_URL:-postgresql://replyr:replyr_dev@localhost:5432/replyr}"

# Replace docker service names if .env still points at compose network
if [[ "${REDIS_URL}" == *"@redis:"* ]] || [[ "${REDIS_URL}" == "//redis:"* ]]; then
  export REDIS_URL="redis://localhost:6379/0"
fi
if [[ "${DATABASE_URL}" == *"@postgres:"* ]] || [[ "${DATABASE_URL}" == *"//postgres:"* ]]; then
  export DATABASE_URL="postgresql://replyr:replyr_dev@localhost:5432/replyr"
fi

echo "Celery broker: ${REDIS_URL}"
echo "Database:      ${DATABASE_URL}"
echo ""

exec celery -A app.workers.celery_app worker -l info --concurrency=4
