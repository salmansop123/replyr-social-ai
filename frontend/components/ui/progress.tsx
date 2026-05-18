import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  className?: string;
  indicatorClassName?: string;
};

export function Progress({ value, className, indicatorClassName }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={cn("h-2.5 w-full overflow-hidden rounded-full bg-slate-200/90", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-500", indicatorClassName)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
