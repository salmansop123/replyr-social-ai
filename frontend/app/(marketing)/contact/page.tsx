"use client";

import { useState } from "react";
import Link from "next/link";

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

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white px-4 py-3 text-sm text-slate-900 shadow-inner outline-none ring-electric/20 transition placeholder:text-slate-400 focus:border-electric focus:ring-2";

  return (
    <div className="pt-24">
      <main className="mx-auto max-w-lg px-4 pb-20 sm:px-6 sm:pb-24">
        <p className="text-sm font-semibold uppercase tracking-wider text-electric">Contact</p>
        <h1 className="font-heading mt-2 text-4xl font-bold tracking-tight text-slate-900">
          Let&apos;s talk WhatsApp & Facebook
        </h1>
        <p className="mt-3 text-slate-600">Questions about Replyr AI, security, or rollout — we read every message.</p>

        <form onSubmit={onSubmit} className="glass-card mt-10 space-y-5 p-8 shadow-premium">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input name="name" required className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input name="email" type="email" required className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Company</label>
            <input name="company" className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Message</label>
            <textarea name="message" required rows={5} className={`${inputClass} resize-y`} />
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-xl bg-gradient-to-r from-electric to-accent-cyan py-3.5 text-sm font-semibold text-white shadow-md transition hover:scale-[1.01] hover:shadow-premium disabled:opacity-50"
          >
            {status === "loading" ? "Sending…" : "Send message"}
          </button>
          {status === "ok" && (
            <p className="text-center text-sm font-medium text-emerald-600">Thanks — we received your message.</p>
          )}
          {status === "err" && (
            <p className="text-center text-sm font-medium text-red-600">Something went wrong. Try again shortly.</p>
          )}
        </form>

        <p className="mt-8 text-center text-sm text-slate-500">
          <Link href="/" className="font-medium text-electric hover:underline">
            ← Back to home
          </Link>
        </p>
      </main>
    </div>
  );
}
