import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { AppLogo } from "@/components/brand/AppLogo";

export default function SignUpPage() {
  return (
    <div className="min-h-screen mesh-page noise-overlay">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col lg:flex-row-reverse">
        <div className="relative hidden overflow-hidden px-10 py-14 lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-wa-muted/80 via-white to-electric-soft/70" />
          <div className="absolute -right-12 top-24 h-64 w-64 rounded-full bg-electric/14 blur-3xl" />
          <div className="absolute bottom-12 left-0 h-60 w-60 rounded-full bg-teal-brand/12 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 h-48 w-48 rounded-full bg-wa-light/20 blur-2xl" />

          <div className="relative">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 transition hover:text-electric"
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
              Create your workspace in minutes.
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-600">
              Connect WhatsApp Business and Facebook Pages, define tone once, and let Replyr handle the busy work
              without losing the human touch.
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
              <SignUpForm />
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">
              WhatsApp & Facebook are first-class — one inbox, one AI stack.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
