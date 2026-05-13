"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    const form = new FormData(e.currentTarget);
    const body = {
      name: String(form.get("name") || ""),
      email: String(form.get("email") || ""),
      company: String(form.get("company") || ""),
      message: String(form.get("message") || ""),
    };
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("ok");
    } catch {
      setStatus("err");
    }
  }

  return (
    <div className="mesh-page noise-overlay min-h-screen text-slate-900">
      <MarketingHeader />
      <main className="mx-auto max-w-lg px-4 py-16 sm:px-6 sm:py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-electric">Contact</p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Let&apos;s talk WhatsApp</h1>
        <p className="mt-3 text-slate-600">Questions about Replyr AI, security, or rollout — we read every message.</p>

        <form onSubmit={onSubmit} className="glass-card mt-10 space-y-5 p-8">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              name="name"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-inner outline-none ring-electric/30 transition focus:ring-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-inner outline-none ring-electric/30 transition focus:ring-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Company</label>
            <input
              name="company"
              className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-inner outline-none ring-electric/30 transition focus:ring-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Message</label>
            <textarea
              name="message"
              required
              rows={5}
              className="mt-1.5 w-full resize-y rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm text-slate-900 shadow-inner outline-none ring-electric/30 transition focus:ring-2"
            />
          </div>
          <button type="submit" disabled={status === "loading"} className="btn-primary w-full py-3.5 disabled:opacity-50">
            {status === "loading" ? "Sending…" : "Send message"}
          </button>
          {status === "ok" && <p className="text-center text-sm font-medium text-emerald-600">Thanks — we received your message.</p>}
          {status === "err" && <p className="text-center text-sm font-medium text-red-600">Something went wrong. Try again shortly.</p>}
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href="/" className="font-medium text-electric hover:underline">
            ← Back to home
          </Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
