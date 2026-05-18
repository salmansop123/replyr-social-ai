import Link from "next/link";
import { AppLogo } from "@/components/brand/AppLogo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/60 py-14 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-8 px-4 sm:flex-row sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-md ring-1 ring-slate-900/10">
            <AppLogo className="h-10 w-10" />
          </span>
          <div>
            <p className="font-semibold text-slate-900">Replyr AI</p>
            <p className="text-sm text-slate-500">WhatsApp & Facebook — AI messaging for teams</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-600">
          <Link href="/pricing" className="hover:text-electric">
            Pricing
          </Link>
          <Link href="/contact" className="hover:text-electric">
            Contact
          </Link>
          <Link href="/sign-in" className="hover:text-electric">
            Sign in
          </Link>
        </div>
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} Replyr AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
