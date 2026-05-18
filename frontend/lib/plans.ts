/** Shared Replyr plan definitions (marketing + dashboard billing). */

export type PlanId = "free" | "starter" | "professional" | "enterprise";

export type BillingPlan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  tier: number;
  popular?: boolean;
  /** Short bullets shown on package cards */
  highlights: string[];
  /** Full feature list for billing comparison */
  features: string[];
  stripePriceEnvKey?: string;
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "to get started",
    tier: 0,
    highlights: ["500 AI replies / month", "Up to 3 connected accounts", "WhatsApp + Facebook"],
    features: [
      "500 AI replies / month",
      "3 connected accounts",
      "1 team member",
      "WhatsApp + Facebook",
      "Community support",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$29",
    period: "per month",
    tier: 1,
    highlights: [
      "500 AI replies / month",
      "1 WhatsApp + Facebook channel bundle",
      "Email support",
    ],
    features: [
      "500 AI replies / month",
      "3 connected accounts",
      "1 team member",
      "Email support",
      "WhatsApp + Facebook",
    ],
    stripePriceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_STARTER",
  },
  {
    id: "professional",
    name: "Professional",
    price: "$79",
    period: "per month",
    tier: 2,
    popular: true,
    highlights: [
      "5,000 AI replies / month",
      "Up to 3 connected channels (WhatsApp / Facebook mix)",
      "Priority support",
    ],
    features: [
      "5,000 AI replies / month",
      "10 connected accounts",
      "5 team members",
      "Priority support",
      "WhatsApp + Facebook",
    ],
    stripePriceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$199",
    period: "per month",
    tier: 3,
    highlights: ["Unlimited AI replies", "Unlimited channels & priority support", "API access"],
    features: [
      "Unlimited AI replies",
      "Unlimited accounts",
      "Unlimited team members",
      "Dedicated support",
      "All channels + API access",
    ],
    stripePriceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE",
  },
];

export const PLAN_ORDER: Record<string, number> = {
  free: 0,
  starter: 1,
  professional: 2,
  enterprise: 3,
};

export function stripePriceIdForPlan(planId: PlanId): string | undefined {
  const plan = BILLING_PLANS.find((p) => p.id === planId);
  if (!plan?.stripePriceEnvKey) return undefined;
  const key = plan.stripePriceEnvKey as keyof typeof process.env;
  return process.env[key];
}

export function planBadgeClass(plan: string) {
  switch (plan) {
    case "starter":
      return "bg-blue-100 text-blue-900 ring-blue-200/80";
    case "professional":
      return "bg-violet-100 text-violet-900 ring-violet-200/80";
    case "enterprise":
      return "bg-amber-100 text-amber-950 ring-amber-300/80";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200/80";
  }
}
