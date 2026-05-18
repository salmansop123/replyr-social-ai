"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const plans = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    desc: "For small businesses getting started",
    features: [
      "500 AI replies per month",
      "WhatsApp + Facebook",
      "3 social accounts",
      "1 team member",
      "Email support",
      "Analytics dashboard",
    ],
    cta: "Get Started →",
    href: "/sign-up",
    highlight: false,
  },
  {
    name: "Professional",
    price: "$79",
    period: "/month",
    desc: "For growing businesses",
    badge: "Most Popular",
    features: [
      "Everything in Starter, plus:",
      "5,000 AI replies per month",
      "10 social accounts",
      "5 team members",
      "Priority support",
      "Human takeover mode",
      "Escalation rules",
    ],
    cta: "Start Free Trial →",
    href: "/sign-up",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    period: "/month",
    desc: "For established businesses",
    features: [
      "Everything in Professional, plus:",
      "Unlimited AI replies",
      "Unlimited accounts",
      "Unlimited team members",
      "Dedicated support",
      "Custom AI training",
      "API access",
    ],
    cta: "Contact Sales →",
    href: "/contact",
    highlight: false,
  },
];

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

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((p, i) => (
            <ScrollReveal key={p.name} delayMs={i * 60}>
              <div
                className={`relative flex h-full flex-col rounded-2xl border bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:shadow-premium ${
                  p.highlight
                    ? "border-teal-brand/25 ring-2 ring-electric/15 shadow-premium"
                    : "border-slate-200/80"
                }`}
              >
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-4 py-1 text-xs font-bold text-white shadow-md ring-1 ring-white/30">
                    {p.badge}
                  </span>
                )}
                <h3 className="font-heading text-xl font-bold text-slate-900">{p.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{p.desc}</p>
                <p className="mt-6 font-heading text-4xl font-bold text-slate-900">
                  {p.price}
                  <span className="text-lg font-medium text-slate-500">{p.period}</span>
                </p>
                <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-600">
                  {p.features.map((f, fi) => (
                    <li key={f} className="flex gap-2">
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 ${fi % 2 === 0 ? "text-teal-brand" : "text-electric"}`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={`mt-8 inline-flex items-center justify-center rounded-xl py-3 text-sm font-semibold transition ${
                    p.highlight
                      ? "bg-gradient-brand text-white shadow-md hover:scale-[1.02] hover:shadow-glow-accent"
                      : "border border-slate-200/90 bg-white text-slate-800 hover:border-teal-brand/30 hover:bg-electric-soft/40"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-slate-500">
          🔒 All plans include a 14-day free trial. No credit card required to start.
        </p>
      </div>
    </section>
  );
}
