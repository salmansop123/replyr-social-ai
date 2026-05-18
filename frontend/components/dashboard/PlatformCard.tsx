"use client";

import { FacebookGlyph } from "@/components/brand/FacebookGlyph";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type PlatformSummaryRow = {
  platform: string;
  comments_received: number;
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

export function PlatformCard({ platform, summary, isLoading }: Props) {
  const isWa = platform === "whatsapp";
  const inbound = summary?.comments_received ?? 0;
  const aiOut = summary?.ai_replies_sent ?? 0;
  const leads = summary?.leads_captured ?? 0;
  const connected = summary?.connected ?? false;

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
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md ring-2 ring-[#0866FF]/25">
                <FacebookGlyph className="h-7 w-7" />
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
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/90 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Messages received</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{inbound}</p>
            </div>
            <div
              className={cn(
                "rounded-xl border p-3",
                isWa
                  ? "border-wa/20 bg-gradient-to-br from-wa-muted/50 to-white"
                  : "border-fb/20 bg-gradient-to-br from-electric-soft/50 to-white",
              )}
            >
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">AI replies sent</p>
              <p
                className="mt-1 text-2xl font-bold tabular-nums"
                style={isWa ? { color: WA } : { color: "#0866FF" }}
              >
                {aiOut}
              </p>
            </div>
            <div className="rounded-xl border border-teal-brand/15 bg-gradient-to-br from-teal-muted/40 to-white p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Leads captured</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{leads}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
