"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { AnalyticsActivityChart, type TsPoint } from "@/components/dashboard/AnalyticsAreaChart";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";

type LatestInbound = {
  conversation_id: string;
  platform: string;
  customer_name: string | null;
  message_preview: string;
  status: string;
  created_at: string;
};

type Summary = {
  platforms: {
    platform: string;
    comments_received: number;
    ai_replies_sent: number;
    leads_captured: number;
    connected: boolean;
  }[];
  latest_inbound?: LatestInbound[];
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function DashboardHome() {
  const api = useApi();
  const summary = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      const res = await api.get<Summary>("/analytics/summary", { params: { latest_limit: 12 } });
      return res.data;
    },
  });
  const series = useQuery({
    queryKey: ["analytics", "timeseries", 30],
    queryFn: async () => {
      const res = await api.get<{ points: TsPoint[] }>("/analytics/timeseries", { params: { days: 30 } });
      return res.data;
    },
  });

  const wa = summary.data?.platforms.find((p) => p.platform === "whatsapp");

  return (
    <div className="space-y-8">
      {summary.isLoading && (
        <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-sm text-slate-600 shadow-sm backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-wa" />
          Loading your WhatsApp workspace…
        </div>
      )}
      {summary.error && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 text-sm text-amber-950 shadow-sm backdrop-blur">
          Could not load analytics. Ensure the API is running and your Clerk session is synced with the backend.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift lg:col-span-2">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-electric/20 to-accent-violet/20 blur-3xl transition-opacity group-hover:opacity-90" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">This month</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">WhatsApp throughput</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                Inbound messages, AI-assisted replies, and leads captured — all scoped to your organization.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 shadow-inner">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-wa text-white shadow-glow-wa">
                <WhatsAppGlyph className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Connection</p>
                <p className={`text-sm font-bold ${wa?.connected ? "text-emerald-600" : "text-slate-700"}`}>
                  {wa?.connected ? "Connected" : "Not connected"}
                </p>
              </div>
            </div>
          </div>

          <div className="relative mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:border-electric/25 hover:shadow-md">
              <p className="text-xs font-medium text-slate-500">Inbound</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{wa?.comments_received ?? 0}</p>
              <p className="mt-1 text-xs text-slate-500">Customer messages</p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm transition hover:border-accent-cyan/30 hover:shadow-md">
              <p className="text-xs font-medium text-slate-500">AI replies</p>
              <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-electric to-accent-cyan bg-clip-text text-transparent">
                {wa?.ai_replies_sent ?? 0}
              </p>
              <p className="mt-1 text-xs text-slate-500">Automated sends</p>
            </div>
            <div className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-accent-violetsoft/40 p-4 shadow-sm transition hover:border-accent-violet/30 hover:shadow-md">
              <p className="text-xs font-medium text-slate-500">Leads</p>
              <p className="mt-2 text-3xl font-bold text-accent-violet">{wa?.leads_captured ?? 0}</p>
              <p className="mt-1 text-xs text-slate-500">Captured signals</p>
            </div>
          </div>
        </div>

        <div className="glass-card flex flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next step</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">Polish your WhatsApp setup</h3>
            <p className="mt-2 text-sm text-slate-600">Connect your Business number, tune tone & delays, then monitor inbox performance.</p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/dashboard/accounts" className="btn-primary text-center py-3">
              Open WhatsApp settings
            </Link>
            <Link href="/dashboard/comments" className="btn-secondary text-center py-3">
              Go to inbox
            </Link>
          </div>
        </div>
      </div>

      <div className="glass-card p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Activity trend</h3>
            <p className="mt-1 text-sm text-slate-600">Last 30 days — inbound, outbound, and leads.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <span className="flex items-center gap-2 text-electric">
              <span className="h-2 w-2 rounded-full bg-electric" /> Inbound
            </span>
            <span className="flex items-center gap-2 text-accent-cyan">
              <span className="h-2 w-2 rounded-full bg-accent-cyan" /> Outbound
            </span>
            <span className="flex items-center gap-2 text-accent-violet">
              <span className="h-2 w-2 rounded-full bg-accent-violet" /> Leads
            </span>
          </div>
        </div>
        <div className="mt-6">
          {series.isLoading ? (
            <div className="h-[300px] animate-pulse rounded-2xl bg-slate-100/80" />
          ) : (
            <AnalyticsActivityChart points={series.data?.points ?? []} />
          )}
        </div>
      </div>

      <div className="glass-card p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Latest WhatsApp messages</h3>
            <p className="mt-1 text-sm text-slate-600">Rich previews — click through to the inbox when wired.</p>
          </div>
          <Link href="/dashboard/comments" className="btn-secondary whitespace-nowrap py-2.5 text-sm">
            Open inbox
          </Link>
        </div>
        <div className="mt-6 space-y-3">
          {(summary.data?.latest_inbound ?? []).length === 0 && !summary.isLoading && (
            <p className="rounded-2xl border border-dashed border-slate-200/80 bg-white/50 px-4 py-8 text-center text-sm text-slate-500">
              No inbound messages yet. When WhatsApp is connected, previews will appear here.
            </p>
          )}
          {(summary.data?.latest_inbound ?? []).map((row) => (
            <div
              key={`${row.conversation_id}-${row.created_at}`}
              className="group flex gap-4 rounded-2xl border border-slate-200/70 bg-gradient-to-r from-white to-slate-50/80 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-wa/30 hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wa/15 text-wa-dark ring-1 ring-wa/20">
                <WhatsAppGlyph className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-900">{row.customer_name || "Customer"}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {row.status}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">{formatTime(row.created_at)}</span>
                </div>
                <div className="mt-2 max-w-3xl rounded-2xl rounded-tl-md border border-slate-200/80 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-inner">
                  {row.message_preview}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
