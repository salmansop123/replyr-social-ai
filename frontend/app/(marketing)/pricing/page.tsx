import Link from "next/link";
import { BILLING_PLANS } from "@/lib/plans";

const plans = BILLING_PLANS.filter((p) => p.id !== "free").map((p) => ({
  name: p.name,
  price: p.price,
  replies: p.highlights[0] ?? "",
  extra: p.highlights[1] ?? "",
  popular: p.popular,
}));

export default function PricingPage() {
  return (
    <div className="pt-24">
      <main className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 sm:pb-24">
        <p className="text-sm font-semibold uppercase tracking-wider text-electric">Pricing</p>
        <h1 className="font-heading mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Simple plans for multi-channel scale
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">
          Every tier includes WhatsApp Business and Facebook Pages — upgrade when your volume grows.
        </p>

        <div className="mt-14 grid gap-8 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-premium ${
                p.popular ? "border-electric/30 ring-2 ring-electric/20" : "border-slate-200/80"
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
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-fb" />
                  {p.extra}
                </li>
              </ul>
              <Link
                href="/sign-up"
                className={`mt-10 block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  p.popular
                    ? "bg-gradient-to-r from-electric to-accent-cyan text-white shadow-md hover:scale-[1.02] hover:shadow-premium"
                    : "border border-slate-200/90 bg-white text-slate-800 hover:border-electric/35"
                }`}
              >
                Choose {p.name}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-slate-500">
          <Link href="/#pricing" className="text-electric hover:underline">
            View marketing overview →
          </Link>
        </p>
      </main>
    </div>
  );
}
