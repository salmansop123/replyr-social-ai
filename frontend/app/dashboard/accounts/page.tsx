"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";

type Account = {
  id: string;
  platform: string;
  platform_user_id: string;
  display_name: string | null;
  is_active: boolean;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
};

export default function WhatsAppAccountsPage() {
  const api = useApi();
  const [connectMsg, setConnectMsg] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["social", "accounts"],
    queryFn: async () => {
      const res = await api.get<Account[]>("/social/accounts");
      return res.data;
    },
  });

  const waAccounts = (data ?? []).filter((a) => a.platform === "whatsapp");

  async function onConnect() {
    setConnectMsg(null);
    try {
      const res = await api.get<{ oauth_url: string | null; message?: string }>("/social/connect/whatsapp");
      if (res.data.oauth_url) {
        window.location.href = res.data.oauth_url;
      } else {
        setConnectMsg(res.data.message ?? "WhatsApp OAuth is not configured yet.");
      }
    } catch {
      setConnectMsg("Could not start WhatsApp connection. Check API logs.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="glass-card relative overflow-hidden p-8">
        <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br from-wa/25 to-accent-cyan/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-wa to-wa-dark text-white shadow-glow-wa">
              <WhatsAppGlyph className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">WhatsApp Business</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Replyr AI is intentionally WhatsApp-first right now. Connect your Business number to unlock inbound
                routing, AI replies, and inbox analytics.
              </p>
            </div>
          </div>
          <button type="button" onClick={onConnect} className="btn-primary px-8 py-3.5 text-base shadow-glow">
            Connect WhatsApp
          </button>
        </div>
        {connectMsg && (
          <p className="relative mt-6 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950">
            {connectMsg}
          </p>
        )}
      </div>

      <div className="glass-card p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900">Connected numbers</h3>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {waAccounts.length} active
          </span>
        </div>
        {isLoading && <div className="mt-6 h-32 animate-pulse rounded-2xl bg-slate-100/80" />}
        {!isLoading && waAccounts.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-200/80 bg-white/60 px-6 py-14 text-center">
            <p className="text-sm font-medium text-slate-700">No WhatsApp numbers connected yet.</p>
            <p className="mt-2 text-sm text-slate-500">When you connect, encrypted tokens are stored server-side.</p>
          </div>
        )}
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {waAccounts.map((a) => (
            <div
              key={a.id}
              className="group rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-wa/35 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate font-semibold text-slate-900">{a.display_name || "WhatsApp number"}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    a.is_active ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200/80" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {a.is_active ? "active" : "inactive"}
                </span>
              </div>
              <p className="mt-2 font-mono text-xs text-slate-500">ID: {a.platform_user_id}</p>
              <p className="mt-3 text-xs text-slate-500">
                Token expiry: {a.token_expires_at ? new Date(a.token_expires_at).toLocaleString() : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
