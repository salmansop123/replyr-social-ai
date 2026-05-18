"use client";

import { Star } from "lucide-react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const items = [
  {
    quote:
      "We used to miss half our WhatsApp messages. Now Replyr handles everything and our sales are up 40%. It sounds just like our team.",
    name: "Sarah K., Owner at GlowSkin Cosmetics",
    flag: "🇵🇰",
  },
  {
    quote:
      "I was skeptical AI could sound human. The replies are better than what my actual staff was writing. Customers can't tell the difference.",
    name: "Ahmed R., Founder of TechGadgets Store",
    flag: "🇦🇪",
  },
  {
    quote:
      "Setup took 8 minutes. By the end of the day it had replied to 47 customer messages without a single mistake. Incredible.",
    name: "Maria L., Marketing Manager",
    flag: "🇬🇧",
  },
];

export function Testimonials() {
  const row = [...items, ...items];

  const cardClass =
    "rounded-2xl border border-slate-200/80 border-l-4 border-l-teal-brand/70 bg-white p-6 shadow-sm ring-1 ring-electric/5 transition hover:-translate-y-0.5 hover:border-l-electric/80 hover:shadow-premium";

  return (
    <section className="relative overflow-hidden section-tint-blue py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="font-heading text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            Businesses love Replyr AI
          </h2>
        </ScrollReveal>
      </div>

      <div className="mx-auto mt-12 hidden max-w-6xl grid-cols-3 gap-6 px-4 sm:px-6 md:grid">
        {items.map((t) => (
          <article key={t.name} className={cardClass}>
            <div className="flex gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</p>
            <p className="mt-4 text-sm text-slate-500">
              — {t.name} {t.flag}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-10 md:hidden">
        <div className="flex w-[200%] animate-marquee gap-4 motion-reduce:animate-none">
          {row.map((t, idx) => (
            <article key={`${t.name}-${idx}`} className={`w-[85vw] shrink-0 ${cardClass}`}>
              <div className="flex gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-slate-700">&ldquo;{t.quote}&rdquo;</p>
              <p className="mt-4 text-sm text-slate-500">
                — {t.name} {t.flag}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
