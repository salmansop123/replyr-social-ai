"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { BILLING_PLANS } from "@/lib/plans";

const PLAN_CTA: Record<string, { cta: string; href: string }> = {
  free: { cta: "Start Free →", href: "/sign-up" },
  starter: { cta: "Get Started →", href: "/sign-up" },
  professional: { cta: "Get Started →", href: "/sign-up" },
  enterprise: { cta: "Contact Sales →", href: "/contact" },
};

export function PricingSection() {
  return (
    <section id="pricing" className="relative scroll-mt-24 section-tint-green py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="font-heading text-center text-3xl font-bold text-slate-900 sm:text-4xl">Simple, honest pricing</h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-600">
            No setup fees. No hidden charges. Cancel anytime.
          </p>
        </ScrollReveal>

        <div className="mt-14 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {BILLING_PLANS.map((p, i) => {
            const link = PLAN_CTA[p.id];
            const highlight = !!p.popular;
            return (
              <ScrollReveal key={p.id} delayMs={i * 60}>
                <div
                  className={`relative flex h-full flex-col rounded-2xl border bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-premium ${
                    highlight
                      ? "border-teal-brand/25 ring-2 ring-electric/15 shadow-premium"
                      : "border-slate-200/80"
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-4 py-1 text-xs font-bold text-white shadow-md ring-1 ring-white/30">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-heading text-xl font-bold text-slate-900">{p.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{p.description}</p>
                  <p className="mt-6 text-sm text-slate-500">
                    {p.startingFrom && (
                      <span className="block text-xs uppercase tracking-wide">Starting from</span>
                    )}
                    <span className="font-heading text-4xl font-bold text-slate-900">{p.price}</span>
                    <span className="text-lg font-medium text-slate-500">{p.period}</span>
                  </p>
                  <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-600">
                    {p.highlights.map((f, fi) => (
                      <li key={f} className="flex gap-2">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${fi % 2 === 0 ? "text-teal-brand" : "text-electric"}`}
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={link.href}
                    className={`mt-8 inline-flex items-center justify-center rounded-xl py-3 text-sm font-semibold transition ${
                      highlight
                        ? "bg-gradient-brand text-white shadow-md hover:scale-[1.02] hover:shadow-glow-accent"
                        : "border border-slate-200/90 bg-white text-slate-800 hover:border-teal-brand/30 hover:bg-electric-soft/40"
                    }`}
                  >
                    {link.cta}
                  </Link>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500">
          🔒 All plans include a 14-day free trial.
        </p>
      </div>
    </section>
  );
}
