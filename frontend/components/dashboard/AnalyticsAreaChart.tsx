"use client";

export type TsPoint = { date: string; inbound: number; outbound: number; leads: number };

function maxVal(points: TsPoint[]) {
  let m = 1;
  for (const p of points) {
    m = Math.max(m, p.inbound + p.outbound + p.leads);
  }
  return m;
}

export function AnalyticsActivityChart({ points }: { points: TsPoint[] }) {
  if (!points.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-white/50 text-sm text-slate-500">
        No activity in this range yet.
      </div>
    );
  }

  const cap = maxVal(points);
  const last = points.slice(-14);

  return (
    <div className="space-y-4">
      <div className="flex h-[240px] items-end gap-1 sm:gap-1.5">
        {last.map((p) => {
          const hIn = (p.inbound / cap) * 100;
          const hOut = (p.outbound / cap) * 100;
          const hLead = (p.leads / cap) * 100;
          return (
            <div key={p.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div className="flex w-full max-w-[14px] flex-col justify-end gap-px sm:max-w-[18px]">
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-electric to-electric-bright opacity-90 transition-all group-hover:opacity-100"
                  style={{ height: `${Math.max(4, hIn)}%` }}
                  title={`Inbound: ${p.inbound}`}
                />
                <div
                  className="w-full bg-gradient-to-t from-teal-brand to-accent-cyan opacity-90 transition-all group-hover:opacity-100"
                  style={{ height: `${Math.max(2, hOut)}%` }}
                  title={`Outbound: ${p.outbound}`}
                />
                <div
                  className="w-full rounded-b-sm bg-gradient-to-t from-fb/90 to-electric-bright opacity-90 transition-all group-hover:opacity-100"
                  style={{ height: `${Math.max(2, hLead)}%` }}
                  title={`Leads: ${p.leads}`}
                />
              </div>
              <span className="hidden rotate-0 text-[9px] font-medium text-slate-400 sm:block">
                {p.date.slice(5).replace("-", "/")}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-slate-500">Last 14 days shown · hover segments for counts (via tooltip title)</p>
    </div>
  );
}
