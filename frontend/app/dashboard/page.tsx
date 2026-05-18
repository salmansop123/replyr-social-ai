"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useApi } from "@/lib/api";
import { useSessionBootstrap } from "@/components/dashboard/SessionBootstrap";
import { useQueryErrorToast } from "@/lib/use-query-error-toast";
import { AnalyticsActivityChart, type TsPoint } from "@/components/dashboard/AnalyticsAreaChart";
import { PlatformCard } from "@/components/dashboard/PlatformCard";
import { FacebookGlyph } from "@/components/brand/FacebookGlyph";
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
    dms_received?: number;
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

function RowPlatformIcon({ platform }: { platform: string }) {
  if (platform === "facebook") {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-[#0866FF]/25">
        <FacebookGlyph className="h-6 w-6" />
      </div>
    );
  }
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-wa/15 text-wa-dark ring-1 ring-wa/20">
      <WhatsAppGlyph className="h-5 w-5" />
    </div>
  );
}

export default function DashboardHome() {
  const api = useApi();
  const { ready: sessionReady } = useSessionBootstrap();
  const summary = useQuery({
    queryKey: ["analytics", "summary"],
    queryFn: async () => {
      const res = await api.get<Summary>("/analytics/summary", { params: { latest_limit: 12 } });
      return res.data;
    },
    enabled: sessionReady,
  });
  const series = useQuery({
    queryKey: ["analytics", "timeseries", 30],
    queryFn: async () => {
      const res = await api.get<{ points: TsPoint[]; by_platform?: Record<string, TsPoint[]> }>(
        "/analytics/timeseries",
        { params: { days: 30 } },
      );
      return res.data;
    },
    enabled: sessionReady,
  });

  useQueryErrorToast(summary.isError, "Could not load analytics. Check the API and your session.");
  useQueryErrorToast(series.isError, "Could not load activity chart.");

  const platforms = summary.data?.platforms ?? [];
  const wa = platforms.find((p) => p.platform === "whatsapp");
  const fb = platforms.find((p) => p.platform === "facebook");
  const totals = platforms.reduce(
    (acc, p) => ({
      inbound: acc.inbound + p.comments_received,
      ai: acc.ai + p.ai_replies_sent,
      leads: acc.leads + p.leads_captured,
    }),
    { inbound: 0, ai: 0, leads: 0 },
  );

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <PlatformCard platform="whatsapp" summary={wa} isLoading={summary.isLoading} />
        <PlatformCard platform="facebook" summary={fb} isLoading={summary.isLoading} />
      </div>

      {summary.error && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 text-sm text-amber-950 shadow-sm backdrop-blur">
          Could not load analytics. Ensure the API is running and your session is synced with the backend.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="glass-card-glow group relative overflow-hidden p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-accent lg:col-span-2">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-electric/18 via-teal-brand/12 to-wa-muted/40 blur-3xl transition-opacity group-hover:opacity-90" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">This month</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">WhatsApp & Facebook throughput</h2>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                Inbound messages, AI assisted replies, and leads captured combined across connected channels.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 shadow-inner">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-wa text-white shadow-glow-wa">
                    <WhatsAppGlyph className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">WhatsApp</p>
                    <p className={`text-xs font-bold ${wa?.connected ? "text-emerald-600" : "text-slate-700"}`}>
                      {wa?.connected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-3 py-2 shadow-inner">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-[#0866FF]/30">
                    <FacebookGlyph className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Facebook</p>
                    <p className={`text-xs font-bold ${fb?.connected ? "text-emerald-600" : "text-slate-700"}`}>
                      {fb?.connected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative mt-8 grid gap-4 sm:grid-cols-3">
            <div className="metric-card border-teal-brand/15 bg-gradient-to-br from-white to-teal-muted/40">
              <p className="text-xs font-medium text-slate-500">Inbound</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{totals.inbound}</p>
              <p className="mt-1 text-xs text-slate-500">Customer messages</p>
            </div>
            <div className="metric-card border-electric/15 bg-gradient-to-br from-white to-electric-soft/60 hover:shadow-glow-accent">
              <p className="text-xs font-medium text-slate-500">AI replies</p>
              <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-electric via-accent-cyan to-teal-brand bg-clip-text text-transparent">
                {totals.ai}
              </p>
              <p className="mt-1 text-xs text-slate-500">Automated sends</p>
            </div>
            <div className="metric-card border-wa/20 bg-gradient-to-br from-white to-wa-muted/50 hover:shadow-glow-wa-soft">
              <p className="text-xs font-medium text-slate-500">Leads</p>
              <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-fb to-electric bg-clip-text text-transparent">
                {totals.leads}
              </p>
              <p className="mt-1 text-xs text-slate-500">Captured signals</p>
            </div>
          </div>
        </div>

        <div className="glass-card-glow flex flex-col justify-between p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow-accent">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Next step</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900">Connect both channels</h3>
            <p className="mt-2 text-sm text-slate-600">
              Add WhatsApp Business and Facebook Pages (OAuth), tune tone & delays in Settings, then monitor inbox
              performance.
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Link href="/dashboard/accounts" className="btn-primary text-center py-3">
              Open channel settings
            </Link>
            <Link href="/dashboard/comments" className="btn-secondary text-center py-3">
              Go to inbox
            </Link>
          </div>
        </div>
      </div>

      <div className="glass-card-glow p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Activity trend</h3>
            <p className="mt-1 text-sm text-slate-600">Last 30 days inbound, outbound, and leads.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs font-semibold">
            <span className="flex items-center gap-2 text-electric">
              <span className="h-2 w-2 rounded-full bg-electric" /> Inbound
            </span>
            <span className="flex items-center gap-2 text-teal-brand">
              <span className="h-2 w-2 rounded-full bg-teal-brand shadow-glow-teal" /> Outbound
            </span>
            <span className="flex items-center gap-2 text-fb">
              <span className="h-2 w-2 rounded-full bg-fb" /> Leads
            </span>
          </div>
        </div>
        <div className="mt-6">
          {series.isLoading ? (
            <div className="h-[300px] animate-pulse rounded-2xl bg-slate-100/80" />
          ) : (
            <AnalyticsActivityChart
              points={series.data?.points ?? []}
              facebookPoints={series.data?.by_platform?.facebook}
            />
          )}
        </div>
      </div>

      <div className="glass-card-glow p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Latest messages</h3>
            <p className="mt-1 text-sm text-slate-600">WhatsApp & Facebook previews open the inbox for full context.</p>
          </div>
          <Link href="/dashboard/comments" className="btn-secondary whitespace-nowrap py-2.5 text-sm">
            Open inbox
          </Link>
        </div>
        <div className="mt-6 space-y-3">
          {(summary.data?.latest_inbound ?? []).length === 0 && !summary.isLoading && (
            <p className="rounded-2xl border border-dashed border-slate-200/80 bg-white/50 px-4 py-8 text-center text-sm text-slate-500">
              No inbound messages yet. When WhatsApp or Facebook is connected, previews will appear here.
            </p>
          )}
          {(summary.data?.latest_inbound ?? []).map((row) => (
            <div
              key={`${row.conversation_id}-${row.created_at}`}
              className="group flex gap-4 rounded-2xl border border-slate-200/70 bg-gradient-to-r from-white via-white to-teal-muted/20 p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-teal-brand/25 hover:shadow-md"
            >
              <RowPlatformIcon platform={row.platform} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-semibold text-slate-900">{row.customer_name || "Customer"}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                    {row.status}
                  </span>
                  <span className="rounded-full bg-slate-100/80 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                    {row.platform}
                  </span>
                  <span className="ml-auto text-xs text-slate-500">{formatTime(row.created_at)}</span>
                </div>
                <div
                  className={
                    row.platform === "whatsapp"
                      ? "wa-message-bubble mt-2 max-w-3xl"
                      : "mt-2 max-w-3xl rounded-2xl rounded-tl-md border border-fb/15 bg-gradient-to-br from-electric-soft/40 to-white px-4 py-2.5 text-sm text-slate-700 shadow-inner"
                  }
                >
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
