import Link from "next/link";
import { Suspense } from "react";
import { SignInForm } from "@/components/auth/SignInForm";
import { AppLogo } from "@/components/brand/AppLogo";

function SignInFormFallback() {
  return <div className="min-h-[320px] animate-pulse rounded-2xl bg-gradient-to-br from-slate-50 to-white" aria-hidden />;
}

export default function SignInPage() {
  return (
    <div className="min-h-screen mesh-page noise-overlay">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row">
        <div className="relative hidden overflow-hidden px-10 py-14 lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-electric-soft/75 to-teal-muted/45" />
          <div className="absolute -left-16 top-20 h-64 w-64 rounded-full bg-electric/18 blur-3xl" />
          <div className="absolute bottom-16 right-4 h-56 w-56 rounded-full bg-wa-light/25 blur-3xl" />
          <div className="absolute top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-teal-brand/12 blur-3xl" />

          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 transition hover:text-teal-brand"
            >
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-slate-200/80">
                <AppLogo className="h-9 w-9" />
              </span>
              <span className="font-heading font-bold">
                Replyr
                <span className="bg-gradient-to-r from-electric via-accent-cyan to-teal-brand bg-clip-text text-transparent">AI</span>
              </span>
            </Link>
            <h1 className="font-heading mt-10 max-w-md text-4xl font-bold leading-tight tracking-tight text-slate-900">
              Sign in to your WhatsApp & Facebook command center.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-600">
              Enterprise-grade automation with a consumer-grade experience — monitor volume, review AI sends, and take
              over instantly.
            </p>
          </div>

          <div className="relative mt-12 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Replyr AI</p>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-md">
            <div className="glass-card p-6 shadow-premium transition hover:shadow-lift sm:p-8">
              <div className="mb-6 lg:hidden">
                <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-900">
                  <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-slate-200/80 shadow-sm">
                    <AppLogo className="h-9 w-9" />
                  </span>
                  <span className="font-heading">
                    Replyr
                    <span className="bg-gradient-to-r from-electric via-accent-cyan to-teal-brand bg-clip-text text-transparent">
                      AI
                    </span>
                  </span>
                </Link>
              </div>
              <Suspense fallback={<SignInFormFallback />}>
                <SignInForm />
              </Suspense>
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">
              By continuing you agree to our terms and acknowledge our focus on WhatsApp & Facebook workflows.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
