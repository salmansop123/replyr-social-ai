"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

type Cell = {
  key: string;
  /** numeric value to count toward (display handled in render) */
  target: number;
  line1: string;
  line2: string;
  kind: "plus" | "ltSec" | "pct" | "langs";
};

const CELLS: Cell[] = [
  { key: "replies", target: 10000, line1: "10,000+", line2: "AI Replies\nSent Daily", kind: "plus" },
  { key: "time", target: 60, line1: "< 60 sec", line2: "Average\nReply Time", kind: "ltSec" },
  { key: "uptime", target: 99.9, line1: "99.9%", line2: "Uptime", kind: "pct" },
  { key: "lang", target: 40, line1: "40+", line2: "Languages\nSupported", kind: "langs" },
];

export function Stats() {
  const sectionRef = useRef<HTMLElement>(null);
  const [started, setStarted] = useState(false);
  const [replies, setReplies] = useState(0);
  const [sec, setSec] = useState(0);
  const [uptime, setUptime] = useState(0);
  const [langs, setLangs] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setStarted(true);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const t0 = performance.now();
    let frame: number;
    const loop = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const ease = 1 - (1 - t) ** 3;
      setReplies(Math.floor(10000 * ease));
      setSec(Math.min(60, Math.ceil(60 * ease)));
      setUptime(Number((99.9 * ease).toFixed(1)));
      setLangs(Math.floor(40 * ease));
      if (t < 1) frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [started]);

  function renderLine1(cell: Cell) {
    switch (cell.kind) {
      case "plus":
        return (
          <>
            {replies.toLocaleString()}
            <span className="bg-gradient-to-r from-electric to-accent-cyan bg-clip-text font-extrabold text-transparent">+</span>
          </>
        );
      case "ltSec":
        return (
          <>
            <span className="bg-gradient-to-r from-electric to-teal-brand bg-clip-text font-semibold text-transparent">&lt; </span>
            {sec}
            <span className="mt-1 block text-lg font-medium text-slate-400 sm:inline sm:mt-0 sm:ml-1 sm:text-2xl"> sec</span>
          </>
        );
      case "pct":
        return <span className="bg-gradient-to-r from-electric via-accent-cyan to-wa-dark bg-clip-text font-bold text-transparent">{uptime}%</span>;
      case "langs":
        return (
          <>
            {langs}
            <span className="bg-gradient-to-r from-electric to-accent-cyan bg-clip-text font-extrabold text-transparent">+</span>
          </>
        );
      default:
        return cell.line1;
    }
  }

  return (
    <section ref={sectionRef} className="relative border-y border-electric/10 section-tint-blue py-12 backdrop-blur-sm sm:py-14">
      <ScrollReveal>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="hairline-accent mx-auto max-w-md opacity-90" aria-hidden />
        </div>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-4 lg:gap-0 lg:pt-10">
          {CELLS.map((cell, i) => (
            <div key={cell.key} className="relative px-2 text-center sm:px-6">
              {i > 0 ? (
                <div
                  className="pointer-events-none absolute left-0 top-1/2 hidden h-14 w-px -translate-y-1/2 bg-gradient-to-b from-transparent via-electric/30 to-teal-brand/25 lg:block"
                  aria-hidden
                />
              ) : null}
              <p className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                {renderLine1(cell)}
              </p>
              <div className="mt-2 whitespace-pre-line text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">
                {cell.line2}
              </div>
            </div>
          ))}
        </div>
      </ScrollReveal>
    </section>
  );
}
