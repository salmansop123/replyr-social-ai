# Replyr AI

Multi-tenant SaaS for AI-powered replies on Facebook, Instagram, WhatsApp, and TikTok.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Clerk
- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2, Alembic, Celery, Redis
- **Database:** PostgreSQL 16

## Local development

**Recommended (API + UI on your machine):** see **[docs/PHASE1.md](docs/PHASE1.md)**.

```bash
./start.sh
# or: bash scripts/start.sh
```

That one script starts Postgres (Docker), runs migrations, Celery, API, and Next.js. Press **Ctrl+C** to stop all of them.

Optional: `bash scripts/phase1-verify.sh` to health-check.

### WhatsApp (Phase 2)

See **[docs/PHASE2.md](docs/PHASE2.md)** — Meta webhook, Channels connect, `bash scripts/tunnel.sh`, `python3 scripts/test_whatsapp_flow.py`.

### Facebook Pages (Phase 3 beta)

See **[docs/PHASE3.md](docs/PHASE3.md)** — OAuth, Page webhooks, `python3 scripts/test_facebook_flow.py`, `bash scripts/phase3-verify.sh`.

### Stripe billing (Phase 4)

See **[docs/PHASE4.md](docs/PHASE4.md)** — Products/prices, webhook at `/api/v1/billing/webhook`, `NEXT_PUBLIC_BILLING_DEMO=false`, `bash scripts/phase4-verify.sh`.

Without Clerk keys, use **Continue to dashboard** on sign-in (dev auth + `POST /auth/dev-bootstrap`).

### Docker Compose (all services in containers)

1. Copy `backend/.env.example` → `backend/.env` (use `postgres` / `redis` hostnames).
2. `docker compose up --build`

- API: http://localhost:8000  
- API health: http://localhost:8000/health  
- Frontend: http://localhost:3000  

## Project layout

See `Replyr_AI_Cursor_Prompt.docx` (architecture guide) for the full specification: folder structure, database schema, webhooks, and implementation phases.
