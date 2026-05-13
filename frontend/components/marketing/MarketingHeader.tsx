"use client";

import Link from "next/link";
import { useState } from "react";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";

const nav = [
  { href: "/#features", label: "Product" },
  { href: "/#workflow", label: "Workflow" },
  { href: "/pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-wa to-wa-dark text-white shadow-glow-wa transition-transform duration-300 group-hover:scale-105">
            <WhatsAppGlyph className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Replyr<span className="bg-gradient-to-r from-electric to-accent-violet bg-clip-text text-transparent"> AI</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="link-subtle text-sm font-medium">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/sign-in" className="btn-secondary !py-2 !px-4">
            Sign in
          </Link>
          <Link href="/sign-up" className="btn-primary !py-2 !px-4">
            Start free trial
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-slate-700 md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white/95 px-4 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-700" onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            <Link href="/sign-in" className="btn-secondary text-center" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link href="/sign-up" className="btn-primary text-center" onClick={() => setOpen(false)}>
              Start free trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
