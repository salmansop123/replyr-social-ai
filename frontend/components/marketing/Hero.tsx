"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { GradientAtmosphere } from "@/components/brand/GradientAtmosphere";
import { HeroPhoneMock } from "@/components/marketing/HeroPhoneMock";

function scrollToLiveDemo() {
  document.getElementById("live-demo")?.scrollIntoView({ behavior: "smooth" });
}

export function Hero() {
  const line1 = ["Your", "AI", "Handles"];
  const line2 = ["WhatsApp", "&", "Facebook"];
  const line3 = ["Like", "a", "Human."];

  return (
    <section className="relative overflow-hidden bg-gradient-hero pb-20 pt-28 sm:pb-28 sm:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-mesh-animated mesh-animated opacity-90" aria-hidden />
      <GradientAtmosphere variant="hero" />
      <div className="marketing-dot-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-hairline opacity-80" aria-hidden />

      <div className="relative z-[1] mx-auto grid max-w-6xl gap-12 px-4 sm:gap-16 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-electric/15 bg-gradient-to-r from-white via-electric-soft/40 to-wa-muted/50 px-4 py-1.5 text-xs font-medium text-slate-700 shadow-sm ring-1 ring-teal-brand/10">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse-badge rounded-full bg-wa opacity-75 motion-reduce:animate-none" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-wa" />
            </span>
            AI Replies in 30 seconds — Always Human
          </div>

          <h1 className="font-heading mt-8 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-[64px] lg:leading-[1.06]">
            <span className="block">
              {line1.map((w, i) => (
                <span
                  key={w}
                  className="mr-[0.2em] inline-block animate-hero-word opacity-0 motion-reduce:animate-none motion-reduce:opacity-100"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {w}
                </span>
              ))}
            </span>
            <span className="mt-1 block sm:mt-2">
              {line2.map((w, i) => (
                <span
                  key={`l2-${i}`}
                  className={`mr-[0.15em] inline-block animate-hero-word opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 ${
                    w === "WhatsApp" ? "text-wa-dark" : w === "Facebook" ? "text-fb" : "text-slate-800"
                  }`}
                  style={{ animationDelay: `${(3 + i) * 0.1}s` }}
                >
                  {w}
                </span>
              ))}
            </span>
            <span className="mt-1 block sm:mt-2">
              {line3.map((w, i) => (
                <span
                  key={`l3-${i}`}
                  className={`mr-[0.18em] inline-block animate-hero-word opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 ${
                    w === "Human."
                      ? "bg-gradient-to-r from-electric via-accent-cyan to-teal-brand bg-clip-text text-transparent"
                      : ""
                  }`}
                  style={{ animationDelay: `${(6 + i) * 0.1}s` }}
                >
                  {w}
                </span>
              ))}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 sm:text-xl">
            Replyr AI reads your posts, understands your products, and replies to every customer comment and message in
            your tone, in their language, 24 hours a day. No bots. No robotic replies. Just real conversations that
            convert.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-6 py-3.5 text-base font-semibold text-white shadow-md transition hover:scale-[1.02] hover:shadow-glow-accent"
            >
              Start Free No Card Needed
              <ArrowRight className="h-5 w-5" />
            </Link>
            <button
              type="button"
              onClick={scrollToLiveDemo}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white px-6 py-3.5 text-base font-semibold text-slate-700 shadow-sm transition hover:border-teal-brand/35 hover:bg-gradient-to-r hover:from-electric-soft/30 hover:via-white hover:to-wa-muted/50 hover:shadow-md"
            >
              <Play className="h-5 w-5 fill-electric text-electric" />
              Watch 2-min Demo
            </button>
          </div>

          <ul className="mt-8 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
            <li className="flex items-center gap-2">
              <span className="text-wa-dark">✓</span> Free 14-day trial
            </li>
            <li className="flex items-center gap-2">
              <span className="text-electric">✓</span> Cancel anytime
            </li>
            <li className="flex items-center gap-2">
              <span className="text-teal-brand">✓</span> Setup in 5 minutes
            </li>
          </ul>
        </div>

        <div className="relative flex flex-col items-center lg:items-end">
          <div className="animate-float-badge absolute -top-2 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-teal-brand/25 bg-white/95 px-3 py-1.5 text-xs font-semibold text-teal-700 shadow-md ring-1 ring-electric/10 backdrop-blur-sm motion-reduce:animate-none sm:right-8 lg:right-12">
            <span aria-hidden>⚡</span> Replied in 47 seconds
          </div>
          <HeroPhoneMock className="lg:max-w-[300px] lg:translate-x-0" />
          <p className="mt-4 text-center text-xs text-slate-500 lg:text-right">Real AI reply not a template</p>
        </div>
      </div>
    </section>
  );
}
