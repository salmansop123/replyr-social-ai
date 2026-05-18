"use client";

import { FacebookGlyph } from "@/components/brand/FacebookGlyph";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";
import { cn } from "@/lib/utils";

const WA = "#25D366";
const FB = "#1877F2";

export type PlatformFilter = "all" | "whatsapp" | "facebook";
export type ThreadTypeFilter = "all" | "comment" | "dm";

type Props = {
  platform: PlatformFilter;
  threadType: ThreadTypeFilter;
  onPlatformChange: (v: PlatformFilter) => void;
  onThreadTypeChange: (v: ThreadTypeFilter) => void;
};

/** ENH-002 — polished inbox channel + thread type filters. */
export function InboxPlatformFilters({
  platform,
  threadType,
  onPlatformChange,
  onThreadTypeChange,
}: Props) {
  const platformOptions: { id: PlatformFilter; label: string; icon?: React.ReactNode; activeClass: string }[] = [
    { id: "all", label: "All", activeClass: "bg-slate-900 text-white ring-slate-900" },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: <WhatsAppGlyph className="h-3.5 w-3.5 text-white" />,
      activeClass: "text-white ring-2 ring-wa/40 shadow-glow-wa-soft",
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: <FacebookGlyph className="h-3.5 w-3.5 text-white" />,
      activeClass: "text-white ring-2 ring-fb/40",
    },
  ];

  const threadOptions: { id: ThreadTypeFilter; label: string }[] = [
    { id: "all", label: "All types" },
    { id: "comment", label: "Comments" },
    { id: "dm", label: "Direct messages" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Platform</span>
        {platformOptions.map((opt) => {
          const active = platform === opt.id;
          const style =
            opt.id === "whatsapp" && active
              ? { backgroundColor: WA }
              : opt.id === "facebook" && active
                ? { backgroundColor: FB }
                : undefined;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onPlatformChange(opt.id)}
              style={style}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition-all",
                active
                  ? opt.activeClass
                  : "bg-white/90 text-slate-700 ring-1 ring-slate-200/80 hover:bg-slate-50",
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          );
        })}
      </div>
      {(platform === "all" || platform === "facebook") && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Type</span>
          {threadOptions.map((opt) => {
            const active = threadType === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onThreadTypeChange(opt.id)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  active
                    ? "bg-gradient-to-r from-fb/90 to-electric text-white shadow-sm ring-1 ring-fb/30"
                    : "bg-white/90 text-slate-600 ring-1 ring-slate-200/80 hover:text-slate-900",
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
