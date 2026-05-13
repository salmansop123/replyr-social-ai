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
          DEFAULT: "#2563EB",
          bright: "#3B82F6",
          soft: "#DBEAFE",
        },
        wa: {
          DEFAULT: "#25D366",
          dark: "#128C7E",
          muted: "#DCFCE7",
          deep: "#075E54",
        },
        accent: {
          cyan: "#06B6D4",
          violet: "#7C3AED",
          violetsoft: "#EDE9FE",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(37, 99, 235, 0.45)",
        "glow-wa": "0 0 36px -8px rgba(37, 211, 102, 0.55)",
        card: "0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 12px 24px -6px rgba(15, 23, 42, 0.08)",
        lift: "0 20px 50px -20px rgba(15, 23, 42, 0.18)",
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(1200px 600px at 10% -10%, rgba(37,99,235,0.14), transparent 55%), radial-gradient(900px 500px at 100% 0%, rgba(124,58,237,0.12), transparent 50%), radial-gradient(800px 500px at 50% 100%, rgba(6,182,212,0.12), transparent 45%), radial-gradient(600px 400px at 0% 80%, rgba(37,211,102,0.1), transparent 50%)",
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
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-soft": "pulseSoft 3.5s ease-in-out infinite",
        "gradient-shift": "gradientShift 14s ease infinite",
      },
    },
  },
  plugins: [],
};
export default config;
