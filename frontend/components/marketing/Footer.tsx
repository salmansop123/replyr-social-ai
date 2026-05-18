import Link from "next/link";
import { Globe, Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-heading text-lg font-bold text-slate-900">
              Replyr
              <span className="bg-gradient-to-r from-electric via-accent-cyan to-teal-brand bg-clip-text text-transparent">AI</span>
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-600">AI replies that feel human.</p>
            <div className="mt-4 flex gap-3 text-slate-500">
              <a
                href="#"
                className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-electric"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-electric"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="rounded-lg p-2 transition hover:bg-slate-100 hover:text-electric"
                aria-label="Website"
              >
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/#features" className="transition hover:text-electric">
                  Features
                </Link>
              </li>
              <li>
                <Link href="/#pricing" className="transition hover:text-electric">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="transition hover:text-electric">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-electric">
                  API
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/contact" className="transition hover:text-electric">
                  About
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-electric">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-electric">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-electric">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Support</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                <Link href="/contact" className="transition hover:text-electric">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-electric">
                  Status
                </Link>
              </li>
              <li>
                <Link href="/contact" className="transition hover:text-electric">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-slate-200/80 pt-8 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Replyr AI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
