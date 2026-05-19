"use client";

import { FacebookGlyph } from "@/components/brand/FacebookGlyph";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type PlatformSummaryRow = {
  platform: string;
  comments_received: number;
  dms_received?: number;
  ai_replies_sent: number;
  leads_captured: number;
  connected: boolean;
};

type Props = {
  platform: "whatsapp" | "facebook";
  summary: PlatformSummaryRow | undefined;
  isLoading: boolean;
};

const WA = "#25D366";
const FB = "#1877F2";

export function PlatformCard({ platform, summary, isLoading }: Props) {
  const isWa = platform === "whatsapp";
  const comments = summary?.comments_received ?? 0;
  const dms = summary?.dms_received ?? (isWa ? comments : 0);
  const inbound = isWa ? comments : comments + dms;
  const aiOut = summary?.ai_replies_sent ?? 0;
  const leads = summary?.leads_captured ?? 0;
  const connected = summary?.connected ?? false;

  const gridClass = isWa ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 shadow-sm ring-1 ring-transparent transition duration-300 hover:-translate-y-1 hover:shadow-premium hover:ring-teal-brand/15",
        isWa
          ? "border-wa/40 bg-gradient-to-br from-white via-wa-muted/60 to-emerald-50/80 shadow-glow-wa-soft"
          : "border-fb/35 bg-gradient-to-br from-white via-electric-soft/50 to-blue-50/60 shadow-[0_8px_32px_-12px_rgba(24,119,242,0.15)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full blur-3xl",
          isWa ? "bg-wa/25" : "bg-fb/20",
        )}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {isWa ? (
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md ring-1 ring-black/5"
                style={{ backgroundColor: WA }}
              >
                <WhatsAppGlyph className="h-6 w-6" />
              </span>
            ) : (
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                style={{ backgroundColor: FB }}
              >
                <FacebookGlyph className="h-6 w-6" />
              </span>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-900">{isWa ? "WhatsApp" : "Facebook"}</h3>
              <span
                className={cn(
                  "mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1",
                  connected ? "bg-emerald-50 text-emerald-800 ring-emerald-200/80" : "bg-slate-100 text-slate-600 ring-slate-200/80",
                )}
              >
                {connected ? "Connected" : "Not connected"}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className={cn("grid gap-3", gridClass)}>
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            {!isWa && <Skeleton className="h-20 rounded-xl" />}
          </div>
        ) : (
          <div className={cn("grid gap-3", gridClass)}>
            {isWa ? (
              <div className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/90 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Messages received</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{inbound}</p>
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-fb/20 bg-gradient-to-br from-electric-soft/40 to-white p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Comments</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{comments}</p>
                </div>
                <div className="rounded-xl border border-fb/20 bg-gradient-to-br from-white to-blue-50/80 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">DMs</p>
                  <p className="mt-1 text-2xl font-bold tabular-nums" style={{ color: FB }}>
                    {dms}
                  </p>
                </div>
              </>
            )}
            <div
              className={cn(
                "rounded-xl border p-3",
                isWa
                  ? "border-wa/20 bg-gradient-to-br from-wa-muted/50 to-white"
                  : "border-fb/20 bg-gradient-to-br from-electric-soft/50 to-white",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">AI replies sent</p>
              <p className="mt-1 text-2xl font-bold tabular-nums" style={isWa ? { color: WA } : { color: FB }}>
                {aiOut}
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl border p-3",
                leads > 0
                  ? "border-slate-300/60 bg-gradient-to-br from-slate-50 via-white to-slate-100/80 ring-1 ring-slate-200/50"
                  : "border-slate-200/50 bg-gradient-to-br from-slate-50/50 to-white",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Leads captured</p>
              <div className="mt-1 flex items-end justify-between gap-2">
                <p className="text-2xl font-bold tabular-nums text-slate-700">{leads}</p>
                {!isWa && leads > 0 && (
                  <span
                    className="mb-0.5 inline-flex items-center gap-1 rounded-full bg-slate-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-md"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white/90" aria-hidden />
                    FB leads
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
