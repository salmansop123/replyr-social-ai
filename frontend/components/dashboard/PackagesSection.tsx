"use client";

import { Check } from "lucide-react";
import { BILLING_PLANS, PLAN_ORDER, stripePriceIdForPlan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PackagesSectionProps = {
  currentPlan: string;
  onSubscribe: (priceId: string, planName?: string) => void;
  onPortal: () => void;
  previewMode?: boolean;
  checkoutPending?: boolean;
  portalPending?: boolean;
};

export function PackagesSection({
  currentPlan,
  onSubscribe,
  onPortal,
  previewMode = false,
  checkoutPending = false,
  portalPending = false,
}: PackagesSectionProps) {
  const normalized = (currentPlan || "free").toLowerCase();
  const currentTier = PLAN_ORDER[normalized] ?? 0;

  return (
    <section id="packages" className="scroll-mt-6">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wider text-electric">Our packages</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Simple plans for multi-channel scale
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
          Every tier includes WhatsApp Business and Facebook Pages. Upgrade anytime downgrades are managed in the
          billing portal.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {BILLING_PLANS.map((plan) => {
          const isCurrent = normalized === plan.id;
          const planTier = plan.tier;
          const isHigher = planTier > currentTier;
          const isLower = planTier < currentTier && normalized !== "free";
          const priceId = plan.id === "free" ? undefined : stripePriceIdForPlan(plan.id);
          const canCheckout =
            plan.id !== "free" && plan.id !== "enterprise" && (previewMode || !!priceId);

          return (
            <article
              key={plan.id}
              className={cn(
                "glass-card relative flex flex-col p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lift sm:p-7",
                plan.popular && "ring-2 ring-electric/35 shadow-glow",
                isCurrent && "ring-2 ring-slate-400/50",
              )}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-electric to-accent-cyan px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                  Most popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 rounded-full bg-slate-800 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  Your plan
                </span>
              )}

              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <p className="mt-3 text-3xl font-bold tabular-nums text-slate-900">{plan.price}</p>
              <p className="text-xs font-medium text-slate-500">{plan.period}</p>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-600">
                {plan.highlights.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <details className="mt-4 border-t border-slate-200/80 pt-3 text-xs text-slate-500">
                <summary className="cursor-pointer font-semibold text-slate-600 hover:text-slate-900">
                  All features
                </summary>
                <ul className="mt-2 space-y-1">
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </details>

              <div className="mt-6">
                {plan.id === "enterprise" ? (
                  <a
                    href="mailto:billing@replyr.ai"
                    className={cn(
                      "inline-flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold transition",
                      plan.popular ? "btn-primary" : "btn-secondary",
                    )}
                  >
                    Use This Plan
                  </a>
                ) : plan.id === "free" ? (
                  isCurrent ? (
                    <Button variant="secondary" className="w-full" disabled>
                      Use This Plan
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={portalPending}
                      onClick={() => onPortal()}
                    >
                      Use This Plan
                    </Button>
                  )
                ) : isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Use This Plan
                  </Button>
                ) : isLower ? (
                  <button
                    type="button"
                    className="w-full text-center text-xs font-semibold text-slate-500 underline-offset-2 hover:underline disabled:opacity-50"
                    disabled={portalPending}
                    onClick={() => onPortal()}
                  >
                    Use This Plan
                  </button>
                ) : isHigher || normalized === "free" ? (
                  <Button
                    className={cn("w-full", plan.popular ? "btn-primary !bg-electric hover:opacity-90" : "")}
                    disabled={checkoutPending || !canCheckout}
                    onClick={() => onSubscribe(priceId ?? "", plan.name)}
                  >
                    {normalized === "free" ? `Get ${plan.name}` : `Upgrade to ${plan.name}`}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full"
                    disabled={checkoutPending || !canCheckout}
                    onClick={() => onSubscribe(priceId ?? "", plan.name)}
                  >
                    Switch to {plan.name}
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
