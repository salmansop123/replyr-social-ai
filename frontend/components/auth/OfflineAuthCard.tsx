import Link from "next/link";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";

type Variant = "sign-in" | "sign-up";

export function OfflineAuthCard({ variant }: { variant: Variant }) {
  const isSignUp = variant === "sign-up";
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-electric/15 to-accent-violet/15 text-electric ring-1 ring-electric/20">
        <WhatsAppGlyph className="h-7 w-7 text-wa-dark" />
      </div>
      <h2 className="mt-6 text-xl font-bold text-slate-900">{isSignUp ? "Create a workspace" : "Welcome back"}</h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Clerk is not configured yet. You can still open the dashboard and build out the product locally. Add your
        publishable and secret keys to <code className="rounded bg-slate-100 px-1">frontend/.env.local</code> when you
        are ready for real sign-in.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/dashboard" className="btn-primary px-6 py-3 text-center">
          Continue to dashboard
        </Link>
        <Link href="/" className="btn-secondary px-6 py-3 text-center">
          Back to home
        </Link>
      </div>
      {!isSignUp && (
        <p className="mt-6 text-xs text-slate-500">
          Need an account later?{" "}
          <Link href="/sign-up" className="font-semibold text-electric underline-offset-2 hover:underline">
            Sign up
          </Link>
        </p>
      )}
      {isSignUp && (
        <p className="mt-6 text-xs text-slate-500">
          Already using Clerk elsewhere?{" "}
          <Link href="/sign-in" className="font-semibold text-electric underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
