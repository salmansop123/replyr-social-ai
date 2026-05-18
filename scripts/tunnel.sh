#!/usr/bin/env bash
# Start ngrok to expose the FastAPI backend (webhook on port 8000 by default),
# then print exact Meta Developer Console steps using META_APP_ID and META_VERIFY_TOKEN from backend/.env.
#
# Usage:
#   bash scripts/tunnel.sh           # tunnels http://127.0.0.1:8000
#   bash scripts/tunnel.sh 8000      # explicit port
#
# Requires: ngrok (https://ngrok.com/), curl, python3

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/backend/.env"
PORT="${1:-8000}"

if ! command -v ngrok >/dev/null 2>&1; then
  echo "ngrok is not installed or not on PATH." >&2
  echo "Install: https://ngrok.com/download" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing ${ENV_FILE} — create it from backend/.env.example" >&2
  exit 1
fi

# Read KEY=value from .env (first match), strip optional quotes and CR.
read_env() {
  local key="$1"
  local line
  line="$(grep -E "^[[:space:]]*${key}=" "$ENV_FILE" 2>/dev/null | head -1 || true)"
  [[ -z "$line" ]] && { echo ""; return 0; }
  local val="${line#*=}"
  val="${val%$'\r'}"
  val="${val#\"}"
  val="${val%\"}"
  val="${val#\'}"
  val="${val%\'}"
  printf '%s' "$val"
}

META_APP_ID="$(read_env META_APP_ID)"
META_VERIFY_TOKEN="$(read_env META_VERIFY_TOKEN)"

if [[ -z "${META_APP_ID}" || "${META_APP_ID}" == "your_meta_app_id" ]]; then
  echo "Warning: META_APP_ID is empty or still a placeholder in backend/.env — step 1 URL may be wrong." >&2
fi
if [[ -z "${META_VERIFY_TOKEN}" ]]; then
  echo "Warning: META_VERIFY_TOKEN is empty in backend/.env." >&2
fi

WA_CONSOLE_URL="https://developers.facebook.com/apps/${META_APP_ID:-YOUR_APP_ID}/whatsapp-business/wa-dev-console"

cleanup() {
  if [[ -n "${NGROK_PID:-}" ]] && kill -0 "${NGROK_PID}" 2>/dev/null; then
    kill "${NGROK_PID}" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM HUP

echo "Starting ngrok → http://127.0.0.1:${PORT} (FastAPI / webhooks)…"
echo "Ngrok inspector: http://127.0.0.1:4040"
echo ""

ngrok http "${PORT}" --log=stdout &
NGROK_PID=$!

# Wait for ngrok local API
NGROK_URL=""
for _ in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:4040/api/tunnels" >/dev/null 2>&1; then
    NGROK_URL="$(
      curl -sf "http://127.0.0.1:4040/api/tunnels" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    tunnels = d.get('tunnels') or []
    for t in tunnels:
        u = t.get('public_url') or ''
        if u.startswith('https://'):
            print(u.rstrip('/'))
            break
    else:
        print('')
except Exception:
    print('')
" 2>/dev/null || true
)"
    [[ -n "${NGROK_URL}" ]] && break
  fi
  sleep 0.5
done

if [[ -z "${NGROK_URL}" ]]; then
  echo "Could not read public URL from ngrok (http://127.0.0.1:4040). Is ngrok authenticated? (ngrok config add-authtoken …)" >&2
  exit 1
fi

CALLBACK="${NGROK_URL}/webhooks/meta"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  NGROK RUNNING — Register your webhook in Meta:"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  1. Go to: ${WA_CONSOLE_URL}"
echo "  2. Under \"Webhook\", click Edit"
echo "  3. Set Callback URL to:"
echo "       ${CALLBACK}"
echo "  4. Set Verify Token to: (whatever META_VERIFY_TOKEN is in your .env)"
echo "       → ${META_VERIFY_TOKEN:-<set META_VERIFY_TOKEN in backend/.env>}"
echo "  5. Click Verify and Save"
echo "  6. Under Webhook Fields, subscribe to: messages"
echo ""
echo "  Then send a WhatsApp message to your test number and watch:"
echo "  - http://localhost:8000/docs (FastAPI logs)"
echo "  - Celery worker terminal (AI processing)"
echo "  - http://localhost:3000/dashboard/comments (new conversation)"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Ngrok PID ${NGROK_PID} — press Ctrl+C to stop the tunnel."
wait "${NGROK_PID}" 2>/dev/null || true
