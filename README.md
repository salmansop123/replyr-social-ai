# Replyr AI

Multi-tenant SaaS for AI-powered replies on Facebook, Instagram, WhatsApp, and TikTok.

## Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Clerk
- **Backend:** Python 3.11, FastAPI, SQLAlchemy 2, Alembic, Celery, Redis
- **Database:** PostgreSQL 16

## Local development

1. Copy environment files:

   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

   Fill in secrets (Clerk, Stripe, OpenRouter, Meta, etc.) as you integrate each feature.

2. Start infrastructure and API:

   ```bash
   docker compose up --build
   ```

3. In another terminal, run the frontend:

   ```bash
   cd frontend && npm install && npm run dev
   ```

- API: http://localhost:8000  
- API health: http://localhost:8000/health  
- Frontend: http://localhost:3000  

## Project layout

See `Replyr_AI_Cursor_Prompt.docx` (architecture guide) for the full specification: folder structure, database schema, webhooks, and implementation phases.
