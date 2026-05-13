"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useApi } from "@/lib/api";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";

type Org = {
  id: string;
  name: string;
  ai_system_prompt: string | null;
  ai_tone: string;
  ai_language: string;
  reply_delay_min: number;
  reply_delay_max: number;
  subscription_tier: string;
};

const tones = [
  { value: "friendly", label: "Friendly" },
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
];

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ar", label: "Arabic" },
];

export default function SettingsPage() {
  const api = useApi();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["org", "me"],
    queryFn: async () => {
      const res = await api.get<Org>("/org/me");
      return res.data;
    },
  });

  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("friendly");
  const [language, setLanguage] = useState("en");
  const [delayMin, setDelayMin] = useState(30);
  const [delayMax, setDelayMax] = useState(90);

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setPrompt(data.ai_system_prompt ?? "");
    setTone(data.ai_tone);
    setLanguage(data.ai_language);
    setDelayMin(data.reply_delay_min);
    setDelayMax(data.reply_delay_max);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      await api.patch("/org/me", {
        name: name.trim() || undefined,
        ai_system_prompt: prompt.trim() || null,
        ai_tone: tone,
        ai_language: language,
        reply_delay_min: delayMin,
        reply_delay_max: delayMax,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org", "me"] });
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="glass-card p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-electric/15 to-accent-violet/15 text-electric ring-1 ring-electric/20">
            <WhatsAppGlyph className="h-6 w-6 text-wa-dark" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Workspace settings</h2>
            <p className="mt-1 text-sm text-slate-600">
              Profile and password live in Clerk (user menu). These fields control your WhatsApp AI agent for this
              organization.
            </p>
          </div>
        </div>
      </div>

      {isLoading && <div className="h-48 animate-pulse rounded-2xl bg-white/50" />}
      {error && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 px-4 py-4 text-sm text-amber-950">
          Could not load organization. Ensure you are signed in and the API is running.
        </div>
      )}

      {data && (
        <form
          className="space-y-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <div className="glass-card space-y-5 p-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Organization</h3>
            <div>
              <label className="text-xs font-semibold text-slate-600">Display name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm outline-none ring-electric/20 focus:ring-2"
              />
            </div>
            <p className="text-xs text-slate-500">
              Org ID: <span className="font-mono text-slate-700">{data.id}</span> · Plan:{" "}
              <span className="font-semibold capitalize text-slate-800">{data.subscription_tier}</span>
            </p>
          </div>

          <div className="glass-card space-y-5 p-8">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">AI agent (WhatsApp)</h3>
            <div>
              <label className="text-xs font-semibold text-slate-600">Business context / system prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                placeholder="What you sell, policies, tone examples, FAQs…"
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-200/80 bg-white/90 px-4 py-3 text-sm outline-none ring-electric/20 focus:ring-2"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Tone</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm outline-none ring-electric/20 focus:ring-2"
                >
                  {tones.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Default language code</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm outline-none ring-electric/20 focus:ring-2"
                >
                  {languages.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-600">Reply delay min (seconds)</label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={delayMin}
                  onChange={(e) => setDelayMin(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm outline-none ring-electric/20 focus:ring-2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Reply delay max (seconds)</label>
                <input
                  type="number"
                  min={5}
                  max={600}
                  value={delayMax}
                  onChange={(e) => setDelayMax(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm outline-none ring-electric/20 focus:ring-2"
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button type="submit" disabled={save.isPending} className="btn-primary px-6 py-2.5 text-sm disabled:opacity-50">
                {save.isPending ? "Saving…" : "Save changes"}
              </button>
              {save.isSuccess && <span className="text-sm font-medium text-emerald-600">Saved.</span>}
              {save.isError && (
                <span className="text-sm font-medium text-red-600">Could not save — check delay min ≤ max and tone.</span>
              )}
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
