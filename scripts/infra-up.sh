#!/usr/bin/env bash
# Start Postgres (+ optional Redis check) for local host development.
# Uses port 5433 by default; picks the next free port if 5433 is taken by another project.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTAINER_PG="${REPLYR_PG_CONTAINER:-replyr-postgres}"
PG_PORT="${REPLYR_PG_PORT:-5433}"
PG_IMAGE="${REPLYR_PG_IMAGE:-postgres:16-alpine}"
PG_PORT_FILE="${ROOT}/backend/.pg-port"

container_exists() {
  docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_PG}"
}

container_running() {
  docker ps --format '{{.Names}}' | grep -qx "${CONTAINER_PG}"
}

container_mapped_port() {
  docker port "${CONTAINER_PG}" 5432/tcp 2>/dev/null | head -1 | sed 's/.*://' || true
}

port_in_use() {
  local port="$1"
  ss -tln 2>/dev/null | grep -q ":${port} "
}

find_available_port() {
  local port="$1"
  local max=$((port + 10))
  while [[ "${port}" -le "${max}" ]]; do
    if ! port_in_use "${port}"; then
      echo "${port}"
      return 0
    fi
    if container_exists && [[ "$(container_mapped_port)" == "${port}" ]]; then
      echo "${port}"
      return 0
    fi
    port=$((port + 1))
  done
  echo "No free Postgres port between ${REPLYR_PG_PORT:-5433} and ${max}" >&2
  exit 1
}

recreate_container() {
  if container_exists; then
    echo "Removing misconfigured container '${CONTAINER_PG}'…"
    docker rm -f "${CONTAINER_PG}" >/dev/null
  fi
  echo "Creating Postgres on localhost:${PG_PORT} → container 5432…"
  docker run -d \
    --name "${CONTAINER_PG}" \
    -e POSTGRES_USER=replyr \
    -e POSTGRES_PASSWORD=replyr_dev \
    -e POSTGRES_DB=replyr \
    -p "${PG_PORT}:5432" \
    "${PG_IMAGE}" >/dev/null
}

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker, or ensure Postgres is reachable at:" >&2
  echo "  postgresql://replyr:replyr_dev@localhost:${PG_PORT}/replyr" >&2
  exit 1
fi

if container_exists; then
  mapped="$(container_mapped_port)"
  if [[ -z "${mapped}" ]]; then
    echo "Container '${CONTAINER_PG}' has no host port published — recreating…"
    PG_PORT="$(find_available_port "${PG_PORT}")"
    recreate_container
  else
    PG_PORT="${mapped}"
    if container_running; then
      echo "Postgres container '${CONTAINER_PG}' already running on port ${PG_PORT}."
    else
      echo "Starting existing container '${CONTAINER_PG}' on port ${PG_PORT}…"
      docker start "${CONTAINER_PG}" >/dev/null
    fi
  fi
else
  PG_PORT="$(find_available_port "${PG_PORT}")"
  recreate_container
fi

echo "${PG_PORT}" >"${PG_PORT_FILE}"

echo "Waiting for Postgres…"
for _ in $(seq 1 30); do
  if docker exec "${CONTAINER_PG}" pg_isready -U replyr -q 2>/dev/null; then
    echo "Postgres ready at localhost:${PG_PORT}"
    break
  fi
  sleep 1
done

CONTAINER_REDIS="${REPLYR_REDIS_CONTAINER:-replyr-redis}"
REDIS_PORT="${REPLYR_REDIS_PORT:-6379}"

redis_ok() {
  command -v redis-cli >/dev/null 2>&1 && redis-cli -h localhost -p "${REDIS_PORT}" ping 2>/dev/null | grep -q PONG
}

if redis_ok; then
  echo "Redis OK at localhost:${REDIS_PORT}"
elif command -v docker >/dev/null 2>&1; then
  if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_REDIS}"; then
    docker start "${CONTAINER_REDIS}" >/dev/null 2>&1 || true
  else
    echo "Starting Redis on localhost:${REDIS_PORT}…"
    docker run -d --name "${CONTAINER_REDIS}" -p "${REDIS_PORT}:6379" redis:7-alpine >/dev/null
  fi
  for _ in $(seq 1 15); do
    if redis_ok; then
      echo "Redis ready at localhost:${REDIS_PORT}"
      break
    fi
    sleep 1
  done
  if ! redis_ok; then
    echo "Warning: Redis still not responding on localhost:${REDIS_PORT}" >&2
  fi
else
  echo "Warning: Redis not available — install Redis or Docker for Celery." >&2
fi
