"use client";

export type TsPoint = { date: string; inbound: number; outbound: number; leads: number };

const CHART_BAR_HEIGHT_PX = 200;

/** Stack segment heights that sum to at most CHART_BAR_HEIGHT_PX. */
function stackHeights(
  inbound: number,
  fbInbound: number,
  outbound: number,
  leads: number,
  showFb: boolean,
): { hIn: number; hFb: number; hOut: number; hLead: number } {
  const rawIn = Math.max(0, inbound);
  const rawFb = showFb ? Math.max(0, fbInbound) : 0;
  const rawOut = Math.max(0, outbound);
  const rawLead = Math.max(0, leads);
  const total = rawIn + rawFb + rawOut + rawLead;
  if (total <= 0) {
    return { hIn: 0, hFb: 0, hOut: 0, hLead: 0 };
  }
  const scale = Math.min(1, CHART_BAR_HEIGHT_PX / total);
  const minSeg = 4;
  let hIn = Math.max(minSeg, Math.round(rawIn * scale));
  let hFb = rawFb > 0 ? Math.max(minSeg, Math.round(rawFb * scale)) : 0;
  let hOut = Math.max(minSeg, Math.round(rawOut * scale));
  let hLead = Math.max(minSeg, Math.round(rawLead * scale));
  const sum = hIn + hFb + hOut + hLead;
  if (sum > CHART_BAR_HEIGHT_PX) {
    const shrink = CHART_BAR_HEIGHT_PX / sum;
    hIn = Math.round(hIn * shrink);
    hFb = Math.round(hFb * shrink);
    hOut = Math.round(hOut * shrink);
    hLead = Math.round(hLead * shrink);
  }
  return { hIn, hFb, hOut, hLead };
}

type Props = {
  points: TsPoint[];
  facebookPoints?: TsPoint[];
};

export function AnalyticsActivityChart({ points, facebookPoints }: Props) {
  const fb = facebookPoints ?? [];
  if (!points.length && !fb.length) {
    return (
      <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-200/80 bg-white/50 text-sm text-slate-500">
        No activity in this range yet.
      </div>
    );
  }

  const last = (points.length ? points : fb).slice(-14);
  const fbByDate = new Map(fb.map((p) => [p.date, p]));

  return (
    <div className="space-y-4">
      <div className="flex h-[240px] items-end gap-1 sm:gap-1.5">
        {last.map((p) => {
          const fbPoint = fbByDate.get(p.date);
          const { hIn, hFb, hOut, hLead } = stackHeights(
            p.inbound,
            fbPoint?.inbound ?? 0,
            p.outbound,
            p.leads,
            fb.length > 0,
          );
          return (
            <div key={p.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
              <div
                className="flex w-full max-w-[14px] flex-col justify-end gap-px sm:max-w-[20px]"
                style={{ height: CHART_BAR_HEIGHT_PX }}
              >
                <div
                  className="w-full rounded-t-sm bg-gradient-to-t from-electric to-electric-bright opacity-90 transition-all group-hover:opacity-100"
                  style={{ height: hIn }}
                  title={`All inbound: ${p.inbound}`}
                />
                {fb.length > 0 && hFb > 0 && (
                  <div
                    className="w-full bg-gradient-to-t from-fb to-fb/70 opacity-90 transition-all group-hover:opacity-100"
                    style={{ height: hFb }}
                    title={`Facebook inbound: ${fbPoint?.inbound ?? 0}`}
                  />
                )}
                <div
                  className="w-full bg-gradient-to-t from-teal-brand to-accent-cyan opacity-90 transition-all group-hover:opacity-100"
                  style={{ height: hOut }}
                  title={`Outbound: ${p.outbound}`}
                />
                <div
                  className="w-full rounded-b-sm bg-gradient-to-t from-slate-400/80 to-slate-300/80 opacity-90 transition-all group-hover:opacity-100"
                  style={{ height: hLead }}
                  title={`Leads: ${p.leads}`}
                />
              </div>
              <span className="hidden text-[9px] font-medium text-slate-400 sm:block">
                {p.date.slice(5).replace("-", "/")}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-slate-500">
        Last 14 days · blue = all inbound, Facebook blue segment = Facebook inbound only
      </p>
    </div>
  );
}
