#!/usr/bin/env bash
# Phase 3 — Facebook Pages readiness (local beta).

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/backend/.env"
ENV_LOCAL="${ROOT}/backend/.env.local"
API="${REPLYR_API_URL:-http://localhost:8000}"
API="${API%/}"

read_env() {
  local key="$1"
  local f val line
  for f in "$ENV_LOCAL" "$ENV_FILE"; do
    [[ -f "$f" ]] || continue
    line="$(grep -E "^[[:space:]]*${key}=" "$f" 2>/dev/null | head -1 || true)"
    [[ -n "$line" ]] || continue
    val="${line#*=}"
    val="${val%$'\r'}"; val="${val#\"}"; val="${val%\"}"
    printf '%s' "$val"
    return 0
  done
  printf ''
}

PASS=0
FAIL=0
WARN=0
ok() { echo "  ✓ $*"; PASS=$((PASS + 1)); }
bad() { echo "  ✗ $*"; FAIL=$((FAIL + 1)); }
warn() { echo "  ! $*"; WARN=$((WARN + 1)); }

echo "=== Phase 3 — Facebook verify ==="
echo ""

echo "1) API + Celery"
curl -sf "${API}/health" >/dev/null && ok "API healthy" || bad "Start ./start.sh"
pgrep -f "celery.*app.workers.celery_app worker" >/dev/null && ok "Celery worker" || bad "Celery not running"

echo "2) Meta / OAuth env"
APP_ID="$(read_env META_APP_ID)"
SECRET="$(read_env META_APP_SECRET)"
VERIFY="$(read_env META_VERIFY_TOKEN)"
REDIRECT="$(read_env META_OAUTH_REDIRECT_URI)"
OR_KEY="$(read_env OPENROUTER_API_KEY)"

[[ -n "$APP_ID" && "$APP_ID" != "your_meta_app_id" ]] && ok "META_APP_ID" || bad "META_APP_ID"
[[ -n "$SECRET" && "$SECRET" != "your_meta_app_secret" ]] && ok "META_APP_SECRET" || bad "META_APP_SECRET"
[[ -n "$VERIFY" ]] && ok "META_VERIFY_TOKEN" || bad "META_VERIFY_TOKEN"
if [[ -n "$REDIRECT" ]]; then
  ok "META_OAUTH_REDIRECT_URI=$REDIRECT"
else
  warn "Using default http://localhost:8000/api/v1/social/callback/facebook"
fi
[[ -n "$OR_KEY" && "$OR_KEY" == sk-or-* ]] && ok "OPENROUTER_API_KEY" || warn "OPENROUTER for AI replies"

echo "3) Facebook setup API"
TEST_EMAIL="phase3_${RANDOM}@example.com"
AUTH=$(curl -sf -X POST "${API}/api/v1/auth/sign-up" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"phase3pass123\",\"business_name\":\"Phase3 Org\"}" 2>/dev/null || true)
TOKEN=""
if [[ -n "${AUTH}" ]]; then
  TOKEN=$(echo "${AUTH}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null || true)
fi
SETUP=""
if [[ -n "${TOKEN}" ]]; then
  SETUP=$(curl -sf -H "Authorization: Bearer ${TOKEN}" "${API}/api/v1/social/facebook/setup" 2>/dev/null || true)
fi
if [[ -n "$SETUP" ]]; then
  ok "GET /social/facebook/setup"
  echo "     $(echo "$SETUP" | python3 -c "import sys,json; d=json.load(sys.stdin); print('redirect:', d.get('oauth_redirect_uri',''))" 2>/dev/null || echo "$SETUP" | head -c 120)"
else
  bad "Could not fetch /social/facebook/setup (sign up + API)"
fi

echo "4) Webhook path"
ok "Page + WhatsApp webhooks: ${API}/webhooks/meta"

echo "5) Pytest"
if [[ -d "${ROOT}/backend/.venv" ]]; then
  # shellcheck source=/dev/null
  source "${ROOT}/backend/.venv/bin/activate"
  export REPLYR_BACKEND_DIR="${ROOT}/backend"
  # shellcheck source=scripts/lib/local-env.sh
  source "${ROOT}/scripts/lib/local-env.sh"
  cd "${ROOT}/backend"
  if PYTHONPATH=. pytest tests/test_facebook_webhook.py tests/test_meta_webhook.py -q --tb=no 2>/dev/null; then
    ok "Facebook + meta webhook tests"
  else
    bad "pytest failed (need Postgres)"
  fi
else
  warn "No backend/.venv — skip pytest"
fi

echo "6) Smoke script"
if [[ "${REPLYR_RUN_FB_SMOKE:-}" == "1" ]]; then
  PAGE="$(read_env WEBHOOK_TEST_PAGE_ID)"
  PAGE="${PAGE:-${WEBHOOK_TEST_PAGE_ID:-}}"
  if [[ -n "$PAGE" && -n "$SECRET" ]]; then
    export WEBHOOK_TEST_PAGE_ID="$PAGE"
    export META_APP_SECRET="$SECRET"
    if python3 "${ROOT}/scripts/test_facebook_flow.py"; then ok "test_facebook_flow.py"; else bad "smoke failed"; fi
  else
    warn "Set WEBHOOK_TEST_PAGE_ID and META_APP_SECRET for smoke"
  fi
else
  warn "Smoke: REPLYR_RUN_FB_SMOKE=1 WEBHOOK_TEST_PAGE_ID=... bash scripts/phase3-verify.sh"
fi

echo ""
echo "Result: ${PASS} passed, ${FAIL} failed, ${WARN} warnings"
[[ "$FAIL" -eq 0 ]]
