"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Sparkles, Zap } from "lucide-react";
import { useApi } from "@/lib/api";
import { useSessionBootstrap } from "@/components/dashboard/SessionBootstrap";
import { cn } from "@/lib/utils";

type SubscriptionUsage = {
  ai_replies_used_this_month: number;
  ai_replies_limit: number;
  plan: string;
};

function usagePercent(used: number, limit: number) {
  if (limit < 0) return 0;
  if (limit === 0) return 100;
  return (used / limit) * 100;
}

type Props = {
  className?: string;
  threshold?: number;
};

/** Premium usage warning when monthly AI replies approach the plan cap (GAP-002). */
export function UsageQuotaBanner({ className, threshold = 80 }: Props) {
  const api = useApi();
  const { ready } = useSessionBootstrap();

  const sub = useQuery({
    queryKey: ["billing", "subscription", "quota-banner"],
    queryFn: async () => {
      const res = await api.get<SubscriptionUsage>("/billing/subscription");
      return res.data;
    },
    enabled: ready,
    staleTime: 60_000,
    retry: false,
  });

  const data = sub.data;
  if (!data || data.ai_replies_limit < 0) return null;

  const pct = usagePercent(data.ai_replies_used_this_month, data.ai_replies_limit);
  if (pct < threshold) return null;

  const critical = pct >= 95;

  return (
    <div
      role="status"
      className={cn(
        "relative overflow-hidden rounded-2xl border px-5 py-4 shadow-premium transition-all duration-300",
        critical
          ? "border-red-300/80 bg-gradient-to-r from-red-50 via-orange-50/90 to-amber-50/80"
          : "border-amber-300/70 bg-gradient-to-r from-amber-50/95 via-orange-50/60 to-electric-soft/40",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full blur-3xl",
          critical ? "bg-red-400/25" : "bg-amber-400/20",
        )}
        aria-hidden
      />
      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <span
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-md ring-1",
              critical
                ? "bg-gradient-to-br from-red-500 to-orange-500 text-white ring-red-400/40"
                : "bg-gradient-to-br from-amber-400 to-orange-400 text-white ring-amber-300/50",
            )}
          >
            {critical ? <AlertTriangle className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">
              {critical ? "Monthly AI reply limit almost reached" : "You're approaching your monthly AI reply limit"}
            </p>
            <p className="mt-0.5 text-sm text-slate-600">
              <span className="font-semibold tabular-nums text-slate-800">
                {data.ai_replies_used_this_month.toLocaleString()}
              </span>
              {" / "}
              <span className="tabular-nums">{data.ai_replies_limit.toLocaleString()}</span> AI replies this month
              {" "}
              <span className="font-semibold text-slate-700">({Math.round(pct)}%)</span>
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/billing"
          className={cn(
            "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:opacity-95",
            critical
              ? "bg-gradient-to-r from-red-600 to-orange-500"
              : "bg-gradient-to-r from-amber-500 via-orange-500 to-electric",
          )}
        >
          <Sparkles className="h-4 w-4" />
          View plans
        </Link>
      </div>
      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/70 ring-1 ring-black/5">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            critical ? "bg-gradient-to-r from-red-500 to-orange-400" : "bg-gradient-to-r from-amber-400 to-electric",
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}
