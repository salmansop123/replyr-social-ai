"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { apiBase, type AuthTokenResponse } from "@/lib/auth";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithResponse } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/auth/sign-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as AuthTokenResponse & { detail?: string };
      if (!res.ok) {
        setError(typeof data.detail === "string" ? data.detail : "Sign in failed");
        return;
      }
      signInWithResponse(data);
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
    } catch {
      setError("Could not reach the API. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="font-heading text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
      <p className="mt-2 text-sm text-slate-600">Sign in to your Replyr workspace.</p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-inner transition focus:border-teal-brand focus:outline-none focus:ring-2 focus:ring-teal-brand/20"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200/90 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-inner transition focus:border-teal-brand focus:outline-none focus:ring-2 focus:ring-teal-brand/20"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-70"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Sign in
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-slate-500">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="font-semibold text-electric underline-offset-2 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
