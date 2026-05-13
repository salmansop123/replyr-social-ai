import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";

const features = [
  {
    title: "Human-grade replies",
    body: "Short, warm responses tuned to your business — so every WhatsApp thread feels personal, not robotic.",
    accent: "from-electric/20 to-accent-cyan/20",
  },
  {
    title: "Built for WhatsApp Business",
    body: "Designed around WhatsApp Cloud API flows: inbound messages, smart delays, and operator takeover when you need control.",
    accent: "from-wa/25 to-wa-dark/20",
  },
  {
    title: "Automation you can trust",
    body: "Guardrails, tone controls, and clear visibility into what the AI sent — enterprise-ready from day one.",
    accent: "from-accent-violet/20 to-electric/15",
  },
];

export default function LandingPage() {
  return (
    <div className="mesh-page noise-overlay min-h-screen text-slate-900">
      <MarketingHeader />

      <main>
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-20 lg:pt-28">
          <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-accent-cyan/25 blur-3xl animate-pulse-soft" />
          <div className="pointer-events-none absolute -right-24 top-40 h-80 w-80 rounded-full bg-accent-violet/20 blur-3xl animate-pulse-soft" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-[120%] -translate-x-1/2 bg-gradient-to-t from-wa/10 to-transparent blur-2xl" />

          <div className="relative mx-auto max-w-6xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm backdrop-blur">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wa text-white">
                <WhatsAppGlyph className="h-3.5 w-3.5" />
              </span>
              WhatsApp-first AI automation
            </div>

            <h1 className="mt-8 max-w-4xl text-balance text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.08]">
              The modern way to run{" "}
              <span className="bg-gradient-to-r from-electric via-accent-cyan to-wa bg-clip-text text-transparent">WhatsApp</span>{" "}
              at scale — with AI that sounds unmistakably human.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              Replyr AI helps your team respond faster on WhatsApp Business: intelligent drafts, on-brand tone, smart
              pacing, and instant handoff when a human should take over.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link href="/sign-up" className="btn-primary px-8 py-3.5 text-base">
                Start your free trial
              </Link>
              <Link href="/#workflow" className="btn-secondary px-8 py-3.5 text-base">
                See how it works
              </Link>
            </div>

            <div className="mt-16 grid gap-4 sm:grid-cols-3">
              {[
                { k: "Median first reply", v: "~30s", s: "with AI assist" },
                { k: "Always on", v: "24/7", s: "coverage for inbound chats" },
                { k: "Built for teams", v: "Takeover", s: "human-in-the-loop ready" },
              ].map((stat) => (
                <div
                  key={stat.k}
                  className="glass-card group p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
                >
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.k}</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{stat.v}</p>
                  <p className="mt-1 text-sm text-slate-600">{stat.s}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-white/50 bg-white/40 py-20 backdrop-blur-sm sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Everything you need for WhatsApp excellence</h2>
              <p className="mt-4 text-lg text-slate-600">
                A focused product surface: fewer distractions, faster iteration, and a premium experience your customers feel in every message.
              </p>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {features.map((f) => (
                <div
                  key={f.title}
                  className={`glass-card relative overflow-hidden p-8 transition-all duration-500 hover:shadow-lift`}
                >
                  <div className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${f.accent} blur-2xl`} />
                  <h3 className="relative text-lg font-semibold text-slate-900">{f.title}</h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-slate-600">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="px-4 py-20 sm:px-6 sm:py-24">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">From first ping to resolved — beautifully orchestrated</h2>
              <ol className="mt-10 space-y-6">
                {[
                  "Connect WhatsApp Business in minutes.",
                  "Teach Replyr your voice, policies, and FAQs.",
                  "Let AI handle the busywork — you stay in control with takeover and audit trails.",
                ].map((step, i) => (
                  <li key={step} className="flex gap-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-electric to-accent-violet text-sm font-bold text-white shadow-glow">
                      {i + 1}
                    </span>
                    <p className="text-base leading-relaxed text-slate-600">{step}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-10">
                <Link href="/sign-up" className="btn-primary px-7 py-3">
                  Get started
                </Link>
              </div>
            </div>

            <div className="glass-card relative overflow-hidden p-6 sm:p-8">
              <div className="absolute inset-0 bg-gradient-to-br from-wa/10 via-transparent to-accent-violet/10" />
              <div className="relative space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live preview</p>
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 shadow-inner">
                  <div className="flex items-center gap-2 border-b border-slate-200/80 pb-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-wa text-white">
                      <WhatsAppGlyph className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">WhatsApp Business</p>
                      <p className="text-xs text-emerald-700">online</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white px-4 py-2.5 text-sm text-slate-800 shadow-sm ring-1 ring-slate-200/80">
                      Hi! Do you offer same-day delivery for orders placed before 2pm?
                    </div>
                    <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-wa-muted to-white px-4 py-2.5 text-sm text-slate-900 shadow-sm ring-1 ring-wa/25">
                      Yes — if you order before 2pm local time, we ship the same day. Want me to check your postcode?
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-slate-500">Illustrative UI — your branding and tone apply everywhere.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/50 bg-gradient-to-br from-electric/10 via-white to-accent-violet/10 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 sm:text-4xl">Ready to elevate your WhatsApp experience?</h2>
            <p className="mt-4 text-lg text-slate-600">Join teams using Replyr AI to respond faster without sounding automated.</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className="btn-primary px-10 py-3.5 text-base">
                Create your account
              </Link>
              <Link href="/contact" className="btn-secondary px-10 py-3.5 text-base">
                Talk to sales
              </Link>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
