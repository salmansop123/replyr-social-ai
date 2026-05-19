"use client";

export type TsPoint = { date: string; inbound: number; outbound: number; leads: number };

const CHART_BAR_HEIGHT_PX = 220;
const MIN_COLUMN_PX = 28;

function dayActivityTotal(p: TsPoint) {
  return Math.max(0, p.inbound) + Math.max(0, p.outbound) + Math.max(0, p.leads);
}

/** Segment heights (px) for one day; Facebook inbound is a subset of total inbound (not additive). */
function stackHeights(
  inbound: number,
  fbInbound: number,
  outbound: number,
  leads: number,
  columnHeightPx: number,
  showFb: boolean,
): { hInWa: number; hFb: number; hOut: number; hLead: number } {
  const rawFb = showFb ? Math.max(0, Math.min(fbInbound, inbound)) : 0;
  const rawInWa = Math.max(0, inbound - rawFb);
  const rawOut = Math.max(0, outbound);
  const rawLead = Math.max(0, leads);
  const total = rawInWa + rawFb + rawOut + rawLead;
  if (total <= 0 || columnHeightPx <= 0) {
    return { hInWa: 0, hFb: 0, hOut: 0, hLead: 0 };
  }

  const scale = columnHeightPx / total;
  let hInWa = Math.round(rawInWa * scale);
  let hFb = Math.round(rawFb * scale);
  let hOut = Math.round(rawOut * scale);
  let hLead = Math.round(rawLead * scale);

  const sum = hInWa + hFb + hOut + hLead;
  const diff = columnHeightPx - sum;
  if (diff !== 0) {
    const target = hInWa >= hOut ? (hInWa >= hLead ? "in" : "lead") : hOut >= hLead ? "out" : "lead";
    if (target === "in") hInWa += diff;
    else if (target === "out") hOut += diff;
    else hLead += diff;
  }

  return { hInWa, hFb, hOut, hLead };
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
  const maxDayTotal = Math.max(...last.map((p) => dayActivityTotal(p)), 1);

  return (
    <div className="space-y-4">
      <div className="flex h-[260px] items-end justify-between gap-1 sm:gap-2">
        {last.map((p) => {
          const fbPoint = fbByDate.get(p.date);
          const dayTotal = dayActivityTotal(p);
          const columnHeight = Math.max(
            MIN_COLUMN_PX,
            Math.round((dayTotal / maxDayTotal) * CHART_BAR_HEIGHT_PX),
          );
          const { hInWa, hFb, hOut, hLead } = stackHeights(
            p.inbound,
            fbPoint?.inbound ?? 0,
            p.outbound,
            p.leads,
            columnHeight,
            fb.length > 0,
          );
          return (
            <div
              key={p.date}
              className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-1.5"
              style={{ maxWidth: 32 }}
            >
              <div
                className="flex w-full min-w-[12px] max-w-[28px] flex-col justify-end gap-px"
                style={{ height: CHART_BAR_HEIGHT_PX }}
              >
                <div
                  className="flex w-full flex-col justify-end gap-px"
                  style={{ height: columnHeight }}
                >
                  {hInWa > 0 && (
                    <div
                      className="w-full bg-gradient-to-t from-electric to-electric-bright opacity-95 transition-all group-hover:opacity-100"
                      style={{ height: hInWa }}
                      title={`Inbound (excl. FB overlap): ${Math.max(0, p.inbound - (fbPoint?.inbound ?? 0))}`}
                    />
                  )}
                  {fb.length > 0 && hFb > 0 && (
                    <div
                      className="w-full bg-gradient-to-t from-fb to-fb/75 opacity-95 transition-all group-hover:opacity-100"
                      style={{ height: hFb }}
                      title={`Facebook inbound: ${fbPoint?.inbound ?? 0}`}
                    />
                  )}
                  {hOut > 0 && (
                    <div
                      className="w-full bg-gradient-to-t from-teal-brand to-accent-cyan opacity-95 transition-all group-hover:opacity-100"
                      style={{ height: hOut }}
                      title={`Outbound: ${p.outbound}`}
                    />
                  )}
                  {hLead > 0 && (
                    <div
                      className="w-full rounded-b-sm bg-gradient-to-t from-slate-500 to-slate-400 opacity-95 transition-all group-hover:opacity-100"
                      style={{ height: hLead }}
                      title={`Leads: ${p.leads}`}
                    />
                  )}
                </div>
              </div>
              <span className="text-[9px] font-medium text-slate-500 sm:text-[10px]">
                {p.date.slice(5).replace("-", "/")}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-slate-500">
        Last 14 days · blue = inbound, teal = outbound, grey = leads, darker blue = Facebook inbound
      </p>
    </div>
  );
}
