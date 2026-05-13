import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { OfflineAuthCard } from "@/components/auth/OfflineAuthCard";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";
import { isClerkConfigured } from "@/lib/clerk-config";

const appearance = {
  variables: {
    colorPrimary: "#25D366",
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
    formButtonPrimary: "bg-gradient-to-r from-wa to-wa-dark shadow-glow-wa hover:opacity-95",
    footerActionLink: "text-electric font-semibold",
  },
};

export default function SignUpPage() {
  const clerk = isClerkConfigured();

  return (
    <div className="min-h-screen mesh-page noise-overlay">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row-reverse">
        <div className="relative hidden overflow-hidden px-10 py-14 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-wa-dark via-wa to-electric opacity-95" />
          <div className="absolute -right-16 top-28 h-72 w-72 rounded-full bg-accent-violet/35 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-accent-cyan/25 blur-3xl" />

          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <WhatsAppGlyph className="h-4 w-4" />
              </span>
              Replyr AI
            </Link>
            <h1 className="mt-10 max-w-md text-4xl font-bold leading-tight tracking-tight">
              Create your workspace in minutes.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-white/80">
              Start with WhatsApp automation: connect your Business profile, define tone, and let Replyr handle the busy
              work — without losing the human touch.
            </p>
          </div>

          <div className="relative mt-12 text-xs text-white/65">
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
                <SignUp
                  routing="path"
                  path="/sign-up"
                  signInUrl="/sign-in"
                  forceRedirectUrl="/dashboard"
                  appearance={appearance}
                />
              ) : (
                <OfflineAuthCard variant="sign-up" />
              )}
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">
              WhatsApp-first today — additional channels may arrive later as optional modules.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
