"use client";

import { useEffect, useRef, useState } from "react";
import { TrendingUp, Timer, MessageCircle } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GradientAtmosphere } from "@/components/brand/GradientAtmosphere";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

const chartData = [
  { week: "Week 1", without: 18, with: 22 },
  { week: "Week 2", without: 17, with: 38 },
  { week: "Week 3", without: 19, with: 58 },
  { week: "Week 4", without: 16, with: 74 },
  { week: "Week 5", without: 18, with: 86 },
  { week: "Week 6", without: 17, with: 92 },
  { week: "Week 7", without: 19, with: 97 },
  { week: "Week 8", without: 18, with: 99 },
];

export function AnimatedChart() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative section-tint-green py-20 sm:py-28">
      <GradientAtmosphere variant="section" />
      <div ref={wrapRef} className="relative z-[1] mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal>
          <h2 className="font-heading text-center text-3xl font-bold text-slate-900 sm:text-4xl">
            See the difference Replyr makes
          </h2>
        </ScrollReveal>
        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:items-center">
          <ScrollReveal delayMs={80}>
            <h3 className="font-heading text-2xl font-bold text-slate-900 sm:text-3xl">From 0 replies to 100% coverage</h3>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Most businesses miss 70% of customer messages on social media. Replyr AI ensures every single comment and DM
              gets a reply — increasing conversions by an average of 34%.
            </p>
            <ul className="mt-8 space-y-4 text-slate-600">
              <li className="flex gap-3">
                <TrendingUp className="mt-0.5 h-6 w-6 shrink-0 text-electric" />
                <div>
                  <p className="font-semibold text-slate-900">34% increase in conversions</p>
                  <p className="text-sm text-slate-500">Measured across pilot storefronts vs. prior quarter.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <Timer className="mt-0.5 h-6 w-6 shrink-0 text-accent-cyan" />
                <div>
                  <p className="font-semibold text-slate-900">18× faster response time</p>
                  <p className="text-sm text-slate-500">From hours to under a minute, without extra headcount.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <MessageCircle className="mt-0.5 h-6 w-6 shrink-0 text-wa-dark" />
                <div>
                  <p className="font-semibold text-slate-900">100% message coverage</p>
                  <p className="text-sm text-slate-500">Every thread answered in your brand voice.</p>
                </div>
              </li>
            </ul>
          </ScrollReveal>

          <ScrollReveal delayMs={120}>
            <div className="glass-card-glow p-4 shadow-glow-accent sm:p-6">
              <div className="h-[320px] w-full sm:h-[360px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="fillWithLanding" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22D3EE" stopOpacity={0.4} />
                        <stop offset="45%" stopColor="#3B82F6" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="week" stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} />
                    <YAxis stroke="#94a3b8" tick={{ fill: "#64748b", fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: "rgba(255,255,255,0.96)",
                        border: "1px solid rgba(15,23,42,0.08)",
                        borderRadius: "12px",
                        color: "#0f172a",
                        boxShadow: "0 12px 40px -20px rgba(15,23,42,0.15)",
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 16 }}
                      formatter={(value) => <span className="text-sm text-slate-600">{value}</span>}
                    />
                    <Area
                      type="monotone"
                      dataKey="without"
                      name="Without Replyr"
                      stroke="#94a3b8"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      fill="none"
                      isAnimationActive={inView}
                      animationBegin={inView ? 200 : 0}
                      animationDuration={inView ? 1600 : 0}
                    />
                    <Area
                      type="monotone"
                      dataKey="with"
                      name="With Replyr AI"
                      stroke="#3B82F6"
                      strokeWidth={2.5}
                      fill="url(#fillWithLanding)"
                      isAnimationActive={inView}
                      animationBegin={inView ? 400 : 0}
                      animationDuration={inView ? 2000 : 0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
