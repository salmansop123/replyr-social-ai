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

export default function AccountsPage() {
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
