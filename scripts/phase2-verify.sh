#!/usr/bin/env bash
# Phase 2 — WhatsApp E2E readiness checks (local).

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

echo "=== Phase 2 — WhatsApp verify ==="
echo ""

echo "1) API"
if curl -sf "${API}/health" >/dev/null; then ok "API ${API}/health"; else bad "API not running (./start.sh)"; fi

echo "2) Meta env"
SECRET="$(read_env META_APP_SECRET)"
VERIFY="$(read_env META_VERIFY_TOKEN)"
PN="$(read_env META_WHATSAPP_PHONE_NUMBER_ID)"
TOKEN="$(read_env META_WHATSAPP_ACCESS_TOKEN)"
OR_KEY="$(read_env OPENROUTER_API_KEY)"

[[ -n "$SECRET" && "$SECRET" != "your_meta_app_secret" ]] && ok "META_APP_SECRET set" || bad "META_APP_SECRET missing"
[[ -n "$VERIFY" ]] && ok "META_VERIFY_TOKEN set" || bad "META_VERIFY_TOKEN missing"
[[ -n "$PN" ]] && ok "META_WHATSAPP_PHONE_NUMBER_ID set" || warn "Phone Number ID not in .env (use Channels UI)"
[[ -n "$TOKEN" ]] && ok "META_WHATSAPP_ACCESS_TOKEN set" || warn "Access token not in .env (use Channels UI)"
[[ -n "$OR_KEY" && "$OR_KEY" == sk-or-* ]] && ok "OPENROUTER_API_KEY set" || warn "OPENROUTER_API_KEY missing — no AI replies"

echo "3) Celery"
pgrep -f "celery.*app.workers.celery_app worker" >/dev/null && ok "Celery worker running" || bad "Celery not running"

echo "4) Webhook path"
ok "Callback URL should be: ${API}/webhooks/meta"

echo "5) Smoke test (optional)"
if [[ "${REPLYR_RUN_WA_SMOKE:-}" == "1" && -n "$SECRET" ]]; then
  export WEBHOOK_TEST_PHONE_NUMBER_ID="${WEBHOOK_TEST_PHONE_NUMBER_ID:-$PN}"
  if [[ -n "$WEBHOOK_TEST_PHONE_NUMBER_ID" ]]; then
    if python3 "${ROOT}/scripts/test_whatsapp_flow.py"; then ok "test_whatsapp_flow.py"; else bad "test_whatsapp_flow.py failed"; fi
  else
    warn "Set WEBHOOK_TEST_PHONE_NUMBER_ID for smoke test"
  fi
else
  warn "Run smoke: REPLYR_RUN_WA_SMOKE=1 WEBHOOK_TEST_PHONE_NUMBER_ID=... bash scripts/phase2-verify.sh"
fi

echo ""
echo "Result: ${PASS} passed, ${FAIL} failed, ${WARN} warnings"
[[ "$FAIL" -eq 0 ]]
