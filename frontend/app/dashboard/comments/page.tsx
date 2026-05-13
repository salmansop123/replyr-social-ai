"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useApi } from "@/lib/api";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";

type ConversationRow = {
  id: string;
  platform: string;
  customer_name: string | null;
  status: string;
  sentiment: string | null;
  is_human_takeover: boolean;
  created_at: string;
  updated_at: string;
  last_message_preview: string | null;
};

type MessageRow = {
  id: string;
  direction: string;
  content: string;
  ai_generated: boolean;
  created_at: string;
};

type ConversationDetail = ConversationRow & { messages: MessageRow[] };

function statusStyle(status: string) {
  switch (status) {
    case "pending":
      return "bg-amber-50 text-amber-800 ring-amber-200/80";
    case "answered":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
    case "ignored":
      return "bg-slate-100 text-slate-600 ring-slate-200/80";
    default:
      return "bg-violet-50 text-violet-800 ring-violet-200/80";
  }
}

export default function InboxPage() {
  const api = useApi();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [draftReply, setDraftReply] = useState("");

  const list = useQuery({
    queryKey: ["conversations", "whatsapp", search],
    queryFn: async () => {
      const res = await api.get<ConversationRow[]>("/conversations", {
        params: { platform: "whatsapp", limit: 80, ...(search.trim() ? { q: search.trim() } : {}) },
      });
      return res.data;
    },
  });

  const detail = useQuery({
    queryKey: ["conversation", selectedId],
    queryFn: async () => {
      const res = await api.get<ConversationDetail>(`/conversations/${selectedId}`);
      return res.data;
    },
    enabled: !!selectedId,
  });

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["conversations"] });
    if (selectedId) qc.invalidateQueries({ queryKey: ["conversation", selectedId] });
    qc.invalidateQueries({ queryKey: ["analytics"] });
  }, [qc, selectedId]);

  const takeoverMut = useMutation({
    mutationFn: async (next: boolean) => {
      await api.patch(`/conversations/${selectedId}/takeover`, { is_human_takeover: next });
    },
    onSuccess: invalidate,
  });

  const ignoreMut = useMutation({
    mutationFn: async () => {
      await api.post(`/conversations/${selectedId}/ignore`);
    },
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
    },
  });

  const reopenMut = useMutation({
    mutationFn: async () => {
      await api.post(`/conversations/${selectedId}/reopen`);
    },
    onSuccess: invalidate,
  });

  const sendMut = useMutation({
    mutationFn: async (content: string) => {
      await api.post(`/conversations/${selectedId}/messages`, { content });
    },
    onSuccess: () => {
      setDraftReply("");
      invalidate();
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="glass-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-wa/15 text-wa-dark ring-1 ring-wa/25">
              <WhatsAppGlyph className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">WhatsApp inbox</h2>
              <p className="mt-1 text-sm text-slate-600">
                Select a thread to view messages, toggle human takeover, and send a manual reply.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80">
            {list.data?.length ?? 0} threads
          </span>
        </div>

        <div className="glass-card p-4">
          <input
            type="search"
            placeholder="Search customer or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm outline-none ring-electric/20 focus:ring-2"
          />
        </div>

        {list.isLoading && <div className="h-40 animate-pulse rounded-2xl bg-white/50" />}
        {list.error && (
          <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-4 text-sm text-red-900">
            Unable to load conversations. If you just signed in, wait a second and refresh — or check that the API is
            running.
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-card backdrop-blur">
          <div className="hidden grid-cols-[1fr_140px_100px] gap-4 border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 md:grid">
            <span>Thread</span>
            <span>Status</span>
            <span className="text-right">Takeover</span>
          </div>
          <div className="divide-y divide-slate-200/70">
            {(list.data ?? []).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedId(c.id);
                  setDraftReply("");
                }}
                className={`flex w-full flex-col gap-2 px-4 py-4 text-left transition-colors md:grid md:grid-cols-[1fr_140px_100px] md:items-center ${
                  selectedId === c.id ? "bg-electric/5 ring-1 ring-inset ring-electric/15" : "hover:bg-slate-50/80"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-wa/10 text-wa-dark">
                      <WhatsAppGlyph className="h-4 w-4" />
                    </span>
                    <span className="truncate font-semibold text-slate-900">{c.customer_name || "Customer"}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 pl-10 text-sm text-slate-600">
                    {c.last_message_preview || <span className="text-slate-400">No messages</span>}
                  </p>
                  <p className="pl-10 text-xs text-slate-400">{new Date(c.updated_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${statusStyle(c.status)}`}>
                    {c.status}
                  </span>
                </div>
                <div className="text-sm font-medium text-slate-700 md:text-right">{c.is_human_takeover ? "On" : "Off"}</div>
              </button>
            ))}
            {!list.isLoading && (list.data?.length ?? 0) === 0 && (
              <div className="px-6 py-16 text-center text-sm text-slate-500">No WhatsApp threads yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity lg:static lg:z-0 lg:w-[min(100%,420px)] lg:shrink-0 lg:bg-transparent lg:backdrop-blur-0 ${
          selectedId ? "opacity-100" : "pointer-events-none opacity-0 lg:pointer-events-auto lg:opacity-100"
        }`}
        aria-hidden={!selectedId}
        onClick={() => setSelectedId(null)}
      >
        <div
          className={`ml-auto flex h-full w-full max-w-md flex-col border-l border-white/50 bg-white shadow-lift transition-transform lg:max-w-none lg:rounded-2xl lg:border lg:shadow-card ${
            selectedId ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {!selectedId && (
            <div className="hidden flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-slate-500 lg:flex">
              <WhatsAppGlyph className="h-10 w-10 text-wa/40" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="max-w-xs text-xs">Thread detail, takeover, and replies appear here.</p>
            </div>
          )}

          {selectedId && (
            <>
              <div className="flex items-center justify-between border-b border-slate-200/80 px-4 py-3 lg:rounded-t-2xl lg:bg-gradient-to-r lg:from-wa/10 lg:to-electric/5">
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close"
                >
                  ←
                </button>
                <div className="min-w-0 flex-1 pl-2">
                  <p className="truncate font-bold text-slate-900">{detail.data?.customer_name || "Customer"}</p>
                  <p className="text-xs text-slate-500">WhatsApp · {detail.data?.status}</p>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-[200px] flex-1 space-y-3 overflow-y-auto p-4">
                  {detail.isLoading && <div className="h-32 animate-pulse rounded-xl bg-slate-100" />}
                  {detail.data?.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm ${
                          m.direction === "outbound"
                            ? "rounded-tr-sm bg-gradient-to-br from-wa-muted to-white text-slate-900 ring-1 ring-wa/25"
                            : "rounded-tl-sm bg-white text-slate-800 ring-1 ring-slate-200/80"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {m.direction === "outbound" ? (m.ai_generated ? "AI" : "You") : "Customer"} ·{" "}
                          {new Date(m.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-200/80 bg-slate-50/80 p-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={takeoverMut.isPending || !detail.data}
                      onClick={() => takeoverMut.mutate(!detail.data?.is_human_takeover)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:border-electric/40 disabled:opacity-50"
                    >
                      {detail.data?.is_human_takeover ? "Resume AI" : "Human takeover"}
                    </button>
                    <button
                      type="button"
                      disabled={reopenMut.isPending}
                      onClick={() => reopenMut.mutate()}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-sm hover:border-electric/40 disabled:opacity-50"
                    >
                      Re-open
                    </button>
                    <button
                      type="button"
                      disabled={ignoreMut.isPending}
                      onClick={() => ignoreMut.mutate()}
                      className="rounded-xl border border-red-200/80 bg-red-50 px-3 py-2 text-xs font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
                    >
                      Ignore
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="text-xs font-semibold text-slate-600">Manual reply</label>
                    <textarea
                      value={draftReply}
                      onChange={(e) => setDraftReply(e.target.value)}
                      rows={3}
                      placeholder="Type a message to send as your business…"
                      className="mt-1 w-full resize-none rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-sm outline-none ring-electric/20 focus:ring-2"
                    />
                    <button
                      type="button"
                      disabled={sendMut.isPending || !draftReply.trim()}
                      onClick={() => sendMut.mutate(draftReply.trim())}
                      className="btn-primary mt-2 w-full py-2.5 text-sm disabled:opacity-50"
                    >
                      {sendMut.isPending ? "Sending…" : "Send reply"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
