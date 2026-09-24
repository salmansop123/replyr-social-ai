"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  variant?: "sidebar" | "compact";
};

export function DashboardLogoutButton({ className, variant = "sidebar" }: Props) {
  const router = useRouter();
  const { signOut } = useAuth();

  return (
    <button
      type="button"
      onClick={() => {
        signOut();
        router.push("/sign-in");
      }}
      className={cn(
        variant === "sidebar"
          ? "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-red-200/80 hover:bg-red-50/80 hover:text-red-700 hover:shadow-sm"
          : "inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-red-200/80 hover:bg-red-50/80 hover:text-red-700",
        className,
      )}
    >
      <LogOut className="h-4 w-4" />
      Log out
    </button>
  );
}
