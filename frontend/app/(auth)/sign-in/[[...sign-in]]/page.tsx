import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { OfflineAuthCard } from "@/components/auth/OfflineAuthCard";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";
import { isClerkConfigured } from "@/lib/clerk-config";

const appearance = {
  variables: {
    colorPrimary: "#2563EB",
    colorText: "#0f172a",
    colorTextSecondary: "#64748b",
    colorBackground: "#ffffff",
    colorInputBackground: "#f8fafc",
    colorInputText: "#0f172a",
    borderRadius: "14px",
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
  },
  elements: {
    card: "shadow-none border-0 bg-transparent",
    headerTitle: "text-slate-900 text-xl font-bold tracking-tight",
    headerSubtitle: "text-slate-600",
    socialButtonsBlockButton: "border-slate-200/80 bg-white hover:bg-slate-50",
    formButtonPrimary: "bg-gradient-to-r from-electric to-accent-cyan shadow-glow hover:opacity-95",
    footerActionLink: "text-electric font-semibold",
  },
};

export default function SignInPage() {
  const clerk = isClerkConfigured();

  return (
    <div className="min-h-screen mesh-page noise-overlay">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        <div className="relative hidden overflow-hidden px-10 py-14 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-electric to-accent-violet opacity-95" />
          <div className="absolute -left-20 top-24 h-72 w-72 rounded-full bg-wa/30 blur-3xl" />
          <div className="absolute bottom-10 right-0 h-64 w-64 rounded-full bg-accent-cyan/25 blur-3xl" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <WhatsAppGlyph className="h-4 w-4" />
              </span>
              Replyr AI
            </Link>
            <h1 className="mt-10 max-w-md text-4xl font-bold leading-tight tracking-tight">
              Sign in to your WhatsApp command center.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/75">
              Enterprise-grade automation with a consumer-grade experience — monitor volume, review AI sends, and take
              over instantly.
            </p>
          </div>

          <div className="relative mt-12 grid gap-3 text-xs text-white/60">
            <p>© {new Date().getFullYear()} Replyr AI</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <div className="glass-card p-6 sm:p-8">
              <div className="mb-6 lg:hidden">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-wa text-white shadow-glow-wa">
                    <WhatsAppGlyph className="h-4 w-4" />
                  </span>
                  Replyr AI
                </Link>
              </div>
              {clerk ? (
                <SignIn
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  forceRedirectUrl="/dashboard"
                  appearance={appearance}
                />
              ) : (
                <OfflineAuthCard variant="sign-in" />
              )}
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">
              By continuing you agree to our terms and acknowledge our focus on WhatsApp-first workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
