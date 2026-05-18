# Phase 1 — Stabilize local dev

Goal: sign in (or dev auth), load dashboard, save settings, with API + DB + Redis + Celery running.

## Quick start

```bash
./start.sh
```

Starts Postgres, Redis (if needed), migrations, Celery, API, and Next.js in one terminal. **Ctrl+C** stops everything.

Verify: `bash scripts/phase1-verify.sh`

## Auth modes

| Mode | When | Dashboard access |
|------|------|------------------|
| **Dev auth** | No Clerk key in `frontend/.env.local`, `DEV_AUTH_ENABLED=true` in `backend/.env.local` | Sign-in page → **Continue to dashboard**; API uses `Bearer dev-local` |
| **Clerk** | Real `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (50+ chars) | Normal sign-in; `POST /api/v1/auth/bootstrap` |

## Host vs Docker

- **API / Celery on your machine:** use `backend/.env.local` with `localhost:5433` and `localhost:6379`.
- **API inside `docker compose`:** keep `postgres` / `redis` hostnames in `backend/.env`.

## Optional keys

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | AI replies (Phase 2+) |
| Clerk keys | Production-like auth |
| Meta keys | WhatsApp / Facebook webhooks |

## Troubleshooting

- **Alembic can't connect:** run `bash scripts/infra-up.sh`, check `DATABASE_URL` in `backend/.env.local`.
- **Celery `redis:6379` error:** use `bash scripts/celery-local.sh` (rewrites Docker hostnames).
- **Settings crash with Clerk:** use dev auth or add valid Clerk keys; Account card uses client-only import.
- **Port 5432 in use:** infra script uses **5433** by default (`REPLYR_PG_PORT=5433`).
