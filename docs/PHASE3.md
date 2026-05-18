# Phase 3 — Facebook Pages (beta)

Goal: Page OAuth → comment + DM webhooks → AI reply via Graph API.

## Prerequisites

- Phase 1: `./start.sh`
- Phase 2 WhatsApp optional but same Meta app
- `META_APP_ID`, `META_APP_SECRET`, `META_VERIFY_TOKEN` in `backend/.env`
- `OPENROUTER_API_KEY` for AI replies
- [ngrok](https://ngrok.com) for local webhooks

## 3.1 Meta app configuration

1. [developers.facebook.com](https://developers.facebook.com) → your app.
2. Add products: **Facebook Login** and **Webhooks**.
3. **Facebook Login → Settings → Valid OAuth Redirect URIs** (must match exactly):
   ```
   http://localhost:8000/api/v1/social/callback/facebook
   ```
   Or set `META_OAUTH_REDIRECT_URI` in `backend/.env` / `.env.local`.

4. **Webhooks → Page** (app-level):
   - Callback URL: `https://YOUR-NGROK-ID.ngrok-free.app/webhooks/meta`
   - Verify token: same as `META_VERIFY_TOKEN`
   - Subscribe: **feed**, **messages**, **messaging_postbacks**

5. App roles: add your Facebook user as **Developer** or **Tester** until App Review is done.

### API checklist endpoint

```bash
curl -s -H "Authorization: Bearer dev-local" http://localhost:8000/api/v1/social/facebook/setup | jq
```

## 3.2 Public webhook (local)

**Terminal 1:** `./start.sh`  
**Terminal 2:** `bash scripts/tunnel.sh`

Use the printed callback URL in Meta (Page webhooks). Path is always **`/webhooks/meta`** (not under `/api/v1`).

## 3.3 Connect in Replyr

1. http://localhost:3000/dashboard/accounts
2. **Connect with Facebook** → authorize → select Pages.
3. Each Page is stored encrypted; `subscribed_apps` is called per Page.

Redirect after success: `?facebook=connected`

## 3.4 Smoke tests

```bash
# After connecting a Page, note Page ID in Channels UI:
export WEBHOOK_TEST_PAGE_ID=your_page_id
export META_APP_SECRET=your_secret

python3 scripts/test_facebook_flow.py

cd backend && source .venv/bin/activate
pytest tests/test_facebook_webhook.py tests/test_meta_webhook.py -q
```

Optional full checklist:

```bash
REPLYR_RUN_FB_SMOKE=1 WEBHOOK_TEST_PAGE_ID=... bash scripts/phase3-verify.sh
```

## 3.5 Manual E2E

1. Comment on a Page post → Inbox shows thread (comment filter).
2. Message the Page on Messenger → Inbox shows DM thread.
3. Celery logs: `process_and_reply` → outbound via Graph.
4. Escalation keywords / business hours apply from Settings.

## 3.6 App Review (production)

Required permissions for public customers:

| Permission | Use |
|------------|-----|
| `pages_messaging` | Messenger DMs |
| `pages_manage_posts` | Comment replies |
| `pages_read_engagement` | Read comments |
| `pages_show_list` | OAuth page picker |

Until approved, only **your** test Pages and app-role users work.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| OAuth redirect mismatch | `META_OAUTH_REDIRECT_URI` must match Meta console exactly |
| Webhook 200, no inbox | `WEBHOOK_TEST_PAGE_ID` must equal `SocialAccount.platform_user_id` |
| Comment works, DM not | Subscribe **messages** on Page webhooks |
| Token refresh email | Reconnect via Channels; check `refresh_facebook_tokens` beat task |
