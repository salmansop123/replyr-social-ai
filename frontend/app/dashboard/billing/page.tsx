"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Download, ExternalLink, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PackagesSection } from "@/components/dashboard/PackagesSection";
import { UsageQuotaBanner } from "@/components/dashboard/UsageQuotaBanner";
import {
  DEMO_INVOICES,
  DEMO_SUBSCRIPTION,
  isBillingDemoMode,
  previewCheckoutToast,
  type BillingInvoice,
  type BillingSubscription,
} from "@/lib/billing-demo";
import { useApi } from "@/lib/api";
import { planBadgeClass } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function statusChipClass(status: string) {
  switch (status) {
    case "active":
    case "trialing":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
    case "past_due":
      return "bg-amber-50 text-amber-900 ring-amber-200/80";
    case "cancelled":
      return "bg-red-50 text-red-800 ring-red-200/80";
    default:
      return "bg-slate-100 text-slate-600 ring-slate-200/80";
  }
}

function usagePercent(used: number, limit: number) {
  if (limit < 0) return 0;
  if (limit === 0) return 100;
  return (used / limit) * 100;
}

function progressIndicatorClass(pct: number, unlimited: boolean) {
  if (unlimited) return "bg-emerald-500";
  if (pct >= 90) return "bg-red-500";
  if (pct >= 70) return "bg-amber-500";
  return "bg-emerald-500";
}

function formatPlanTitle(plan: string) {
  return `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`;
}

function formatRenewal(iso: string | null, plan: string) {
  if (plan === "free" || !iso) return "No renewal date";
  try {
    return `Renews on ${new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    })}`;
  } catch {
    return "No renewal date";
  }
}

function formatResetDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "the first of next month";
  }
}

function formatUsage(used: number, limit: number) {
  if (limit < 0) return `${used.toLocaleString()} / Unlimited`;
  return `${used.toLocaleString()} / ${limit.toLocaleString()}`;
}

async function fetchSubscription(api: ReturnType<typeof useApi>): Promise<{
  data: BillingSubscription;
  preview: boolean;
}> {
  if (isBillingDemoMode()) {
    return { data: DEMO_SUBSCRIPTION, preview: true };
  }
  const res = await api.get<BillingSubscription>("/billing/subscription");
  return { data: res.data, preview: false };
}

async function fetchInvoices(
  api: ReturnType<typeof useApi>,
  preview: boolean,
): Promise<BillingInvoice[]> {
  if (preview || isBillingDemoMode()) {
    return DEMO_INVOICES;
  }
  const res = await api.get<BillingInvoice[]>("/billing/invoices");
  return res.data;
}

export default function BillingPage() {
  const api = useApi();
  const [dangerOpen, setDangerOpen] = useState(false);
  const demoForced = isBillingDemoMode();

  const subscription = useQuery({
    queryKey: ["billing", "subscription", demoForced],
    queryFn: () => fetchSubscription(api),
    retry: false,
    staleTime: demoForced ? Infinity : 30_000,
  });

  const isPreview = subscription.data?.preview ?? demoForced;
  const sub = subscription.data?.data;

  const invoices = useQuery({
    queryKey: ["billing", "invoices", isPreview],
    queryFn: () => fetchInvoices(api, isPreview),
    retry: false,
    enabled: !!sub,
    staleTime: isPreview ? Infinity : 30_000,
  });

  const openPortal = useMutation({
    mutationFn: async () => {
      const res = await api.get<{ portal_url: string }>("/billing/portal");
      return res.data.portal_url;
    },
    onMutate: () => toast.message("Redirecting to Stripe…"),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const createCheckout = useMutation({
    mutationFn: async (priceId: string) => {
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const res = await api.post<{ checkout_url: string }>("/billing/create-checkout", {
        price_id: priceId,
        success_url: `${origin}/dashboard/billing?success=1`,
        cancel_url: `${origin}/dashboard/billing?canceled=1`,
      });
      return res.data.checkout_url;
    },
    onMutate: () => toast.message("Redirecting to Stripe…"),
    onSuccess: (url) => {
      window.location.href = url;
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const currentPlan = sub?.plan ?? "free";

  const repliesPct = useMemo(
    () => (sub ? usagePercent(sub.ai_replies_used_this_month, sub.ai_replies_limit) : 0),
    [sub],
  );
  const accountsPct = useMemo(
    () => (sub ? usagePercent(sub.connected_accounts, sub.accounts_limit) : 0),
    [sub],
  );
  const repliesUnlimited = (sub?.ai_replies_limit ?? 0) < 0;
  const accountsUnlimited = (sub?.accounts_limit ?? 0) < 0;

  const handlePortal = () => {
    if (isPreview) {
      const t = previewCheckoutToast();
      toast.info(t.title, { description: t.description });
      return;
    }
    openPortal.mutate();
  };

  const handleSubscribe = (priceId: string, planName?: string) => {
    if (isPreview) {
      const t = previewCheckoutToast(planName);
      toast.info(t.title, { description: t.description });
      return;
    }
    if (!priceId) {
      toast.error("Stripe price ID is not configured for this plan.");
      return;
    }
    createCheckout.mutate(priceId);
  };

  const showDetailsSkeleton = subscription.isLoading && !demoForced;

  return (
    <div className="space-y-10 pb-12">
      <UsageQuotaBanner />
      {isPreview && (
        <div className="flex items-start gap-3 rounded-xl border border-sky-200/90 bg-sky-50/90 px-4 py-3 text-sm text-sky-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" aria-hidden />
          <p>
            <span className="font-semibold">Preview mode.</span>{" "}
            Sample subscription and invoices are shown so you can review the billing tab. Live data will load from the
            API when it is connected{demoForced ? " (set NEXT_PUBLIC_BILLING_DEMO=false to try the API)" : ""}.
          </p>
        </div>
      )}

      <PackagesSection
        currentPlan={currentPlan}
        previewMode={isPreview}
        onSubscribe={(priceId, planName) => handleSubscribe(priceId, planName)}
        onPortal={handlePortal}
        checkoutPending={createCheckout.isPending}
        portalPending={openPortal.isPending}
      />

      {showDetailsSkeleton && <BillingDetailsSkeleton />}

      {sub && !showDetailsSkeleton && (
        <>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your subscription</h2>
            <p className="mt-1 text-sm text-slate-600">Current plan, usage, invoices, and billing actions.</p>
          </div>

          <Card className="overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1",
                        planBadgeClass(sub.plan),
                      )}
                    >
                      {sub.plan}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold capitalize ring-1",
                        statusChipClass(sub.status),
                      )}
                    >
                      {sub.status === "trialing" ? "Trialing" : sub.status.replace("_", " ")}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">{formatPlanTitle(sub.plan)}</h3>
                  {sub.status === "past_due" && (
                    <p className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm font-medium text-red-900">
                      Payment failed — update your card to keep AI replies active.
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <p className="text-sm text-slate-600">{formatRenewal(sub.current_period_end, sub.plan)}</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" disabled={openPortal.isPending} onClick={handlePortal}>
                      Manage Billing
                    </Button>
                    <Button disabled={openPortal.isPending} onClick={handlePortal}>
                      Update Card
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>AI Replies This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold tabular-nums text-slate-900">
                  {formatUsage(sub.ai_replies_used_this_month, sub.ai_replies_limit)}
                </p>
                <Progress
                  value={repliesUnlimited ? 100 : repliesPct}
                  indicatorClassName={progressIndicatorClass(repliesPct, repliesUnlimited)}
                />
                {repliesUnlimited ? (
                  <p className="text-xs font-semibold text-emerald-700">Unlimited</p>
                ) : null}
                <p className="text-xs text-slate-500">Resets on {formatResetDate(sub.usage_resets_at)}</p>
                {!repliesUnlimited && repliesPct >= 90 && (
                  <p className="rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-xs text-amber-950">
                    You&apos;re almost at your limit. Pick a higher package above to avoid interruptions.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connected Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold tabular-nums text-slate-900">
                  {formatUsage(sub.connected_accounts, sub.accounts_limit)}
                </p>
                <Progress
                  value={accountsUnlimited ? 100 : accountsPct}
                  indicatorClassName={progressIndicatorClass(accountsPct, accountsUnlimited)}
                />
                {accountsUnlimited ? (
                  <p className="text-xs font-semibold text-emerald-700">Unlimited</p>
                ) : (
                  <p className="text-xs text-slate-500">
                    {sub.plan === "free" || sub.plan === "starter"
                      ? "Up to 3 accounts on Free & Starter"
                      : sub.plan === "professional"
                        ? "Up to 10 accounts on Professional"
                        : "Account limit for your plan"}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>Recent Invoices</CardTitle>
                <CardDescription>Download PDFs or manage billing in Stripe.</CardDescription>
              </div>
              <Button variant="ghost" size="sm" disabled={openPortal.isPending} onClick={handlePortal}>
                View All Invoices
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {invoices.isLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}
              {!invoices.isLoading && (invoices.data?.length ?? 0) === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  No invoices yet. They&apos;ll appear here after your first payment.
                </p>
              )}
              {!invoices.isLoading && (invoices.data?.length ?? 0) > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="pb-3 pr-4">Date</th>
                        <th className="pb-3 pr-4">Description</th>
                        <th className="pb-3 pr-4">Amount</th>
                        <th className="pb-3 pr-4">Status</th>
                        <th className="pb-3">Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.data!.map((inv) => (
                        <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4 text-slate-700">{inv.date || "—"}</td>
                          <td className="py-3 pr-4 text-slate-900">{inv.description}</td>
                          <td className="py-3 pr-4 font-medium">{inv.amount}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-xs font-semibold",
                                inv.status.toLowerCase() === "paid"
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "bg-slate-100 text-slate-600",
                              )}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3">
                            {inv.pdf_url ? (
                              <a
                                href={inv.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg bg-electric/10 px-2.5 py-1 text-xs font-bold text-electric hover:bg-electric/15"
                              >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </a>
                            ) : isPreview ? (
                              <span className="text-slate-400">Preview</span>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200/60">
            <button
              type="button"
              className="flex w-full items-center justify-between px-6 py-4 text-left"
              onClick={() => setDangerOpen((v) => !v)}
            >
              <span className="text-sm font-bold text-red-900">Danger Zone</span>
              {dangerOpen ? (
                <ChevronDown className="h-4 w-4 text-red-800" />
              ) : (
                <ChevronRight className="h-4 w-4 text-red-800" />
              )}
            </button>
            {dangerOpen && (
              <CardContent className="border-t border-red-100 pt-4">
                <Button variant="destructive" disabled={openPortal.isPending} onClick={handlePortal}>
                  Cancel Subscription
                </Button>
                <p className="mt-3 text-xs text-slate-500">
                  Your plan stays active until the end of the billing period.
                </p>
              </CardContent>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function BillingDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-44 rounded-2xl" />
        <Skeleton className="h-44 rounded-2xl" />
      </div>
      <Skeleton className="h-56 rounded-2xl" />
    </div>
  );
}
