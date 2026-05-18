#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export REPLYR_BACKEND_DIR="${ROOT}/backend"
# shellcheck source=scripts/lib/local-env.sh
source "${ROOT}/scripts/lib/local-env.sh"

cd "${ROOT}/backend"
if [[ ! -d .venv ]]; then
  echo "Missing backend/.venv — run: cd backend && python3 -m venv .venv && pip install -r requirements.txt" >&2
  exit 1
fi

# shellcheck source=/dev/null
source .venv/bin/activate
export PYTHONPATH="${ROOT}/backend${PYTHONPATH:+:${PYTHONPATH}}"

echo "Running Alembic against: ${DATABASE_URL}"
alembic upgrade head
echo "Migrations applied."
