"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useApi } from "@/lib/api";
import { useSessionBootstrap } from "@/components/dashboard/SessionBootstrap";
import { useQueryErrorToast } from "@/lib/use-query-error-toast";
import { AppLogo } from "@/components/brand/AppLogo";
import { ChannelBadges } from "@/components/brand/ChannelBadges";
import { FacebookGlyph } from "@/components/brand/FacebookGlyph";
import { Skeleton } from "@/components/ui/skeleton";
import { FacebookThreadPanel } from "@/components/dashboard/FacebookThreadPanel";
import {
  InboxPlatformFilters,
  type PlatformFilter,
  type ThreadTypeFilter,
} from "@/components/dashboard/InboxPlatformFilters";

const WA_GREEN = "#25D366";

type ConversationRow = {
  id: string;
  platform: string;
  customer_name: string | null;
  customer_platform_id?: string | null;
  status: string;
  sentiment: string | null;
  is_human_takeover: boolean;
  facebook_thread_type?: string | null;
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

type ConversationDetail = ConversationRow & {
  messages: MessageRow[];
  post_context?: string | null;
  facebook_post_id?: string | null;
};

function formatWaPhoneDisplay(raw: string | null | undefined): string {
  if (!raw?.trim()) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw.trim();
  if (digits.length >= 10) return `+${digits}`;
  return digits;
}

function threadDisplayName(c: ConversationRow): string {
  const name = c.customer_name?.trim();
  if (name) return name;
  if (c.platform === "whatsapp") {
    const ph = formatWaPhoneDisplay(c.customer_platform_id ?? undefined);
    if (ph) return ph;
  }
  return "Customer";
}

function statusBadgeClass(status: string, escalated?: boolean) {
  if (escalated || status.toLowerCase() === "escalated") {
    return "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_4px_14px_-4px_rgba(249,115,22,0.55)] ring-2 ring-orange-300/60";
  }
  switch (status.toLowerCase()) {
    case "pending":
      return "bg-amber-50 text-amber-900 ring-amber-200/90";
    case "answered":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200/90";
    case "ignored":
      return "bg-slate-100 text-slate-600 ring-slate-200/90";
    case "limit_reached":
      return "bg-red-50 text-red-800 ring-red-200/90";
    default:
      return "bg-violet-50 text-violet-800 ring-violet-200/80";
  }
}

function statusLabel(status: string, escalated?: boolean) {
  if (escalated || status.toLowerCase() === "escalated") return "Escalated";
  const s = status.toLowerCase();
  if (s === "pending") return "Pending";
  if (s === "answered") return "Answered";
  if (s === "ignored") return "Ignored";
  if (s === "limit_reached") return "Limit reached";
  return status.replace(/_/g, " ");
}

function ListPlatformIcon({ platform }: { platform: string }) {
  if (platform === "facebook") {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-[#0866FF]/25">
        <FacebookGlyph className="h-4 w-4" />
      </span>
    );
  }
  if (platform === "whatsapp") {
    return (
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm ring-1 ring-black/10"
        style={{ backgroundColor: WA_GREEN }}
      >
        <Phone className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
      <span className="text-[10px] font-bold">?</span>
    </span>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-slate-200/70 rounded-2xl border border-white/60 bg-white/70">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-4 md:grid md:grid-cols-[1fr_140px_100px] md:items-center">
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-full max-w-md" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="hidden h-4 w-8 justify-self-end md:block" />
        </div>
      ))}
    </div>
  );
}

export default function InboxPage() {
  const api = useApi();
  const { ready: sessionReady } = useSessionBootstrap();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [threadTypeFilter, setThreadTypeFilter] = useState<ThreadTypeFilter>("all");
  const [draftReply, setDraftReply] = useState("");

  const list = useQuery({
    queryKey: ["conversations", platformFilter, threadTypeFilter, search],
    queryFn: async () => {
      const res = await api.get<ConversationRow[]>("/conversations", {
        params: {
          limit: 80,
          ...(platformFilter !== "all" ? { platform: platformFilter } : {}),
          ...(threadTypeFilter !== "all" ? { thread_type: threadTypeFilter } : {}),
          ...(search.trim() ? { q: search.trim() } : {}),
        },
      });
      return res.data;
    },
    enabled: sessionReady,
  });

  const detail = useQuery({
    queryKey: ["conversation", selectedId],
    queryFn: async () => {
      const res = await api.get<ConversationDetail>(`/conversations/${selectedId}`);
      return res.data;
    },
    enabled: !!selectedId,
  });

  useQueryErrorToast(list.isError, "Unable to load conversations.");
  useQueryErrorToast(detail.isError, "Unable to load conversation detail.");

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
    onError: () => toast.error("Takeover update failed."),
  });

  const ignoreMut = useMutation({
    mutationFn: async () => {
      await api.post(`/conversations/${selectedId}/ignore`);
    },
    onSuccess: () => {
      invalidate();
      setSelectedId(null);
    },
    onError: () => toast.error("Could not ignore conversation."),
  });

  const reopenMut = useMutation({
    mutationFn: async () => {
      await api.post(`/conversations/${selectedId}/reopen`);
    },
    onSuccess: invalidate,
    onError: () => toast.error("Could not reopen conversation."),
  });

  const sendMut = useMutation({
    mutationFn: async (content: string) => {
      await api.post(`/conversations/${selectedId}/messages`, { content });
    },
    onSuccess: () => {
      setDraftReply("");
      invalidate();
      toast.success("Message sent.");
    },
    onError: () => toast.error("Send failed."),
  });

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1 space-y-6">
        <div className="glass-card flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 shrink-0 items-center justify-center rounded-2xl bg-white px-2 ring-1 ring-slate-200/80">
              <ChannelBadges />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Inbox</h2>
              <p className="mt-1 text-sm text-slate-600">
                WhatsApp & Facebook threads filter by channel, then select a thread for takeover, ignore, reopen, or
                manual reply.
              </p>
            </div>
          </div>
          <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/80">
            {list.data?.length ?? 0} threads
          </span>
        </div>

        <div className="glass-card flex flex-col gap-4 p-4">
          <InboxPlatformFilters
            platform={platformFilter}
            threadType={threadTypeFilter}
            onPlatformChange={(v) => {
              setPlatformFilter(v);
              setSelectedId(null);
              if (v === "whatsapp") setThreadTypeFilter("all");
            }}
            onThreadTypeChange={(v) => {
              setThreadTypeFilter(v);
              setSelectedId(null);
            }}
          />
          <input
            type="search"
            placeholder="Search customer or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200/80 bg-white/90 px-4 py-2.5 text-sm outline-none ring-electric/20 focus:ring-2"
          />
        </div>

        {list.isLoading && <ConversationListSkeleton />}
        {list.error && !list.isLoading && (
          <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-4 text-sm text-red-900">
            Unable to load conversations. If you just signed in, wait a moment and refresh — or confirm the API is
            running.
          </div>
        )}

        {!list.isLoading && !list.error && (
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
                      <ListPlatformIcon platform={c.platform} />
                      <span className="truncate font-semibold text-slate-900">{threadDisplayName(c)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 pl-10 text-sm text-slate-600">
                      {c.last_message_preview || <span className="text-slate-400">No messages</span>}
                    </p>
                    <p className="pl-10 text-xs text-slate-400">{new Date(c.updated_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${statusBadgeClass(c.status, c.is_human_takeover)}`}
                    >
                      {statusLabel(c.status, c.is_human_takeover)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-700 md:text-right">{c.is_human_takeover ? "On" : "Off"}</div>
                </button>
              ))}
              {(list.data?.length ?? 0) === 0 && (
                <div className="px-6 py-16 text-center text-sm text-slate-500">
                  No threads yet for this filter. Connect WhatsApp under Channels or switch to All.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

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
              <AppLogo className="h-12 w-12 opacity-50" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="max-w-xs text-xs">Thread detail, takeover, and replies appear here.</p>
            </div>
          )}

          {selectedId && (
            <>
              <div
                className={`flex items-center justify-between border-b border-slate-200/80 px-4 py-3 lg:rounded-t-2xl ${
                  detail.data?.platform === "facebook"
                    ? "bg-gradient-to-r from-fb/10 to-electric-soft/40"
                    : "bg-gradient-to-r from-wa/10 to-electric/10"
                }`}
              >
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close"
                >
                  ←
                </button>
                <div className="min-w-0 flex-1 pl-2">
                  <p className="truncate font-bold text-slate-900">
                    {detail.data ? threadDisplayName(detail.data) : <Skeleton className="h-5 w-32" />}
                  </p>
                  <p className="text-xs text-slate-500">
                    {detail.data?.platform === "facebook" ? "Facebook" : "WhatsApp"} ·{" "}
                    {detail.data
                      ? statusLabel(detail.data.status, detail.data.is_human_takeover)
                      : "…"}
                  </p>
                </div>
              </div>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-[200px] flex-1 space-y-3 overflow-y-auto p-4">
                  {detail.isLoading && (
                    <div className="space-y-3">
                      <Skeleton className="ml-auto h-16 w-[85%] rounded-2xl" />
                      <Skeleton className="h-16 w-[85%] rounded-2xl" />
                      <Skeleton className="ml-auto h-16 w-[70%] rounded-2xl" />
                    </div>
                  )}
                  {detail.data?.platform === "facebook" && !detail.isLoading && (
                    <FacebookThreadPanel detail={detail.data} messages={detail.data.messages} />
                  )}
                  {detail.data?.platform === "whatsapp" &&
                    detail.data.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`mb-3 flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}
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
