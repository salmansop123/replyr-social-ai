"use client";

import Link from "next/link";
import { ArrowRight, Lock, Shield } from "lucide-react";
import { GradientAtmosphere } from "@/components/brand/GradientAtmosphere";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export function CTA() {
  return (
    <section className="relative overflow-hidden section-cta-gradient py-24 sm:py-28">
      <GradientAtmosphere variant="cta" />
      <div className="pointer-events-none absolute inset-0 bg-mesh-animated mesh-animated opacity-60" aria-hidden />
      <ScrollReveal className="relative z-[1] mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 className="font-heading text-3xl font-bold text-slate-900 sm:text-4xl md:text-5xl">
          Ready to stop <span className="heading-accent">missing messages?</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
          Join businesses using Replyr AI to handle every customer conversation automatically starting today.
        </p>
        <Link
          href="/sign-up"
          className="mt-10 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-brand px-8 py-4 text-base font-semibold text-white shadow-md transition hover:scale-[1.02] hover:shadow-glow-accent"
        >
          Start Your Free Trial — No Card Needed
          <ArrowRight className="h-5 w-5" />
        </Link>
        <p className="mt-6 text-sm text-slate-500">Setup takes 5 minutes · Cancel anytime · 14-day free trial</p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-teal-brand" /> SOC2-ready practices
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-4 w-4 text-electric" /> Encrypted in transit &amp; at rest
          </span>
        </div>
      </ScrollReveal>
    </section>
  );
}
