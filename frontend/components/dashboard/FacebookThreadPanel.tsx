"use client";

import { FacebookGlyph } from "@/components/brand/FacebookGlyph";
import { cn } from "@/lib/utils";

const FB = "#1877F2";

export type FacebookThreadDetail = {
  platform: string;
  customer_name: string | null;
  customer_platform_id?: string | null;
  facebook_thread_type?: string | null;
  post_context?: string | null;
  facebook_post_id?: string | null;
};

type Message = {
  id: string;
  direction: string;
  content: string;
  ai_generated: boolean;
  created_at: string;
};

type Props = {
  detail: FacebookThreadDetail;
  messages: Message[];
};

/** ENH-003 — Facebook comment thread styling in inbox detail panel. */
export function FacebookThreadPanel({ detail, messages }: Props) {
  const isComment = detail.facebook_thread_type === "comment";
  const isDm = detail.facebook_thread_type === "dm" || !detail.facebook_thread_type;

  return (
    <>
      {detail.post_context && isComment && (
        <div className="mb-4 rounded-2xl border border-fb/25 bg-gradient-to-br from-electric-soft/50 via-white to-blue-50/80 p-4 shadow-inner ring-1 ring-fb/15">
          <p className="text-[10px] font-bold uppercase tracking-wider text-fb">Post context</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{detail.post_context}</p>
          {detail.facebook_post_id && (
            <p className="mt-2 font-mono text-[10px] text-slate-400">Post ID: {detail.facebook_post_id}</p>
          )}
        </div>
      )}

      <div className="mb-3 flex items-center gap-2 rounded-xl border border-fb/20 bg-white/80 px-3 py-2">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
          style={{ backgroundColor: FB }}
        >
          <FacebookGlyph className="h-4 w-4 text-white" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {detail.customer_name?.trim() || "Facebook customer"}
          </p>
          <p className="text-xs text-slate-500">
            {isComment ? "Public comment" : isDm ? "Messenger DM" : "Facebook thread"}
            {detail.customer_platform_id ? ` · ID ${detail.customer_platform_id}` : ""}
          </p>
        </div>
      </div>

      <div className={cn("space-y-3 border-l-4 pl-3", isComment ? "border-fb" : "border-fb/40")}>
        {messages.map((m) => {
          const outbound = m.direction === "outbound";
          const commentBubble = isComment && !outbound;
          return (
            <div key={m.id} className={cn("flex", outbound ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm shadow-sm",
                  outbound &&
                    "rounded-tr-sm bg-gradient-to-br from-electric-soft/80 to-white text-slate-900 ring-1 ring-fb/20",
                  !outbound &&
                    commentBubble &&
                    "rounded-tl-sm border border-fb/15 bg-white text-slate-800 ring-1 ring-slate-200/60",
                  !outbound &&
                    !commentBubble &&
                    "rounded-tl-sm bg-gradient-to-br from-fb/10 to-white text-slate-800 ring-1 ring-fb/25",
                )}
              >
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p className="mt-1 text-[10px] text-slate-500">
                  {outbound ? (m.ai_generated ? "AI" : "You") : "Customer"} ·{" "}
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
