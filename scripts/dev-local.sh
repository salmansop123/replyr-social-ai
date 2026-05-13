#!/usr/bin/env bash
# Start Replyr AI local dev: FastAPI (backend) + Next.js (frontend) together.
# Prereqs: Postgres + Redis reachable per backend/.env (e.g. existing Docker DB containers),
#          backend/.venv with deps installed, frontend/node_modules installed.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
  echo ""
  echo "Stopping dev servers…"
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

if [[ ! -d "${ROOT}/backend/.venv" ]]; then
  echo "Missing ${ROOT}/backend/.venv" >&2
  echo "Create it: cd backend && python3 -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt" >&2
  exit 1
fi

if [[ ! -d "${ROOT}/frontend/node_modules" ]]; then
  echo "Missing ${ROOT}/frontend/node_modules — run: cd frontend && npm install" >&2
  exit 1
fi

# If .next is deleted while another `next dev` is still running, the browser gets ChunkLoadError,
# white pages, and ENOENT for fallback-build-manifest.json. Free our dev ports first.
free_listen_port() {
  local port="$1"
  local pids=""
  if command -v lsof >/dev/null 2>&1; then
    pids="$(lsof -ti:"${port}" -sTCP:LISTEN 2>/dev/null || true)"
  fi
  if [[ -n "${pids}" ]]; then
    echo "Stopping listener(s) on port ${port} (${pids}) so dev servers can start with a clean .next…"
    for pid in ${pids}; do
      kill "${pid}" 2>/dev/null || true
    done
    sleep 1
    for pid in ${pids}; do
      kill -9 "${pid}" 2>/dev/null || true
    done
    return 0
  fi
  if command -v fuser >/dev/null 2>&1; then
    if fuser "${port}/tcp" >/dev/null 2>&1; then
      echo "Stopping listener(s) on port ${port} (fuser)…"
      fuser -k "${port}/tcp" 2>/dev/null || true
      sleep 1
    fi
  fi
}

free_listen_port 3000
free_listen_port 8000

cd "${ROOT}/backend"
# shellcheck source=/dev/null
source ".venv/bin/activate"
export PYTHONPATH="${ROOT}/backend${PYTHONPATH:+:${PYTHONPATH}}"

echo "Starting API at http://127.0.0.1:8000"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

cd "${ROOT}/frontend"
# Do not delete .next on every start — that races with a still-running Next process and causes 404 on
# /_next/static/* and broken webpack-runtime. Ports are freed above; incremental .next is kept.
# For a one-time nuclear reset: REPLYR_FRESH_NEXT=1 bash scripts/dev-local.sh
if [[ "${REPLYR_FRESH_NEXT:-}" == "1" ]] && [[ -d .next ]]; then
  echo "REPLYR_FRESH_NEXT=1: removing frontend/.next…"
  rm -rf .next
fi
echo "Starting UI at http://127.0.0.1:3000"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "Backend PID: ${BACKEND_PID}"
echo "Frontend PID: ${FRONTEND_PID}"
echo "Press Ctrl+C to stop both."
echo "Tip: do not run a second 'npm run dev' in frontend/ while this script runs — it corrupts .next."
echo "If styles/chunks 404: stop all dev servers, then REPLYR_FRESH_NEXT=1 bash scripts/dev-local.sh (or: cd frontend && npm run dev:clean)."
echo ""

wait
