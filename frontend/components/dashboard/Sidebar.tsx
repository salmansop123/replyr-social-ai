"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppLogo } from "@/components/brand/AppLogo";
import { DashboardLogoutButton } from "@/components/dashboard/DashboardLogoutButton";

const links = [
  { href: "/dashboard", label: "Overview", match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/comments", label: "Inbox", match: (p: string) => p.startsWith("/dashboard/comments") },
  { href: "/dashboard/accounts", label: "Channels", match: (p: string) => p.startsWith("/dashboard/accounts") },
  { href: "/dashboard/billing", label: "Billing", match: (p: string) => p.startsWith("/dashboard/billing") },
  { href: "/dashboard/ai-training", label: "AI Training", match: (p: string) => p.startsWith("/dashboard/ai-training") },
  { href: "/dashboard/settings", label: "Settings", match: (p: string) => p.startsWith("/dashboard/settings") },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 h-screen w-[280px] shrink-0 flex flex-col border-r border-electric/10 bg-white/92 shadow-[4px_0_40px_-12px_rgba(59,130,246,0.12),4px_0_24px_-16px_rgba(37,211,102,0.08)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-electric-soft/50 via-wa-muted/20 to-teal-muted/35" />
      <div className="pointer-events-none absolute -right-20 top-24 h-48 w-48 rounded-full bg-wa/12 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -left-16 bottom-32 h-40 w-40 rounded-full bg-electric/10 blur-3xl" aria-hidden />
      <div className="relative border-b border-slate-200/70 px-5 py-6">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80 transition-transform duration-300 group-hover:scale-[1.03] group-hover:shadow-premium">
            <AppLogo className="h-11 w-11" />
          </span>
          <div>
            <p className="font-heading text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Replyr</p>
            <p className="font-heading text-lg font-bold tracking-tight text-slate-900">
              AI<span className="bg-gradient-to-r from-electric via-accent-cyan to-teal-brand bg-clip-text text-transparent">.</span>
            </p>
          </div>
        </Link>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">WhatsApp & Facebook one premium control plane.</p>
      </div>

      <nav className="relative flex flex-1 flex-col gap-1 p-3">
        {links.map((l) => {
          const active = l.match(pathname);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`group relative overflow-hidden rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 ${
                active
                  ? "bg-gradient-to-r from-electric/15 via-teal-muted/50 to-wa-muted/45 text-slate-900 shadow-glow-teal ring-1 ring-electric/20"
                  : "text-slate-600 hover:bg-gradient-to-r hover:from-electric-soft/40 hover:to-wa-muted/30 hover:text-slate-900"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-electric via-teal-brand to-wa-dark transition-opacity ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                }`}
              />
              <span className="relative pl-2">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative space-y-2 border-t border-slate-200/80 p-4">
        {/* <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white/80 p-2 shadow-sm backdrop-blur-sm">
          {isClerkActive ? (
            <>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-9 w-9 ring-2 ring-slate-100" } }} />
              <span className="text-xs text-slate-500">Signed in</span>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-brand/30 hover:text-teal-800"
              >
                Home
              </Link>
              <span className="text-xs text-slate-500">Local</span>
            </>
          )}
        </div> */}
        <DashboardLogoutButton />
      </div>
    </aside>
  );
}
