#!/usr/bin/env bash
# Phase 4 — Stripe billing readiness.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/backend/.env"
ENV_LOCAL="${ROOT}/backend/.env.local"
FE_ENV="${ROOT}/frontend/.env.local"
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

read_fe_env() {
  local key="$1"
  [[ -f "$FE_ENV" ]] || return 1
  local line val
  line="$(grep -E "^[[:space:]]*${key}=" "$FE_ENV" 2>/dev/null | head -1 || true)"
  [[ -n "$line" ]] || return 1
  val="${line#*=}"
  val="${val%$'\r'}"; val="${val#\"}"; val="${val%\"}"
  printf '%s' "$val"
}

PASS=0
FAIL=0
WARN=0
ok() { echo "  ✓ $*"; PASS=$((PASS + 1)); }
bad() { echo "  ✗ $*"; FAIL=$((FAIL + 1)); }
warn() { echo "  ! $*"; WARN=$((WARN + 1)); }

echo "=== Phase 4 — Stripe billing verify ==="
echo ""

echo "1) API"
curl -sf "${API}/health" >/dev/null && ok "API healthy" || bad "Start ./start.sh"

echo ""
echo "2) Backend Stripe env"
SK="$(read_env STRIPE_SECRET_KEY)"
WH="$(read_env STRIPE_WEBHOOK_SECRET)"
[[ -n "$SK" && "$SK" != sk_test_... ]] && ok "STRIPE_SECRET_KEY set" || warn "Set STRIPE_SECRET_KEY in backend/.env"
[[ -n "$WH" && "$WH" != whsec_... ]] && ok "STRIPE_WEBHOOK_SECRET set" || warn "Set STRIPE_WEBHOOK_SECRET (stripe listen or Dashboard webhook)"

for key in STRIPE_PRICE_STARTER STRIPE_PRICE_PROFESSIONAL STRIPE_PRICE_ENTERPRISE; do
  v="$(read_env "$key")"
  if [[ -n "$v" && "$v" != price_... ]]; then
    ok "$key"
  else
    warn "$key not set (checkout validation optional until set)"
  fi
done

echo ""
echo "3) Webhook route"
code="$(curl -s -o /dev/null -w "%{http_code}" -X POST "${API}/api/v1/billing/webhook" -H "Content-Type: application/json" -d '{}' || true)"
if [[ "$code" == "400" || "$code" == "503" ]]; then
  ok "POST /api/v1/billing/webhook responds ($code without signature — expected)"
else
  bad "Webhook unexpected HTTP $code (expected 400 or 503)"
fi

echo ""
echo "4) Frontend billing mode"
if [[ -f "$FE_ENV" ]]; then
  demo="$(read_fe_env NEXT_PUBLIC_BILLING_DEMO || true)"
  if [[ "$demo" == "false" ]]; then
    ok "NEXT_PUBLIC_BILLING_DEMO=false"
  else
    warn "Set NEXT_PUBLIC_BILLING_DEMO=false in frontend/.env.local for live billing"
  fi
  for key in NEXT_PUBLIC_STRIPE_PRICE_STARTER NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE; do
    v="$(read_fe_env "$key" || true)"
    [[ -n "$v" && "$v" != price_... ]] && ok "$key" || warn "$key not set in frontend/.env.local"
  done
else
  warn "frontend/.env.local missing — copy frontend/.env.local.example"
fi

echo ""
echo "5) Tests"
if (cd "${ROOT}/backend" && python3 -m pytest tests/test_stripe_webhook.py tests/test_reply_limits.py -q 2>/dev/null); then
  ok "billing unit tests"
else
  warn "Run: cd backend && pytest tests/test_stripe_webhook.py tests/test_reply_limits.py"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Pass: $PASS  Warn: $WARN  Fail: $FAIL"
echo "  Manual: Billing → Checkout → Portal → Inbox quota banner"
echo "  Docs: docs/PHASE4.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
[[ "$FAIL" -eq 0 ]]
