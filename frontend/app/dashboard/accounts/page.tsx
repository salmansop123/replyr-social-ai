import dynamic from "next/dynamic";
import { Suspense } from "react";

const AccountsPageClient = dynamic(() => import("./AccountsPageClient"), {
  ssr: false,
  loading: () => (
    <div className="space-y-8">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    </div>
  ),
});

function logAccountsPageShell() {
  // #region agent log
  void fetch("http://127.0.0.1:7845/ingest/e46810bd-6a09-4049-8a37-492421b89b3f", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "951a6e" },
    body: JSON.stringify({
      sessionId: "951a6e",
      location: "accounts/page.tsx",
      message: "accounts RSC shell render",
      data: { ssrDisabled: true },
      timestamp: Date.now(),
      hypothesisId: "C",
      runId: "pre-fix",
    }),
  }).catch(() => {});
  // #endregion
}

export default function AccountsPage() {
  logAccountsPageShell();
  return (
    <Suspense
      fallback={
        <div className="space-y-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-100" />
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      }
    >
      <AccountsPageClient />
    </Suspense>
  );
}
