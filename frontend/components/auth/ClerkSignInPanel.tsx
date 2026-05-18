"use client";

import { SignIn } from "@clerk/nextjs";

const appearance = {
  variables: {
    colorPrimary: "#3b82f6",
    colorText: "#0f172a",
    colorTextSecondary: "#64748b",
    colorBackground: "transparent",
    colorInputBackground: "#f8fafc",
    colorInputText: "#0f172a",
    borderRadius: "14px",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    fontSize: "0.9375rem",
  },
  elements: {
    card: "shadow-none border-0 bg-transparent",
    headerTitle: "font-heading text-slate-900 text-2xl font-bold tracking-tight",
    headerSubtitle: "text-slate-600",
    socialButtonsBlockButton:
      "border-slate-200/90 bg-white shadow-sm transition hover:bg-teal-muted/25 hover:border-teal-brand/30 hover:shadow-md",
    formFieldInput:
      "rounded-xl border-slate-200/90 bg-white shadow-inner transition focus:border-teal-brand focus:ring-2 focus:ring-teal-brand/20",
    formFieldLabel: "text-slate-700 font-medium",
    formButtonPrimary:
      "rounded-xl bg-gradient-brand font-semibold text-white shadow-md transition hover:scale-[1.02] hover:shadow-glow-accent",
    footerAction: "text-slate-600",
    footerActionLink: "text-electric font-semibold hover:text-electric-bright",
    identityPreviewText: "text-slate-700",
    formFieldSuccessText: "text-emerald-600",
    formFieldErrorText: "text-red-600",
    dividerLine: "bg-slate-200",
    dividerText: "text-slate-500",
  },
};

export function ClerkSignInPanel() {
  return (
    <SignIn
      routing="path"
      path="/sign-in"
      signUpUrl="/sign-up"
      forceRedirectUrl="/dashboard"
      appearance={appearance}
    />
  );
}
