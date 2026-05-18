"use client";

import { Play } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export function LiveDemo() {
  return (
    <section id="live-demo" className="relative scroll-mt-24 section-tint-violet py-20 backdrop-blur-sm sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-electric/8 via-transparent to-wa/8" aria-hidden />
      <div className="relative z-[1] mx-auto max-w-4xl px-4 text-center sm:px-6">
        <ScrollReveal>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-electric">Product tour</p>
          <h2 className="font-heading mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">See Replyr in action</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Two minutes on how inbox routing, tone controls, and WhatsApp + Facebook coverage work together — no fluff,
            just the workflow.
          </p>
        </ScrollReveal>

        <ScrollReveal delayMs={100} className="mt-10">
          <button
            type="button"
            className="group relative mx-auto block w-full max-w-3xl overflow-hidden rounded-2xl border border-slate-200/90 bg-white text-left shadow-premium transition hover:-translate-y-0.5 hover:shadow-lift"
            aria-label="Play demo video"
            onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
          >
            <div className="aspect-video w-full bg-gradient-to-br from-electric/20 via-accent-cyan/10 to-wa-muted/40" />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900/10 transition group-hover:bg-slate-900/15">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-electric to-accent-cyan text-white shadow-lg transition group-hover:scale-105">
                <Play className="ml-1 h-7 w-7 fill-current" />
              </span>
              <span className="rounded-full bg-white/95 px-4 py-1 text-sm font-medium text-slate-800 shadow-md backdrop-blur-sm">
                Watch 2-min demo
              </span>
            </div>
          </button>
          <p className="mt-4 text-xs text-slate-500">
            Placeholder preview — hook your Loom or YouTube embed here when ready.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
