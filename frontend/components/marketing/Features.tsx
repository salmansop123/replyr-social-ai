"use client";

import Link from "next/link";
import { Bot, Globe, Zap, Clock, UserRound, BarChart3 } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const cards = [
  {
    icon: Bot,
    title: "Sounds Human",
    body: "AI replies in 1–3 short sentences that match your brand voice. No canned scripts every thread feels like your best teammate wrote it.",
  },
  {
    icon: Globe,
    title: "Any Language",
    body: "Auto-detects the customer’s language and replies in kind. Arabic, Urdu, English, Spanish, and dozens more — without flipping a switch.",
  },
  {
    icon: Zap,
    title: "Instant",
    body: "Responds in under 60 seconds on average. Your customers get answers while they’re still ready to buy not hours later.",
  },
  {
    icon: Clock,
    title: "24/7 Coverage",
    body: "Never miss a message, even at 3am or on public holidays. Replyr keeps every inbox warm when your team is offline.",
  },
  {
    icon: UserRound,
    title: "Human Takeover",
    body: "Jump in and take control of any conversation in one click. Pause the AI, reply yourself, and hand it back when you’re done.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    body: "See replies, leads, and trends live in one dashboard. Know what’s converting and where customers stall without spreadsheets.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative section-tint-mixed py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 bg-mesh-light opacity-70" aria-hidden />
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="font-heading text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            Everything your business <span className="heading-accent">needs</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-slate-600">Built for real businesses, not demos.</p>
        </ScrollReveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => (
            <ScrollReveal key={c.title} delayMs={i * 40}>
              <div className="group flex h-full flex-col rounded-2xl border border-white/80 bg-white/90 p-6 shadow-sm ring-1 ring-electric/5 backdrop-blur-sm transition duration-200 ease-out hover:-translate-y-1 hover:border-teal-brand/30 hover:shadow-glow-accent hover:ring-electric/15 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-electric-soft/90 via-white to-teal-muted/60 ring-1 ring-teal-brand/12 shadow-inner transition group-hover:ring-electric/20">
                  <c.icon
                    className={`h-7 w-7 ${i % 3 === 0 ? "text-electric" : i % 3 === 1 ? "text-wa-dark" : "text-teal-brand"}`}
                  />
                </span>
                <h3 className="font-heading mt-4 text-lg font-bold text-slate-900">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{c.body}</p>
                <Link
                  href="/sign-up"
                  className="mt-4 text-sm font-semibold text-teal-brand transition hover:text-electric hover:underline"
                >
                  Learn more →
                </Link>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <div className="mt-20 grid items-center gap-10 lg:grid-cols-2">
          <ScrollReveal>
            <h3 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              Trains on YOUR business, not generic data
            </h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              Unlike generic chatbots, Replyr AI learns your specific products, prices, promotions, and communication style.
              It knows that your Lavender soap is $12, ships free over $50, and is best for sensitive skin because you
              told it so. Every reply is uniquely yours.
            </p>
          </ScrollReveal>
          <ScrollReveal delayMs={60}>
            <div className="glass-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI knowledge base</p>
              <div className="mt-3 min-h-[100px] rounded-xl border border-teal-brand/10 bg-gradient-to-br from-slate-50/90 to-electric-soft/40 p-3 shadow-inner">
                <p className="marketing-kb-line text-sm text-slate-600">
                  Products: Lavender Soap $12 (sensitive/dry). Charcoal Detox $14 (oily skin). Promos: HELLO10 first order.
                  Shipping free over $50…
                </p>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="mt-20 grid items-center gap-10 lg:grid-cols-2">
          <ScrollReveal>
            <div className="order-2 glass-card p-6 lg:order-1">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-inner">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Human takeover</p>
                  <p className="text-xs text-slate-500">AI paused you’re in control</p>
                </div>
                <div className="marketing-toggle relative h-8 w-14 rounded-full p-1" aria-hidden>
                  <span className="marketing-toggle-knob absolute left-1 top-1 h-6 w-6 rounded-full bg-white shadow" />
                </div>
              </div>
              <div className="mt-4 space-y-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
                  Can you apply the discount manually?
                </div>
                <div className="rounded-lg border border-accent-cyan/20 bg-accent-cyan/10 px-3 py-2 text-xs font-medium text-cyan-800">
                  You’re typing as the business…
                </div>
             </div>
            </div>
          </ScrollReveal>
          <ScrollReveal delayMs={60} className="order-1 lg:order-2">
            <h3 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              Human takeover always in control
            </h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              See a conversation that needs a personal touch? One click pauses the AI and lets you type directly. The AI
              resumes when you&apos;re done, or stays paused until you re-enable it. You&apos;re always in command.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
