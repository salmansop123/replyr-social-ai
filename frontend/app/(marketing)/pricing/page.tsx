import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

const plans = [
  {
    name: "Starter",
    price: "$29",
    replies: "500 AI replies / month",
    extra: "1 WhatsApp Business number",
  },
  {
    name: "Professional",
    price: "$79",
    replies: "5,000 AI replies / month",
    extra: "Up to 3 WhatsApp numbers",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$199",
    replies: "Unlimited AI replies",
    extra: "Unlimited WhatsApp numbers & priority support",
  },
];

export default function PricingPage() {
  return (
    <div className="mesh-page noise-overlay min-h-screen text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-electric">Pricing</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">Simple plans for WhatsApp scale</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">Every tier is WhatsApp-first — upgrade when your volume grows.</p>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`glass-card relative flex flex-col p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${
                p.popular ? "ring-2 ring-electric/30 shadow-glow" : ""
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-gradient-to-r from-electric to-accent-cyan px-3 py-1 text-xs font-bold text-white shadow-md">
                  Most popular
                </span>
              )}
              <h2 className="text-xl font-semibold text-slate-900">{p.name}</h2>
              <p className="mt-4 text-4xl font-bold text-slate-900">{p.price}</p>
              <p className="text-sm text-slate-500">per month</p>
              <ul className="mt-8 flex-1 space-y-3 text-sm text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-wa" />
                  {p.replies}
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-violet" />
                  {p.extra}
                </li>
              </ul>
              <Link
                href="/sign-up"
                className={`mt-10 block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  p.popular ? "btn-primary" : "btn-secondary"
                }`}
              >
                Choose {p.name}
              </Link>
            </div>
          ))}
        </div>
      </main>
      <MarketingFooter />
    </div>
  );
}
