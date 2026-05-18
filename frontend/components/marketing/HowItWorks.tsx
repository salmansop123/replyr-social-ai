"use client";

import { useEffect, useRef, useState } from "react";
import { Brain, Link2, Rocket } from "lucide-react";
import { GradientAtmosphere } from "@/components/brand/GradientAtmosphere";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

export function HowItWorks() {
  const lineRef = useRef<SVGPathElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [draw, setDraw] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setDraw(true);
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const path = lineRef.current;
    if (!path || !draw) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    requestAnimationFrame(() => {
      path.style.transition = "stroke-dashoffset 2s ease-out";
      path.style.strokeDashoffset = "0";
    });
  }, [draw]);

  return (
    <section id="how-it-works" ref={wrapRef} className="relative section-tint-mixed py-20 sm:py-28">
      <GradientAtmosphere variant="section" />
      <div className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-teal-brand">How it works</p>
          <h2 className="font-heading mt-3 text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            Up and running in <span className="heading-accent">5 minutes</span>
          </h2>
        </ScrollReveal>

        <div className="relative mt-16 hidden lg:block">
          <svg className="absolute left-[8%] right-[8%] top-[140px] z-0 h-[120px] w-full overflow-visible" aria-hidden>
            <path
              ref={lineRef}
              d="M 40 60 Q 400 20, 760 60 T 1480 60"
              fill="none"
              stroke="url(#howGradReplyr)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="6 8"
              className="motion-reduce:opacity-60"
            />
            <defs>
              <linearGradient id="howGradReplyr" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.35" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="relative z-[1] grid gap-14 lg:grid-cols-3 lg:gap-8">
          <ScrollReveal>
            <div className="glass-card-glow p-6 transition hover:-translate-y-1 hover:shadow-glow-accent">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-cyan/15 text-accent-cyan">
                <Link2 className="h-6 w-6" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-electric">Step 1</p>
              <h3 className="font-heading mt-2 text-xl font-bold text-slate-900">Connect WhatsApp & Facebook</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Link your WhatsApp Business account and Facebook Page in one click. No technical knowledge needed we
                guide you through every step.
              </p>
              <div className="mt-6 rounded-xl border border-dashed border-slate-200/90 bg-slate-50/80 p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-wa-muted text-lg font-bold text-wa-dark">
                    W
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-fb/10 text-lg font-bold text-fb">
                    f
                  </span>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-900">Connect account</p>
                    <p className="text-xs text-slate-500">OAuth · Guided setup</p>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={100}>
            <div className="glass-card-glow p-6 transition hover:-translate-y-1 hover:shadow-glow-accent">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-violet/12 text-accent-violet">
                <Brain className="h-6 w-6" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-electric">Step 2</p>
              <h3 className="font-heading mt-2 text-xl font-bold text-slate-900">Tell the AI about your business</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                Describe your products, prices, FAQs, and communication style. The more you share, the smarter your AI
                gets. Takes about 3 minutes.
              </p>
              <div className="mt-6 overflow-hidden rounded-xl border border-slate-200/80 bg-white p-3 shadow-inner">
                <p className="marketing-kb-line text-xs leading-relaxed text-slate-600">
                  Lavender soap $12, gentle for dry skin. Charcoal Detox $14, best for oily skin. Free shipping over
                  $50. Use HELLO10 for 10% off first order…
                </p>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={200}>
            <div className="glass-card-glow p-6 transition hover:-translate-y-1 hover:shadow-glow-accent">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric/10 text-electric">
                <Rocket className="h-6 w-6" />
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-electric">Step 3</p>
              <h3 className="font-heading mt-2 text-xl font-bold text-slate-900">AI handles everything automatically</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                From this moment on, every WhatsApp message and Facebook comment gets a real, human-sounding reply even
                while you sleep.
              </p>
              <div className="mt-6 flex justify-center scale-[0.92]">
                {/* <HeroPhoneMock /> */}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
