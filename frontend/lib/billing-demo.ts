/** Sample billing data for UI preview when the API is offline or NEXT_PUBLIC_BILLING_DEMO=true */

export type BillingSubscription = {
  plan: string;
  status: string;
  current_period_end: string | null;
  stripe_subscription_id: string | null;
  ai_replies_used_this_month: number;
  ai_replies_limit: number;
  connected_accounts: number;
  accounts_limit: number;
  usage_resets_at: string;
};

export type BillingInvoice = {
  id: string;
  date: string;
  description: string;
  amount: string;
  status: string;
  pdf_url: string | null;
};

export function isBillingDemoMode(): boolean {
  const flag = process.env.NEXT_PUBLIC_BILLING_DEMO;
  if (flag === "false") return false;
  if (flag === "true") return true;
  // Dev default: full billing UI without backend (set NEXT_PUBLIC_BILLING_DEMO=false to hit API)
  return process.env.NODE_ENV === "development";
}

function firstOfNextMonthIso(): string {
  const now = new Date();
  const next = now.getMonth() === 11
    ? new Date(now.getFullYear() + 1, 0, 1)
    : new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toISOString();
}

function periodEndIso(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  d.setDate(15);
  return d.toISOString();
}

/** Rich preview: Professional plan with realistic usage */
export const DEMO_SUBSCRIPTION: BillingSubscription = {
  plan: "professional",
  status: "active",
  current_period_end: periodEndIso(),
  stripe_subscription_id: "sub_preview",
  ai_replies_used_this_month: 1247,
  ai_replies_limit: 5000,
  connected_accounts: 2,
  accounts_limit: 10,
  usage_resets_at: firstOfNextMonthIso(),
};

export const DEMO_INVOICES: BillingInvoice[] = [
  {
    id: "inv_preview_1",
    date: "Apr 1, 2026",
    description: "Professional plan — monthly",
    amount: "$59.00",
    status: "Paid",
    pdf_url: null,
  },
  {
    id: "inv_preview_2",
    date: "Mar 1, 2026",
    description: "Professional plan — monthly",
    amount: "$59.00",
    status: "Paid",
    pdf_url: null,
  },
  {
    id: "inv_preview_3",
    date: "Feb 1, 2026",
    description: "Starter plan — monthly",
    amount: "$19.00",
    status: "Paid",
    pdf_url: null,
  },
];

export function previewCheckoutToast(planLabel?: string) {
  return {
    title: "Preview mode",
    description: planLabel
      ? `“Upgrade to ${planLabel}” will open Stripe Checkout once the billing API is connected.`
      : "Stripe billing will connect when the API is live.",
  };
}
