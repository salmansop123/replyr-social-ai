#!/usr/bin/env bash
# Run only Celery (full stack: bash scripts/start.sh).
# Uses localhost for Redis/Postgres — see scripts/infra-up.sh.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export REPLYR_BACKEND_DIR="${ROOT}/backend"
# shellcheck source=scripts/lib/local-env.sh
source "${ROOT}/scripts/lib/local-env.sh"
cd "${ROOT}/backend"

if [[ ! -d ".venv" ]]; then
  echo "Missing backend/.venv — create: python3 -m venv .venv && pip install -r requirements.txt" >&2
  exit 1
fi

# shellcheck source=/dev/null
source ".venv/bin/activate"
export PYTHONPATH="${ROOT}/backend${PYTHONPATH:+:${PYTHONPATH}}"

echo "Celery broker: ${REDIS_URL}"
echo "Database:      ${DATABASE_URL}"
echo ""

exec celery -A app.workers.celery_app worker -l info --concurrency=4
