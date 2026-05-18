"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuthToken } from "@/components/auth/AuthAndClerkProvider";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "sidebar" | "compact";
};

function buttonClass(variant: "sidebar" | "compact", className?: string) {
  return cn(
    variant === "sidebar"
      ? "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-red-200/80 hover:bg-red-50/80 hover:text-red-700 hover:shadow-sm"
      : "inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200/80 hover:bg-red-50/80 hover:text-red-700",
    className,
  );
}

/** Only rendered under ClerkProvider — may call useClerk(). */
function ClerkLogoutButton({ className, variant = "sidebar" }: Props) {
  const { signOut } = useClerk();

  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/" })}
      className={buttonClass(variant, className)}
    >
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
}

function OfflineLogoutButton({ className, variant = "sidebar" }: Props) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/")}
      className={cn(
        variant === "sidebar"
          ? "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-teal-brand/30 hover:bg-teal-muted/30 hover:text-teal-800"
          : "inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-brand/30 hover:text-teal-800",
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
}

export function DashboardLogoutButton(props: Props) {
  const { isClerkActive } = useAuthToken();

  if (!isClerkActive) {
    return <OfflineLogoutButton {...props} />;
  }

  return <ClerkLogoutButton {...props} />;
}
