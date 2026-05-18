# Phase 2 — WhatsApp end-to-end

Goal: real WhatsApp message → inbox → AI reply → sent back via Cloud API.

## Prerequisites

- Phase 1 complete: `./start.sh` running
- [Meta Developer](https://developers.facebook.com) app with **WhatsApp** product
- [OpenRouter](https://openrouter.ai) API key in `backend/.env` or `.env.local`

## 2.1 Meta Developer setup

1. Create app → add **WhatsApp** product.
2. Copy **App ID** and **App Secret** → `backend/.env`:
   ```env
   META_APP_ID=...
   META_APP_SECRET=...
   META_VERIFY_TOKEN=replyr_webhook_verify_2024
   ```
3. WhatsApp → **API Setup** → add a test phone number.

## 2.2 Public webhook (local)

**Terminal 1:** keep `./start.sh` running.

**Terminal 2:**
```bash
bash scripts/tunnel.sh
```

Register in Meta → WhatsApp → Configuration:

| Field | Value |
|-------|--------|
| Callback URL | `https://YOUR-NGROK-ID.ngrok-free.app/webhooks/meta` |
| Verify token | same as `META_VERIFY_TOKEN` |
| Subscribe | **messages** |

Webhook path is **`/webhooks/meta`** (app root, not `/api/v1`).

## 2.3 Connect WhatsApp

**Option A — Dashboard (recommended)**

1. http://localhost:3000/dashboard/accounts
2. Enter **Phone Number ID**, **display name**, **permanent access token**
3. Click Connect

**Option B — Environment (dev)**

```env
META_WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
META_WHATSAPP_ACCESS_TOKEN=EAAxx...
```

On first webhook, dev mode auto-creates a `SocialAccount` for the dev workspace org.

## 2.4 Smoke test

```bash
# With stack running:
WEBHOOK_TEST_PHONE_NUMBER_ID=your_phone_number_id \
  python3 scripts/test_whatsapp_flow.py

bash scripts/phase2-verify.sh
REPLYR_RUN_WA_SMOKE=1 WEBHOOK_TEST_PHONE_NUMBER_ID=... bash scripts/phase2-verify.sh
```

Then send a real WhatsApp message to your test number.

### Checklist

| Step | Check |
|------|--------|
| Webhook POST 200 | ngrok inspector or API logs |
| DB rows | `conversations` + `messages` |
| Celery | worker log: `process_and_reply` |
| Outbound WA | message on phone |
| Inbox | http://localhost:3000/dashboard/comments |
| Usage banner | Billing / Settings at 80%+ |

## 2.5 Tune replies

- **Settings:** tone, delays, business hours, escalation keywords, auto-reply
- **AI Training:** upload PDF/CSV for knowledge in prompts

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Webhook 200 but no inbox | `phone_number_id` in webhook metadata must match `SocialAccount.platform_user_id` |
| No AI reply | `OPENROUTER_API_KEY`, Celery running, check worker logs |
| Invalid signature | `META_APP_SECRET` matches Meta app |
| Graph send fails | Token needs `whatsapp_business_messaging` permission |
