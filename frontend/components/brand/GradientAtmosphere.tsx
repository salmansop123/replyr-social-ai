import { cn } from "@/lib/utils";

type Variant = "hero" | "section" | "dashboard" | "cta";

const orbSets: Record<Variant, { className: string; delay?: string }[]> = {
  hero: [
    { className: "left-[-12%] top-[8%] h-[520px] w-[520px] bg-electric/25 animate-float-orb-1" },
    { className: "right-[-8%] top-[20%] h-[480px] w-[480px] bg-wa/20 animate-float-orb-2", delay: "2s" },
    { className: "left-[30%] bottom-[-10%] h-[400px] w-[400px] bg-accent-cyan/18 animate-float-orb-1", delay: "4s" },
    { className: "right-[25%] top-[45%] h-[320px] w-[320px] bg-teal-brand/15 animate-float-orb-2", delay: "1s" },
    { className: "left-[55%] top-[5%] h-[280px] w-[280px] bg-accent-violet/12 animate-float-orb-2", delay: "3s" },
  ],
  section: [
    { className: "left-[-5%] top-[10%] h-[380px] w-[380px] bg-electric/18 animate-float-orb-1" },
    { className: "right-[-5%] bottom-[5%] h-[360px] w-[360px] bg-wa/16 animate-float-orb-2" },
    { className: "left-[40%] top-[50%] h-[260px] w-[260px] bg-accent-cyan/12 animate-float-orb-1", delay: "2s" },
  ],
  dashboard: [
    { className: "right-[-5%] top-[-5%] h-[420px] w-[420px] bg-electric/16 animate-float-orb-1" },
    { className: "left-[-8%] bottom-[10%] h-[380px] w-[380px] bg-wa/14 animate-float-orb-2" },
    { className: "right-[20%] bottom-[-8%] h-[300px] w-[300px] bg-teal-brand/12 animate-float-orb-1", delay: "3s" },
  ],
  cta: [
    { className: "left-[10%] top-[20%] h-[440px] w-[440px] bg-electric/22 animate-float-orb-1" },
    { className: "right-[5%] bottom-[10%] h-[400px] w-[400px] bg-wa/18 animate-float-orb-2" },
    { className: "left-[45%] top-[50%] h-[320px] w-[320px] bg-accent-cyan/16 animate-float-orb-2", delay: "2s" },
  ],
};

export function GradientAtmosphere({
  variant = "section",
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {orbSets[variant].map((orb, i) => (
        <div
          key={i}
          className={cn("absolute rounded-full blur-[100px] motion-reduce:opacity-40", orb.className)}
          style={orb.delay ? { animationDelay: orb.delay } : undefined}
        />
      ))}
    </div>
  );
}
