"use client";

import { useId } from "react";

type AppLogoProps = {
  className?: string;
};

/**
 * Replyr product mark: overlapping chat bubbles on an electric→cyan→green gradient,
 * with a small accent for “AI in the loop”. Distinct from any single-channel glyph.
 */
export function AppLogo({ className = "h-10 w-10" }: AppLogoProps) {
  const gid = useId().replace(/:/g, "");
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Replyr AI"
    >
      <defs>
        <linearGradient id={`${gid}-fill`} x1="4" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.5" stopColor="#06B6D4" />
          <stop offset="1" stopColor="#25D366" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${gid}-fill)`} />
      <path
        fill="white"
        fillOpacity="0.93"
        d="M11 13.5c0-1.38 1.12-2.5 2.5-2.5h7.5c1.1 0 2 .9 2 2v6.3c0 1.1-.9 2-2 2h-3.2l-3.1 3.8V21h-.7c-1.38 0-2.5-1.12-2.5-2.5v-5Z"
      />
      <path
        fill="white"
        fillOpacity="0.82"
        d="M19.5 11.5h7.5c1.38 0 2.5 1.12 2.5 2.5v7c0 1.38-1.12 2.5-2.5 2.5H24l-2.2 2.8V23.5h-2.3c-1.38 0-2.5-1.12-2.5-2.5v-7c0-1.38 1.12-2.5 2.5-2.5Z"
      />
      <circle cx="29" cy="9" r="3" fill="#FDE047" />
    </svg>
  );
}
