#!/usr/bin/env bash
# Host-machine overrides for API, Celery, and Alembic (not used inside Docker Compose services).
# Source from other scripts: source "$(dirname "$0")/lib/local-env.sh"

# Prefer backend/.env.local over docker-compose hostnames in backend/.env
if [[ -f "${REPLYR_BACKEND_DIR:-}/.env.local" ]]; then
  set -a
  # shellcheck source=/dev/null
  source "${REPLYR_BACKEND_DIR}/.env.local"
  set +a
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://replyr:replyr_dev@localhost:5433/replyr}"
export REDIS_URL="${REDIS_URL:-redis://localhost:6379/0}"

# infra-up.sh writes the actual host port (5433 may be taken by another project's Postgres).
if [[ -f "${REPLYR_BACKEND_DIR:-}/.pg-port" ]]; then
  _pg_port="$(tr -d '[:space:]' < "${REPLYR_BACKEND_DIR}/.pg-port")"
  if [[ -n "${_pg_port}" ]]; then
    export DATABASE_URL="$(echo "${DATABASE_URL}" | sed -E "s/(postgresql:\/\/[^@]+@localhost:)[0-9]+/\1${_pg_port}/")"
  fi
fi

# Rewrite docker-compose service hostnames when developers run processes on the host
if [[ "${DATABASE_URL}" == *"@postgres:"* ]] || [[ "${DATABASE_URL}" == *"//postgres:"* ]]; then
  export DATABASE_URL="postgresql://replyr:replyr_dev@localhost:5433/replyr"
fi
if [[ "${REDIS_URL}" == *"redis://redis:"* ]] || [[ "${REDIS_URL}" == "//redis:"* ]]; then
  export REDIS_URL="redis://localhost:6379/0"
fi
