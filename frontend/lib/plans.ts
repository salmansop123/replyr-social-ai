/** Shared Replyr plan definitions (marketing + dashboard billing). */

export type PlanId = "free" | "starter" | "professional" | "enterprise";

export type BillingPlan = {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  description?: string;
  startingFrom?: boolean;
  tier: number;
  popular?: boolean;
  /** Bullets shown on package / pricing cards */
  highlights: string[];
  stripePriceEnvKey?: string;
};

export const BILLING_PLANS: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "/month",
    description: "To get started",
    tier: 0,
    highlights: [
      "500 AI replies per month",
      "Up to 3 connected accounts",
      "WhatsApp + Facebook",
      "Real-time AI auto replies",
      "Unified inbox dashboard",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "$19",
    period: "/month",
    description: "For small businesses getting started",
    tier: 1,
    highlights: [
      "500 AI replies per month",
      "WhatsApp integration",
      "Facebook integration",
      "Real-time AI auto replies",
      "Unified inbox dashboard",
      "Basic analytics",
    ],
    stripePriceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_STARTER",
  },
  {
    id: "professional",
    name: "Professional",
    price: "$59",
    period: "/month",
    description: "For growing businesses",
    tier: 2,
    popular: true,
    highlights: [
      "Everything in Starter, plus:",
      "5,000 AI replies per month",
      "AI lead collection",
      "Advanced analytics dashboard",
      "Multi-language AI replies",
    ],
    stripePriceEnvKey: "NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$149",
    period: "/month",
    description: "For established businesses",
    startingFrom: true,
    tier: 3,
    highlights: [
      "Everything in Professional, plus:",
      "Unlimited AI replies",
      "Custom AI business training",
      "Custom automation workflows",
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
