#!/usr/bin/env bash
# One command to run the full local Replyr stack:
#   Postgres (Docker) → migrations → Celery worker → FastAPI → Next.js
#
# Usage:
#   bash scripts/start.sh
#   REPLYR_SKIP_MIGRATE=1 bash scripts/start.sh    # skip alembic
#   REPLYR_KEEP_NEXT=1 bash scripts/start.sh       # keep frontend/.next cache
#
# Stop everything: Ctrl+C

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""
CELERY_PID=""

free_listen_port() {
  local port="$1"
  local pids=""
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  fi
  if [[ -n "${pids:-}" ]]; then
    echo "Freeing port ${port}…"
    for pid in ${pids}; do
      kill "${pid}" 2>/dev/null || true
    done
    sleep 1
    for pid in ${pids}; do
      kill -9 "${pid}" 2>/dev/null || true
    done
  fi
}

stop_celery() {
  if pgrep -f "celery.*app.workers.celery_app worker" >/dev/null 2>&1; then
    pkill -f "celery.*app.workers.celery_app worker" 2>/dev/null || true
    sleep 1
  fi
}

cleanup() {
  echo ""
  echo "Stopping Replyr…"
  if [[ -n "${CELERY_PID}" ]] && kill -0 "${CELERY_PID}" 2>/dev/null; then
    kill "${CELERY_PID}" 2>/dev/null || true
  fi
  stop_celery
  if [[ -n "${BACKEND_PID}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo "Done."
}

trap cleanup EXIT INT TERM HUP

# --- Prereqs ---
if [[ ! -d "${ROOT}/backend/.venv" ]]; then
  echo "Missing backend/.venv — run:" >&2
  echo "  cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt" >&2
  exit 1
fi

if [[ ! -d "${ROOT}/frontend/node_modules" ]]; then
  echo "Installing frontend dependencies…"
  (cd "${ROOT}/frontend" && npm install)
fi

if [[ ! -f "${ROOT}/backend/.env.local" ]]; then
  echo "Creating backend/.env.local from example…"
  cp "${ROOT}/backend/.env.local.example" "${ROOT}/backend/.env.local"
fi

if [[ ! -f "${ROOT}/frontend/.env.local" ]]; then
  echo "Creating frontend/.env.local from example…"
  cp "${ROOT}/frontend/.env.local.example" "${ROOT}/frontend/.env.local"
fi

# --- Infrastructure ---
echo "=== 1/4 Infrastructure ==="
bash "${ROOT}/scripts/infra-up.sh"

# --- Migrations ---
echo ""
echo "=== 2/4 Database migrations ==="
if [[ "${REPLYR_SKIP_MIGRATE:-}" == "1" ]]; then
  echo "Skipped (REPLYR_SKIP_MIGRATE=1)"
else
  bash "${ROOT}/scripts/migrate-local.sh"
fi

export REPLYR_BACKEND_DIR="${ROOT}/backend"
# shellcheck source=scripts/lib/local-env.sh
source "${ROOT}/scripts/lib/local-env.sh"

cd "${ROOT}/backend"
# shellcheck source=/dev/null
source ".venv/bin/activate"
export PYTHONPATH="${ROOT}/backend${PYTHONPATH:+:${PYTHONPATH}}"

free_listen_port 3000
free_listen_port 8000
stop_celery
sleep 1

# --- Celery ---
echo ""
echo "=== 3/4 Celery worker ==="
echo "Broker: ${REDIS_URL}"
celery -A app.workers.celery_app worker -l info --concurrency=4 &
CELERY_PID=$!
sleep 2
if ! kill -0 "${CELERY_PID}" 2>/dev/null; then
  echo "Celery failed to start — is Redis running on localhost:6379?" >&2
  exit 1
fi
echo "Celery PID: ${CELERY_PID}"

# --- API + Frontend ---
echo ""
echo "=== 4/4 API + Frontend ==="
echo "Database: ${DATABASE_URL}"

echo "Starting API at http://127.0.0.1:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd "${ROOT}/frontend"
if [[ "${REPLYR_KEEP_NEXT:-}" != "1" ]] && [[ -d .next ]]; then
  echo "Clearing frontend/.next…"
  rm -rf .next
fi
sleep 1
echo "Starting UI at http://127.0.0.1:3000 — wait for 'Ready' before opening the browser."
npm run dev:webpack &
FRONTEND_PID=$!

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Replyr is starting"
echo "  • App:     http://localhost:3000"
echo "  • API:     http://localhost:8000/health"
echo "  • Sign-in: http://localhost:3000/sign-in"
echo "    (no Clerk keys → Continue to dashboard)"
echo ""
echo "  Press Ctrl+C to stop API, UI, and Celery."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

wait
