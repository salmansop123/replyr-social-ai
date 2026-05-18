#!/usr/bin/env bash
# Start Postgres (+ optional Redis check) for local host development.
# Uses port 5433 for Postgres when 5432 is already taken by system PostgreSQL.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTAINER_PG="${REPLYR_PG_CONTAINER:-replyr-postgres}"
PG_PORT="${REPLYR_PG_PORT:-5433}"
PG_IMAGE="${REPLYR_PG_IMAGE:-postgres:16-alpine}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker, or ensure Postgres is reachable at:" >&2
  echo "  postgresql://replyr:replyr_dev@localhost:${PG_PORT}/replyr" >&2
  exit 1
fi

if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_PG}"; then
  if docker ps --format '{{.Names}}' | grep -qx "${CONTAINER_PG}"; then
    echo "Postgres container '${CONTAINER_PG}' already running."
  else
    echo "Starting existing container '${CONTAINER_PG}'…"
    docker start "${CONTAINER_PG}" >/dev/null
  fi
else
  echo "Creating Postgres on localhost:${PG_PORT} → container 5432…"
  docker run -d \
    --name "${CONTAINER_PG}" \
    -e POSTGRES_USER=replyr \
    -e POSTGRES_PASSWORD=replyr_dev \
    -e POSTGRES_DB=replyr \
    -p "${PG_PORT}:5432" \
    "${PG_IMAGE}" >/dev/null
fi

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
