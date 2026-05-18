"use client";

import { cn } from "@/lib/utils";

/** WhatsApp-style phone with looping CSS chat sequence (see globals.css). */
export function HeroPhoneMock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[280px] rounded-[2rem] border border-slate-200/90 bg-white p-2 shadow-premium motion-reduce:shadow-card",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-inset ring-white/5" />
      <div className="mx-auto mb-2 h-5 w-20 rounded-full bg-black/40" />
      <div className="rounded-[1.35rem] bg-[#0a141e] pb-3 pt-2">
        <div className="flex items-center gap-2 border-b border-white/5 px-3 pb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#25D366] text-xs font-bold text-white">
            S
          </div>
          <div>
            <p className="text-xs font-semibold text-white">GlowSkin Shop</p>
            <p className="text-[10px] text-[#25D366]">online</p>
          </div>
        </div>
        <div className="relative mt-2 min-h-[320px] space-y-2 px-2 sm:min-h-[340px]">
          <div className="marketing-chat-msg1">
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-[#202c33] px-3 py-2 text-[11px] leading-snug text-gray-100">
              <p className="text-[9px] font-medium uppercase tracking-wide text-gray-500">Customer</p>
              <p>Hi! Is the lavender soap good for oily skin? 🤔</p>
            </div>
          </div>
          <div className="marketing-chat-typing pl-1">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#202c33] px-3 py-2">
              <span className="text-[10px] text-gray-500">Replyr AI is typing</span>
              <span className="flex gap-0.5">
                <span
                  className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-gray-400 motion-reduce:animate-none"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-gray-400 motion-reduce:animate-none"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-bounce-dot rounded-full bg-gray-400 motion-reduce:animate-none"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            </div>
          </div>
          <div className="marketing-chat-msg2 flex justify-end">
            <div className="max-w-[92%] rounded-2xl rounded-br-md bg-[#005c4b] px-3 py-2 text-[11px] leading-snug text-white">
              <p className="text-[9px] font-medium uppercase tracking-wide text-emerald-200/80">Business</p>
              <p>
                Hey! Actually our Charcoal Detox soap works better for oily skin 😊 The lavender one is great for
                sensitive/dry. Want me to send you both? Free shipping over $50!
              </p>
            </div>
          </div>
          <div className="marketing-chat-msg3">
            <div className="max-w-[92%] rounded-2xl rounded-bl-md bg-[#202c33] px-3 py-2 text-[11px] leading-snug text-gray-100">
              <p className="text-[9px] font-medium uppercase tracking-wide text-gray-500">Customer</p>
              <p>Yes please! How do I order?</p>
            </div>
          </div>
          <div className="marketing-chat-msg4 flex justify-end">
            <div className="max-w-[92%] rounded-2xl rounded-br-md bg-[#005c4b] px-3 py-2 text-[11px] leading-snug text-white">
              <p className="text-[9px] font-medium uppercase tracking-wide text-emerald-200/80">Business</p>
              <p>Great choice! You can order at our link in bio 🛒 Use code HELLO10 for 10% off your first order!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
