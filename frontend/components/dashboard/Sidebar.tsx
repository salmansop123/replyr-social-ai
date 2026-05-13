"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useAuthToken } from "@/components/auth/AuthAndClerkProvider";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";

const links = [
  { href: "/dashboard", label: "Overview", match: (p: string) => p === "/dashboard" },
  { href: "/dashboard/comments", label: "Inbox", match: (p: string) => p.startsWith("/dashboard/comments") },
  { href: "/dashboard/accounts", label: "WhatsApp", match: (p: string) => p.startsWith("/dashboard/accounts") },
  { href: "/dashboard/billing", label: "Billing", match: (p: string) => p.startsWith("/dashboard/billing") },
  { href: "/dashboard/settings", label: "Settings", match: (p: string) => p.startsWith("/dashboard/settings") },
];

export function Sidebar() {
  const pathname = usePathname();
  const { isClerkActive } = useAuthToken();

  return (
    <aside className="relative flex w-[280px] shrink-0 flex-col border-r border-white/10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-lift">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-electric/15 via-transparent to-accent-violet/10" />
      <div className="relative border-b border-white/10 px-5 py-6">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-wa to-wa-dark text-white shadow-glow-wa transition-transform duration-300 group-hover:scale-105">
            <WhatsAppGlyph className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">Replyr</p>
            <p className="text-lg font-bold tracking-tight">
              AI<span className="text-wa">.</span>
            </p>
          </div>
        </Link>
        <p className="mt-3 text-xs leading-relaxed text-white/55">WhatsApp automation — premium control plane.</p>
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
                  ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span
                className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-wa to-accent-cyan transition-opacity ${
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                }`}
              />
              <span className="relative pl-2">{l.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-white/10 p-4">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-white/5 p-2 ring-1 ring-white/10">
          {isClerkActive ? (
            <>
              <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
              <span className="text-xs text-white/50">Signed in</span>
            </>
          ) : (
            <>
              <Link
                href="/"
                className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white/90 ring-1 ring-white/15 hover:bg-white/15"
              >
                Home
              </Link>
              <span className="text-xs text-white/50">Local preview</span>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
