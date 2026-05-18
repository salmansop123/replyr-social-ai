import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        electric: {
          DEFAULT: "#3B82F6",
          bright: "#60A5FA",
          soft: "#EFF6FF",
        },
        wa: {
          DEFAULT: "#25D366",
          dark: "#128C7E",
          muted: "#DCFCE7",
          deep: "#075E54",
          /** Light mint — accents on white without WA saturation */
          light: "#86EFAC",
        },
        brand: {
          navy: "#0f172a",
          cyan: "#06B6D4",
          "cyan-dim": "#0891b2",
        },
        fb: "#1877F2",
        accent: {
          cyan: "#22D3EE",
          violet: "#8B5CF6",
          violetsoft: "#EDE9FE",
        },
        teal: {
          brand: "#14b8a6",
          soft: "#5EEAD4",
          muted: "#CCFBF1",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
        heading: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(59, 130, 246, 0.35)",
        "glow-wa": "0 0 36px -8px rgba(37, 211, 102, 0.45)",
        "glow-teal": "0 8px 32px -12px rgba(20, 184, 166, 0.22)",
        "glow-accent":
          "0 4px 24px -4px rgba(59, 130, 246, 0.4), 0 2px 14px -4px rgba(37, 211, 102, 0.25), 0 0 0 1px rgba(20, 184, 166, 0.1)",
        "glow-neon":
          "0 0 48px -12px rgba(59, 130, 246, 0.35), 0 0 32px -16px rgba(37, 211, 102, 0.28)",
        "glow-wa-soft": "0 8px 28px -8px rgba(37, 211, 102, 0.35)",
        card: "0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 12px 24px -8px rgba(15, 23, 42, 0.07)",
        lift: "0 20px 50px -24px rgba(15, 23, 42, 0.14), 0 0 0 1px rgba(15, 23, 42, 0.04)",
        premium:
          "0 8px 32px -12px rgba(59, 130, 246, 0.22), 0 4px 16px -8px rgba(20, 184, 166, 0.12), 0 0 0 1px rgba(15, 23, 42, 0.04)",
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(1200px 600px at 10% -10%, rgba(59,130,246,0.16), transparent 55%), radial-gradient(900px 500px at 100% 0%, rgba(37,211,102,0.12), transparent 50%), radial-gradient(800px 500px at 50% 100%, rgba(34,211,238,0.12), transparent 45%), radial-gradient(600px 400px at 0% 80%, rgba(134,239,172,0.14), transparent 50%)",
        "mesh-animated":
          "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(59,130,246,0.14), transparent), radial-gradient(ellipse 70% 50% at 80% 30%, rgba(37,211,102,0.12), transparent), radial-gradient(ellipse 60% 45% at 50% 90%, rgba(34,211,238,0.1), transparent)",
        "gradient-brand":
          "linear-gradient(105deg, #3b82f6 0%, #22d3ee 38%, #25d366 72%, #14b8a6 100%)",
        "gradient-hero":
          "linear-gradient(165deg, #eff6ff 0%, #ecfeff 28%, #ecfdf5 58%, #f8fafc 100%)",
        "gradient-section-blue":
          "linear-gradient(180deg, #eff6ff 0%, #f8fafc 100%)",
        "gradient-section-green":
          "linear-gradient(180deg, #ecfdf5 0%, #f0fdf9 50%, #ffffff 100%)",
        "gradient-brand-soft":
          "linear-gradient(135deg, rgba(59,130,246,0.09) 0%, rgba(34,211,238,0.08) 45%, rgba(45,212,191,0.1) 100%)",
        "gradient-hairline":
          "linear-gradient(90deg, transparent, rgba(59,130,246,0.35), rgba(45,212,191,0.35), rgba(37,211,102,0.3), transparent)",
        "hero-shine":
          "linear-gradient(120deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 60%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        floatOrb1: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(40px, -30px)" },
        },
        floatOrb2: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(-30px, 40px)" },
        },
        heroWord: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulseBadge: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(1.3)" },
        },
        bounceDot: {
          "0%, 80%, 100%": { transform: "translateY(0)" },
          "40%": { transform: "translateY(-6px)" },
        },
        floatBadge: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-soft": "pulseSoft 3.5s ease-in-out infinite",
        "gradient-shift": "gradientShift 14s ease infinite",
        "float-orb-1": "floatOrb1 22s ease-in-out infinite",
        "float-orb-2": "floatOrb2 28s ease-in-out infinite",
        "hero-word": "heroWord 0.65s ease forwards",
        "pulse-badge": "pulseBadge 1.6s ease-in-out infinite",
        "bounce-dot": "bounceDot 1s ease-in-out infinite",
        "float-badge": "floatBadge 4s ease-in-out infinite",
        marquee: "marquee 48s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
