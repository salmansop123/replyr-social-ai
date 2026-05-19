# Phase 4 — Stripe billing (live)

Wire Stripe Checkout, Customer Portal, webhooks, and disable demo billing for real subscription data.

## 4.1 Stripe Dashboard

1. **Products & prices** — Create three recurring products in [Stripe Dashboard → Products](https://dashboard.stripe.com/products):
   - **Starter** (e.g. $29/mo)
   - **Professional** (e.g. $79/mo)
   - **Enterprise** (e.g. $199/mo)

2. **Copy price IDs** into env (must match on backend and frontend):

   | Env (backend `backend/.env`) | Env (frontend `frontend/.env.local`) |
   |------------------------------|--------------------------------------|
   | `STRIPE_PRICE_STARTER` | `NEXT_PUBLIC_STRIPE_PRICE_STARTER` |
   | `STRIPE_PRICE_PROFESSIONAL` | `NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL` |
   | `STRIPE_PRICE_ENTERPRISE` | `NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE` |

3. **API keys**

   | Backend | Frontend |
   |---------|----------|
   | `STRIPE_SECRET_KEY=sk_test_...` | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...` |

4. **Webhook** — Developers → Webhooks → Add endpoint:

   - **URL (local via tunnel):** `https://<your-ngrok>/api/v1/billing/webhook`
   - **URL (local API direct):** `http://localhost:8000/api/v1/billing/webhook` (use Stripe CLI — below)
   - **Events:** `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET=whsec_...` in `backend/.env`

### Stripe CLI (recommended for local webhooks)

```bash
stripe listen --forward-to localhost:8000/api/v1/billing/webhook
# Paste the whsec_... from CLI output into backend/.env as STRIPE_WEBHOOK_SECRET
```

## 4.2 Disable demo billing

In `frontend/.env.local`:

```env
NEXT_PUBLIC_BILLING_DEMO=false
```

Restart Next.js after changing env vars.

| `NEXT_PUBLIC_BILLING_DEMO` | Behavior |
|----------------------------|----------|
| `false` | Always calls `/api/v1/billing/*` |
| `true` | Sample subscription + invoices |
| unset in development | Demo mode (preview UI) |

## Verify

```bash
./start.sh
bash scripts/phase4-verify.sh
```

Manual checks:

1. **Billing** (`/dashboard/billing`) — real plan/usage from API (no “Preview mode” banner).
2. **Checkout** — Upgrade opens Stripe Checkout; after payment, plan updates (webhook).
3. **Customer Portal** — “Manage billing” opens Stripe portal.
4. **Invoices (ENH-005)** — table lists Stripe invoices; **PDF** link when `invoice_pdf` exists.
5. **Inbox** — at ≥80% monthly AI usage, quota banner appears; at cap, new AI replies stop and threads show **Limit reached**.

## How sync works

- Checkout attaches `organization_id` in session + subscription metadata.
- Webhook `POST /api/v1/billing/webhook` updates `subscriptions` and `organizations.subscription_tier`.
- Reply limits (GAP-002) use `organization.subscription_tier` for monthly caps.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Checkout 400 “Unknown price_id” | Backend `STRIPE_PRICE_*` must include the same IDs as frontend |
| Plan stuck on Starter after payment | Webhook not reaching API — check `stripe listen` or ngrok URL |
| Preview mode still showing | Set `NEXT_PUBLIC_BILLING_DEMO=false` and restart frontend |
| No invoices | Complete a paid checkout; customer must exist in Stripe |
