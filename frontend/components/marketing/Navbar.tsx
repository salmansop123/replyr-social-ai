"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useAuthToken } from "@/components/auth/AuthAndClerkProvider";

const links = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/contact", label: "Contact" },
];

function AuthButtons({ layout = "row" }: { layout?: "row" | "stack" }) {
  const { isClerkActive } = useAuthToken();

  const signInClass =
    layout === "row"
      ? "rounded-xl border border-slate-200/90 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-brand/35 hover:bg-white hover:shadow-glow-teal"
      : "rounded-xl border border-slate-200/90 bg-white py-3 text-center text-sm font-semibold text-slate-700 shadow-sm";

  const trialClass =
    layout === "row"
      ? "inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:scale-[1.02] hover:shadow-glow-accent"
      : "rounded-xl bg-gradient-brand py-3 text-center text-sm font-semibold text-white shadow-md";

  if (!isClerkActive) {
    return (
      <>
        <Link href="/sign-in" className={signInClass}>
          Sign In
        </Link>
        <Link href="/sign-up" className={`${trialClass} inline-flex justify-center`}>
          Start Free Trial <span aria-hidden>→</span>
        </Link>
      </>
    );
  }

  return (
    <>
      <SignedOut>
        <Link href="/sign-in" className={signInClass}>
          Sign In
        </Link>
        <Link href="/sign-up" className={`${trialClass} inline-flex justify-center`}>
          Start Free Trial <span aria-hidden>→</span>
        </Link>
      </SignedOut>
      <SignedIn>
        <Link href="/dashboard" className={`${trialClass} inline-flex justify-center`}>
          Dashboard <span aria-hidden>→</span>
        </Link>
      </SignedIn>
    </>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      <header
        className={`fixed top-0 z-[100] w-full border-b transition-colors duration-300 ${
          scrolled
            ? "border-slate-200/80 bg-white/95 shadow-[0_1px_0_0_rgba(59,130,246,0.05),0_8px_30px_-16px_rgba(20,184,166,0.08)] backdrop-blur-xl"
            : "border-transparent bg-white/65 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="group flex shrink-0 items-baseline gap-0.5 font-heading text-lg font-bold tracking-tight text-slate-900"
          >
            <span>Replyr</span>
            <span className="bg-gradient-to-r from-electric via-accent-cyan to-teal-brand bg-clip-text text-transparent">AI</span>
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-brand"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <AuthButtons layout="row" />
          </div>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[90] bg-white/98 pt-16 shadow-premium transition-[clip-path,opacity] duration-300 ease-out md:hidden ${
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          clipPath: mobileOpen ? "inset(0 0 0 0)" : "inset(0 0 100% 0)",
        }}
        aria-hidden={!mobileOpen}
      >
        <nav className="flex flex-col gap-1 px-6 py-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="border-b border-slate-100 py-4 text-lg font-medium text-slate-800"
              onClick={() => setMobileOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-6 flex flex-col gap-3" onClick={() => setMobileOpen(false)}>
            <AuthButtons layout="stack" />
          </div>
        </nav>
      </div>
    </>
  );
}
