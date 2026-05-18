"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { AppLogo } from "@/components/brand/AppLogo";

const meta: Record<string, { title: string; subtitle: string }> = {
  comments: { title: "Inbox", subtitle: "WhatsApp and Facebook conversations across your workspace" },
  accounts: { title: "Channels", subtitle: "Connect WhatsApp Business and Facebook Pages (OAuth)" },
  billing: { title: "Billing", subtitle: "Plans, usage, and subscription management" },
  settings: { title: "Settings", subtitle: "Organization profile and AI behavior" },
};

export function DashboardTopBar() {
  const segment = useSelectedLayoutSegment();
  const m = meta[segment ?? ""] ?? {
    title: "Overview",
    subtitle: "WhatsApp & Facebook performance, volume, and recent customer messages",
  };

  return (
    <header className="sticky top-0 z-40 border-b border-electric/10 bg-white/80 px-4 py-4 shadow-[0_1px_0_0_rgba(59,130,246,0.08),0_4px_24px_-8px_rgba(37,211,102,0.1)] backdrop-blur-xl sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200/80">
              <AppLogo className="h-8 w-8" />
            </span>
            <h1 className="font-heading text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{m.title}</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{m.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-teal-brand/15 bg-gradient-to-r from-wa-muted/70 via-electric-soft/60 to-teal-muted/50 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-electric/10 sm:inline-flex">
            WhatsApp · Facebook
          </span>
          <Link
            href="/contact"
            className="rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-brand/35 hover:bg-teal-muted/30 hover:text-teal-800"
          >
            Help
          </Link>
        </div>
      </div>
    </header>
  );
}
