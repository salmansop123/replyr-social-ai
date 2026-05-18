import { FacebookGlyph } from "@/components/brand/FacebookGlyph";
import { WhatsAppGlyph } from "@/components/brand/WhatsAppGlyph";

/** Compact WhatsApp + Facebook row for marketing and dashboard hints. */
export function ChannelBadges({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-wa text-white shadow-sm ring-1 ring-wa/30">
        <WhatsAppGlyph className="h-3.5 w-3.5" />
      </span>
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-[#0866FF]/25">
        <FacebookGlyph className="h-3.5 w-3.5" />
      </span>
    </span>
  );
}
