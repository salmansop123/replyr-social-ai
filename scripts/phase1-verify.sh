#!/usr/bin/env bash
# Phase 1 verification: infra, API health, dev auth, optional Clerk/OpenRouter hints.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export REPLYR_BACKEND_DIR="${ROOT}/backend"
# shellcheck source=scripts/lib/local-env.sh
source "${ROOT}/scripts/lib/local-env.sh"

API="${NEXT_PUBLIC_API_URL:-http://localhost:8000}"
API="${API%/}"
PASS=0
FAIL=0
WARN=0

ok() { echo "  ✓ $*"; PASS=$((PASS + 1)); }
bad() { echo "  ✗ $*"; FAIL=$((FAIL + 1)); }
warn() { echo "  ! $*"; WARN=$((WARN + 1)); }

echo "=== Phase 1 verify ==="
echo ""

echo "1) Redis"
if command -v redis-cli >/dev/null 2>&1 && redis-cli -h localhost ping 2>/dev/null | grep -q PONG; then
  ok "Redis PONG on localhost:6379"
else
  bad "Redis not reachable on localhost:6379"
fi

echo "2) Postgres (${DATABASE_URL})"
if command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx replyr-postgres; then
  ok "Container replyr-postgres running"
fi
cd "${ROOT}/backend"
# shellcheck source=/dev/null
source .venv/bin/activate 2>/dev/null || true
export PYTHONPATH="${ROOT}/backend"
if python - <<'PY' 2>/dev/null
import os
from sqlalchemy import create_engine, text
url = os.environ["DATABASE_URL"]
e = create_engine(url, pool_pre_ping=True)
with e.connect() as c:
    c.execute(text("SELECT 1"))
print("ok")
PY
then
  ok "Database connection"
else
  bad "Cannot connect — run: bash scripts/infra-up.sh && bash scripts/migrate-local.sh"
fi

echo "3) API health"
if curl -sf "${API}/health" >/dev/null; then
  ok "GET ${API}/health"
else
  bad "API not running — start: bash scripts/dev-local.sh"
fi

echo "4) Dev auth bootstrap"
BOOT=$(curl -sf -X POST "${API}/api/v1/auth/dev-bootstrap" 2>/dev/null || true)
if [[ -n "${BOOT}" ]]; then
  ok "POST /api/v1/auth/dev-bootstrap"
else
  bad "Dev bootstrap failed (set DEV_AUTH_ENABLED=true in backend/.env.local)"
fi

echo "5) Org /me (dev token)"
ORG=$(curl -sf -H "Authorization: Bearer dev-local" "${API}/api/v1/org/me" 2>/dev/null || true)
if [[ -n "${ORG}" ]]; then
  ok "GET /api/v1/org/me with Bearer dev-local"
else
  bad "GET /org/me failed"
fi

echo "6) Frontend"
if curl -sf -o /dev/null "http://localhost:3000" 2>/dev/null || curl -sf -o /dev/null "http://127.0.0.1:3000" 2>/dev/null; then
  ok "Next.js responding on :3000"
else
  warn "Frontend not on :3000 (start dev-local.sh)"
fi

echo "7) Clerk (optional)"
FE_CLERK="${ROOT}/frontend/.env.local"
if [[ -f "${FE_CLERK}" ]] && grep -qE '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_' "${FE_CLERK}" 2>/dev/null; then
  k=$(grep '^NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=' "${FE_CLERK}" | cut -d= -f2- | tr -d '"' | tr -d "'")
  if [[ ${#k} -ge 50 ]]; then
    ok "Clerk publishable key present — use real sign-in at /sign-in"
  else
    warn "Clerk key too short — using offline dev auth"
  fi
else
  warn "No Clerk key — offline dev auth (Continue to dashboard)"
fi

echo "8) OpenRouter (optional for AI replies)"
if [[ -n "${OPENROUTER_API_KEY:-}" ]] || grep -qE '^OPENROUTER_API_KEY=sk-or-' "${ROOT}/backend/.env" "${ROOT}/backend/.env.local" 2>/dev/null; then
  ok "OPENROUTER_API_KEY set"
else
  warn "OPENROUTER_API_KEY missing — webhooks queue but AI replies need a key"
fi

echo "9) Celery"
if pgrep -f "celery.*app.workers.celery_app" >/dev/null 2>&1; then
  ok "Celery worker process running"
else
  warn "Celery not running — bash scripts/celery-local.sh"
fi

echo ""
echo "Result: ${PASS} passed, ${FAIL} failed, ${WARN} warnings"
if [[ "${FAIL}" -gt 0 ]]; then
  exit 1
fi
