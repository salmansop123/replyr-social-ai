"use client";

import { cn } from "@/lib/utils";

const STALE_HOURS = 48;

function relativeActivity(iso: string | null): { label: string; tone: "ok" | "warn" | "none" } {
  if (!iso) {
    return { label: "No activity yet", tone: "none" };
  }
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) {
    return { label: "No activity yet", tone: "none" };
  }
  const diffMs = Date.now() - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);

  if (diffHr >= STALE_HOURS) {
    return { label: `No activity in ${diffHr}h`, tone: "warn" };
  }
  if (diffMin < 1) {
    return { label: "Last activity: just now", tone: "ok" };
  }
  if (diffMin < 60) {
    return { label: `Last activity: ${diffMin} minute${diffMin === 1 ? "" : "s"} ago`, tone: "ok" };
  }
  if (diffHr < 24) {
    return { label: `Last activity: ${diffHr} hour${diffHr === 1 ? "" : "s"} ago`, tone: "ok" };
  }
  const days = Math.floor(diffHr / 24);
  return { label: `Last activity: ${days} day${days === 1 ? "" : "s"} ago`, tone: diffHr >= STALE_HOURS ? "warn" : "ok" };
}

type Props = {
  lastWebhookAt: string | null;
  className?: string;
};

/** ENH-004 — webhook health indicator for Channels cards. */
export function WebhookHealthBadge({ lastWebhookAt, className }: Props) {
  const { label, tone } = relativeActivity(lastWebhookAt);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
        tone === "ok" && "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
        tone === "warn" && "bg-amber-50 text-amber-900 ring-amber-300/70",
        tone === "none" && "bg-slate-100 text-slate-600 ring-slate-200/80",
        className,
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          tone === "ok" && "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]",
          tone === "warn" && "bg-amber-500",
          tone === "none" && "bg-slate-400",
        )}
        aria-hidden
      />
      {label}
    </span>
  );
}
