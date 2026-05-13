"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";

const meta: Record<string, { title: string; subtitle: string }> = {
  comments: { title: "Inbox", subtitle: "WhatsApp conversations across your workspace" },
  accounts: { title: "WhatsApp", subtitle: "Connect and manage your Business number" },
  billing: { title: "Billing", subtitle: "Plans, usage, and subscription management" },
  settings: { title: "Settings", subtitle: "Organization profile and AI behavior" },
};

export function DashboardTopBar() {
  const segment = useSelectedLayoutSegment();
  const m = meta[segment ?? ""] ?? {
    title: "Overview",
    subtitle: "WhatsApp performance, volume, and recent customer messages",
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/50 bg-white/75 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-wa/15 text-wa-dark">
              <WhatsAppGlyph className="h-4 w-4 text-wa-dark" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">{m.title}</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">{m.subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm sm:inline-flex">
            WhatsApp only
          </span>
          <Link
            href="/contact"
            className="rounded-xl border border-slate-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:border-electric/30 hover:text-electric"
          >
            Help
          </Link>
        </div>
      </div>
    </header>
  );
}
