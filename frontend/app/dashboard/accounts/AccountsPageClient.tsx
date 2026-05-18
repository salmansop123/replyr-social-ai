"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/lib/api";
import { useQueryErrorToast } from "@/lib/use-query-error-toast";
import { FacebookGlyph } from "@/components/brand/FacebookGlyph";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { WebhookHealthBadge } from "@/components/dashboard/WebhookHealthBadge";

const FB_BLUE = "#1877F2";

type Account = {
  id: string;
  platform: string;
  platform_user_id: string;
  display_name: string | null;
  is_active: boolean;
  token_expires_at: string | null;
  last_webhook_received_at: string | null;
  created_at: string;
};

function formatWebhookTime(iso: string | null) {
  if (!iso) return "No webhooks received yet";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function ChannelsAccountsContent() {
  const api = useApi();
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const [fbMsg, setFbMsg] = useState<string | null>(null);
  const [fbSetupOpen, setFbSetupOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    // #region agent log
    fetch("http://127.0.0.1:7845/ingest/e46810bd-6a09-4049-8a37-492421b89b3f", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "951a6e" },
      body: JSON.stringify({
        sessionId: "951a6e",
        location: "AccountsPageClient.tsx:mount",
        message: "accounts client mounted",
        data: { hasFacebookParam: !!searchParams.get("facebook") },
        timestamp: Date.now(),
        hypothesisId: "B",
        runId: "pre-fix",
      }),
    }).catch(() => {});
    // #endregion
    const fb = searchParams.get("facebook");
    if (fb === "connected") {
      toast.success("Facebook Page connected.");
      void qc.invalidateQueries({ queryKey: ["social", "accounts"] });
    } else if (fb === "error") {
      const reason = searchParams.get("reason") || "unknown";
      toast.error(`Facebook connection failed (${reason}). Try again or check Meta app settings.`);
    }
  }, [searchParams, qc]);

  const accountsQuery = useQuery({
    queryKey: ["social", "accounts"],
    queryFn: async () => {
      const res = await api.get<Account[]>("/social/accounts");
      return res.data;
    },
  });

  const fbSetupQuery = useQuery({
    queryKey: ["social", "facebook", "setup"],
    queryFn: async () => {
      const res = await api.get<{
        meta_app_configured: boolean;
        oauth_redirect_uri: string;
        webhook_callback_url_hint: string;
        app_review_note: string;
      }>("/social/facebook/setup");
      return res.data;
    },
  });

  useQueryErrorToast(accountsQuery.isError, "Could not load connected accounts.");

  const connectWa = useMutation({
    mutationFn: async () => {
      await api.post("/social/connect/whatsapp", {
        phone_number_id: phoneNumberId.trim(),
        display_name: displayName.trim(),
        access_token: accessToken,
      });
    },
    onSuccess: async () => {
      toast.success("WhatsApp connected.");
      setPhoneNumberId("");
      setAccessToken("");
      setDisplayName("");
      await qc.invalidateQueries({ queryKey: ["social", "accounts"] });
      await qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (err: unknown) => {
      let msg = "WhatsApp connection failed. Check Phone Number ID and token.";
      if (err && typeof err === "object" && "response" in err) {
        const data = (err as { response?: { data?: { detail?: unknown } } }).response?.data;
        const d = data?.detail;
        if (typeof d === "string") msg = d;
        else if (Array.isArray(d))
          msg = d
            .map((x) => (typeof x === "object" && x && "msg" in x ? String((x as { msg: string }).msg) : JSON.stringify(x)))
            .join(" ");
      }
      toast.error(msg);
    },
  });

  const disconnect = useMutation({
    mutationFn: async (accountId: string) => {
      await api.delete(`/social/accounts/${accountId}`);
    },
    onSuccess: async () => {
      toast.success("Channel disconnected.");
      await qc.invalidateQueries({ queryKey: ["social", "accounts"] });
      await qc.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: () => toast.error("Disconnect failed."),
  });

  const data = accountsQuery.data ?? [];
  const waAccounts = data.filter((a) => a.platform === "whatsapp" && a.is_active);
  const fbAccounts = data.filter((a) => a.platform === "facebook" && a.is_active);
  const waConnected = waAccounts.length > 0;
  const fbConnected = fbAccounts.length > 0;
  const latestFbWebhook = fbAccounts.reduce<string | null>((latest, a) => {
    if (!a.last_webhook_received_at) return latest;
    if (!latest || a.last_webhook_received_at > latest) return a.last_webhook_received_at;
    return latest;
  }, null);
  const latestWaWebhook = waAccounts.reduce<string | null>((latest, a) => {
    if (!a.last_webhook_received_at) return latest;
    if (!latest || a.last_webhook_received_at > latest) return a.last_webhook_received_at;
    return latest;
  }, null);

  async function onConnectFacebook() {
    setFbMsg(null);
    try {
      const res = await api.get<{ oauth_url: string | null; message?: string }>("/social/connect/facebook");
      if (res.data.oauth_url) {
        window.location.href = res.data.oauth_url;
      } else {
        setFbMsg(res.data.message ?? "Facebook OAuth is not configured yet.");
      }
    } catch {
      setFbMsg("Could not start Facebook connection. Check API logs.");
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Channels</h1>
        <p className="mt-1 text-sm text-slate-600">
          Connect WhatsApp manually (testing) or Facebook Pages via OAuth. Tokens are encrypted on the server.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card relative overflow-hidden p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gradient-to-br from-wa/25 to-accent-cyan/20 blur-3xl" />
          <div className="relative flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-glow-wa"
                style={{ backgroundColor: "#25D366" }}
              >
                <WhatsAppGlyph className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900">WhatsApp Business</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  Cloud API number for inbound routing, AI replies, and inbox analytics.
                </p>
              </div>
            </div>

            {accountsQuery.isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            )}

            {!accountsQuery.isLoading && waConnected && (
              <div className="space-y-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">
                    Connected
                  </span>
                  {waAccounts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      disabled={disconnect.isPending}
                      onClick={() => disconnect.mutate(a.id)}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  ))}
                </div>
                {waAccounts.map((a) => (
                  <div key={a.id}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone number ID</p>
                    <p className="mt-1 font-mono text-sm font-medium text-slate-900">{a.platform_user_id}</p>
                    {a.display_name && <p className="mt-1 text-sm text-slate-600">{a.display_name}</p>}
                  </div>
                ))}
                <WebhookHealthBadge lastWebhookAt={latestWaWebhook} />
              </div>
            )}

            {!accountsQuery.isLoading && !waConnected && (
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!phoneNumberId.trim() || !accessToken.trim() || !displayName.trim()) {
                    toast.error("Fill in Phone Number ID, Access Token, and Display Name.");
                    return;
                  }
                  connectWa.mutate();
                }}
              >
                <div>
                  <label className="text-xs font-semibold text-slate-600">Phone Number ID</label>
                  <input
                    type="text"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    placeholder="Enter your WhatsApp Phone Number ID"
                    autoComplete="off"
                    className="mt-1 w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500/20 focus:ring-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Access Token</label>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Enter your permanent access token"
                    autoComplete="off"
                    className="mt-1 w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500/20 focus:ring-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. My Business WhatsApp"
                    className="mt-1 w-full rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-500/20 focus:ring-2"
                  />
                </div>
                <button
                  type="submit"
                  disabled={connectWa.isPending}
                  className="btn-primary w-full py-3 text-sm font-bold shadow-glow disabled:opacity-60"
                  style={{ background: "linear-gradient(to right, #25D366, #128C7E)" }}
                >
                  {connectWa.isPending ? "Connecting…" : "Connect"}
                </button>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80">
                  <button
                    type="button"
                    onClick={() => setHelpOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-800"
                  >
                    <span>Where do I find these?</span>
                    {helpOpen ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                  </button>
                  {helpOpen && (
                    <div className="border-t border-slate-200/80 px-4 pb-4 pt-2 text-sm leading-relaxed text-slate-600">
                      Go to{" "}
                      <a
                        href="https://developers.facebook.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-emerald-700 underline underline-offset-2"
                      >
                        developers.facebook.com
                      </a>{" "}
                      → Your App → WhatsApp → API Setup
                    </div>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="glass-card relative overflow-hidden p-8">
          <div
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
            style={{ background: `linear-gradient(to bottom right, ${FB_BLUE}33, rgba(6, 182, 212, 0.15))` }}
          />
          <div className="relative flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                style={{ backgroundColor: FB_BLUE }}
              >
                <FacebookGlyph className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold text-slate-900">Facebook Pages</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  OAuth Page connection for comments, Messenger DMs, and feed context for AI replies.
                </p>
              </div>
            </div>

            {accountsQuery.isLoading && (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-24 w-full rounded-xl" />
              </div>
            )}

            {!accountsQuery.isLoading && fbConnected && (
              <div
                className="space-y-4 rounded-2xl border p-4"
                style={{ borderColor: `${FB_BLUE}40`, backgroundColor: `${FB_BLUE}08` }}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm"
                    style={{ backgroundColor: FB_BLUE }}
                  >
                    Connected
                  </span>
                  {fbAccounts.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      disabled={disconnect.isPending}
                      onClick={() => disconnect.mutate(a.id)}
                      className="rounded-xl border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-800 hover:bg-red-50 disabled:opacity-50"
                    >
                      Disconnect
                    </button>
                  ))}
                </div>
                {fbAccounts.map((a) => (
                  <div key={a.id}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Page name</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">{a.display_name || "Facebook Page"}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Page ID</p>
                    <p className="mt-1 font-mono text-sm text-slate-900">{a.platform_user_id}</p>
                  </div>
                ))}
                <WebhookHealthBadge lastWebhookAt={latestFbWebhook} />
              </div>
            )}

            {!accountsQuery.isLoading && !fbConnected && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={onConnectFacebook}
                  className={cn(
                    "w-full rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95",
                  )}
                  style={{ backgroundColor: FB_BLUE }}
                >
                  Connect with Facebook
                </button>
                {fbMsg && (
                  <p className="rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
                    {fbMsg}
                  </p>
                )}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/80">
                  <button
                    type="button"
                    onClick={() => setFbSetupOpen((v) => !v)}
                    className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-slate-800"
                  >
                    <span>Meta setup checklist (beta)</span>
                    {fbSetupOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  {fbSetupOpen && fbSetupQuery.data && (
                    <div className="space-y-2 border-t border-slate-200/80 px-4 pb-4 pt-2 text-xs leading-relaxed text-slate-600">
                      <p>
                        <span className="font-semibold text-slate-800">OAuth redirect URI</span> (Meta → Facebook Login):
                      </p>
                      <code className="block break-all rounded-lg bg-white px-2 py-1.5 text-[11px] text-slate-800">
                        {fbSetupQuery.data.oauth_redirect_uri}
                      </code>
                      <p>
                        <span className="font-semibold text-slate-800">Page webhook URL</span> (ngrok:{" "}
                        <code className="rounded bg-white px-1">scripts/tunnel.sh</code>):
                      </p>
                      <code className="block break-all rounded-lg bg-white px-2 py-1.5 text-[11px] text-slate-800">
                        {fbSetupQuery.data.webhook_callback_url_hint}
                      </code>
                      <p className="text-slate-500">{fbSetupQuery.data.app_review_note}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">Connected accounts</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {waAccounts.length + fbAccounts.length} active
          </span>
        </div>
        {accountsQuery.isLoading && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        )}
        {!accountsQuery.isLoading && waAccounts.length === 0 && fbAccounts.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200/80 bg-white/60 px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">No active channels yet.</p>
            <p className="mt-2 text-sm text-slate-500">Connect WhatsApp or Facebook above.</p>
          </div>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[...waAccounts, ...fbAccounts].map((a) => (
            <div
              key={a.id}
              className={cn(
                "group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
                a.platform === "facebook" ? "hover:border-fb/35" : "hover:border-emerald-300/60",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {a.platform === "facebook" ? (
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: FB_BLUE }}
                    >
                      <FacebookGlyph className="h-5 w-5 text-white" />
                    </span>
                  ) : (
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white ring-1 ring-black/10"
                      style={{ backgroundColor: "#25D366" }}
                    >
                      <WhatsAppGlyph className="h-5 w-5" />
                    </span>
                  )}
                  <p className="truncate font-semibold text-slate-900">
                    {a.display_name || (a.platform === "facebook" ? "Facebook Page" : "WhatsApp")}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80">
                  active
                </span>
              </div>
              <p className="mt-2 font-mono text-xs text-slate-500">ID: {a.platform_user_id}</p>
              {a.platform === "facebook" && (
                <p className="mt-1 text-xs text-slate-500">Last webhook: {formatWebhookTime(a.last_webhook_received_at)}</p>
              )}
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{a.platform}</p>
              <button
                type="button"
                className="mt-4 w-full rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-800 hover:border-red-200 hover:text-red-800"
                disabled={disconnect.isPending}
                onClick={() => disconnect.mutate(a.id)}
              >
                Disconnect
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChannelsAccountsContent;
