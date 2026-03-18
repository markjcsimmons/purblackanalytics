'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { format } from 'date-fns';

type Timeframe = '4w' | '12w' | '52w';

export type MetricsHistoryPoint = {
  weekId: number;
  weekStartDate: string;
  weekEndDate: string;
  metrics: Record<string, number>;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function median(values: number[]) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function rollingMedian(values: number[], window: number) {
  const w = Math.max(1, Math.floor(window));
  const out: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - (w - 1));
    const slice = values.slice(start, i + 1);
    out.push(median(slice));
  }
  return out;
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function linearRegressionSlopeAndIntercept(xs: number[], ys: number[]): { slope: number; intercept: number } {
  if (xs.length !== ys.length || xs.length < 2) return { slope: 0, intercept: mean(ys) };
  const xBar = mean(xs);
  const yBar = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - xBar;
    num += dx * (ys[i] - yBar);
    den += dx * dx;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: yBar - slope * xBar };
}

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function getWeeksCount(tf: Timeframe): number {
  return tf === '4w' ? 4 : tf === '12w' ? 12 : 52;
}

function getWindowPoints(points: MetricsHistoryPoint[], startMs: number, endMs: number) {
  return points.filter((p) => {
    const t = new Date(p.weekStartDate).getTime();
    return t >= startMs && t <= endMs;
  });
}

function aggValues(values: number[], mode: 'sum' | 'mean'): number {
  if (!values.length) return 0;
  return mode === 'sum' ? values.reduce((a, b) => a + b, 0) : mean(values);
}

function pctChange(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null;
  return ((current - prior) / Math.abs(prior)) * 100;
}

function LineChart({
  points,
  formatValue,
  trendPoints,
}: {
  points: Array<{ xLabel: string; xDate: Date; y: number }>;
  formatValue: (v: number) => string;
  trendPoints?: Array<{ xLabel: string; xDate: Date; y: number }>;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 900;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 44 };

  const ys = points.map((p) => p.y).concat(trendPoints ? trendPoints.map((p) => p.y) : []);
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 0;
  const range = maxY - minY || 1;

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const coords = points.map((p, i) => {
    const x = padding.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
    const yPx = padding.top + (1 - (p.y - minY) / range) * plotH;
    return { ...p, x, yPx };
  });

  const trendCoords = (trendPoints || []).map((p, i) => {
    const x =
      padding.left +
      (trendPoints && trendPoints.length === 1 ? plotW / 2 : (i / ((trendPoints?.length || 1) - 1)) * plotW);
    const yPx = padding.top + (1 - (p.y - minY) / range) * plotH;
    return { ...p, x, yPx };
  });

  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.yPx.toFixed(2)}`).join(' ');
  const trendPath = trendCoords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.yPx.toFixed(2)}`)
    .join(' ');

  const xLeft = points[0]?.xDate;
  const xRight = points[points.length - 1]?.xDate;

  const hovered = hoverIdx !== null ? coords[hoverIdx] : null;
  const hoveredTrend =
    hoverIdx !== null && trendPoints && trendPoints.length === coords.length ? trendPoints[hoverIdx] : null;
  const tooltip = hovered
    ? {
        date: format(hovered.xDate, 'MMM d, yyyy'),
        value: formatValue(hovered.y),
        trendValue: hoveredTrend ? formatValue(hoveredTrend.y) : null,
        x: hovered.x,
        yPx: hovered.yPx,
      }
    : null;

  const handleMove: React.MouseEventHandler<SVGSVGElement> = (e) => {
    if (!coords.length) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const t = coords.length === 1 ? 0 : (x - padding.left) / plotW;
    const idx = coords.length === 1 ? 0 : Math.round(clamp(t, 0, 1) * (coords.length - 1));
    setHoverIdx(idx);
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={width}
        height={height}
        className="block"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padding.top + t * plotH;
          return <line key={t} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e5e7eb" />;
        })}
        {[maxY, minY].map((v, idx) => {
          const y = padding.top + (idx === 0 ? 0 : plotH);
          return (
            <text key={idx} x={8} y={y + 4} fontSize="11" fill="#64748b">
              {formatValue(v)}
            </text>
          );
        })}
        <path d={path} fill="none" stroke="#0f766e" strokeWidth="2.5" />
        {trendPoints && trendCoords.length > 1 && (
          <path d={trendPath} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeDasharray="6 4" />
        )}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.yPx} r="3" fill="#0f766e" />
        ))}
        {tooltip && (
          <>
            <line
              x1={tooltip.x}
              x2={tooltip.x}
              y1={padding.top}
              y2={height - padding.bottom}
              stroke="#94a3b8"
              strokeDasharray="4 4"
            />
            <circle cx={tooltip.x} cy={tooltip.yPx} r="5" fill="#0f766e" stroke="#ffffff" strokeWidth="2" />
            {(() => {
              const boxW = 170;
              const boxH = 46;
              const x = clamp(tooltip.x + 10, padding.left, width - padding.right - boxW);
              const y = clamp(tooltip.yPx - boxH - 10, padding.top, height - padding.bottom - boxH);
              return (
                <g>
                  <rect x={x} y={y} width={boxW} height={boxH} rx={8} fill="#0f172a" opacity={0.92} />
                  <text x={x + 10} y={y + 18} fontSize="11" fill="#e2e8f0">
                    {tooltip.date}
                  </text>
                  <text x={x + 10} y={y + 36} fontSize="12" fill="#ffffff" fontWeight={700 as any}>
                    {tooltip.value}
                    {tooltip.trendValue ? `  •  Median: ${tooltip.trendValue}` : ''}
                  </text>
                </g>
              );
            })()}
          </>
        )}
        {xLeft && (
          <text x={padding.left} y={height - 8} fontSize="11" fill="#64748b">
            {format(xLeft, 'MMM d, yyyy')}
          </text>
        )}
        {xRight && (
          <text x={width - padding.right} y={height - 8} fontSize="11" fill="#64748b" textAnchor="end">
            {format(xRight, 'MMM d, yyyy')}
          </text>
        )}
      </svg>
    </div>
  );
}

function StatRow({
  label,
  value,
  pct,
  isGood,
  tooltip,
}: {
  label: string;
  value?: string;
  pct?: number | null;
  isGood?: boolean | null;
  tooltip?: string;
}) {
  const pctStr =
    pct === null || pct === undefined
      ? '—'
      : !isFinite(pct)
      ? 'N/A'
      : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;
  const color =
    pct === null || pct === undefined || !isFinite(pct)
      ? 'text-slate-500'
      : isGood === true
      ? 'text-emerald-700'
      : isGood === false
      ? 'text-red-600'
      : 'text-slate-700';

  return (
    <div className="flex items-baseline justify-between gap-4 text-sm" title={tooltip}>
      <span className="text-slate-500 whitespace-nowrap">{label}</span>
      <span className={`font-semibold ${value ? 'text-slate-900' : color}`}>{value ?? pctStr}</span>
    </div>
  );
}

function MetricCard({
  title,
  description,
  points,
  formatValue,
  higherIsBetter = true,
  aggMode = 'sum',
  defaultTimeframe = '4w',
}: {
  title: string;
  description: string;
  points: MetricsHistoryPoint[];
  formatValue: (v: number) => string;
  higherIsBetter?: boolean;
  aggMode?: 'sum' | 'mean';
  defaultTimeframe?: Timeframe;
}) {
  const [tf, setTf] = useState<Timeframe>(defaultTimeframe);
  const [showMedian, setShowMedian] = useState(false);
  const medianWindow = 3;

  const weeks = getWeeksCount(tf);

  // Anchor = most recent data point
  const anchorMs = useMemo(
    () => (points.length ? new Date(points[points.length - 1].weekStartDate).getTime() : Date.now()),
    [points]
  );

  // Current window: last N weeks
  const currentWindowPoints = useMemo(() => {
    const start = anchorMs - weeks * WEEK_MS;
    return getWindowPoints(points, start, anchorMs);
  }, [points, anchorMs, weeks]);

  // Chart series = current window
  const series = useMemo(
    () =>
      currentWindowPoints.map((p) => ({
        xLabel: p.weekStartDate,
        xDate: new Date(p.weekStartDate),
        y: p.metrics[title] ?? 0,
      })),
    [currentWindowPoints, title]
  );

  const medianSeries = useMemo(() => {
    if (!showMedian || series.length < 2) return null;
    const med = rollingMedian(series.map((p) => p.y), medianWindow);
    return series.map((p, i) => ({ ...p, y: med[i] }));
  }, [series, showMedian]);

  // Period total/avg (displayed in the stat box)
  const currentVals = useMemo(
    () => currentWindowPoints.map((p) => p.metrics[title] ?? 0),
    [currentWindowPoints, title]
  );
  const periodAgg = aggValues(currentVals, aggMode);

  // Per-week average for the current window — used for all comparisons so
  // sparse prior windows don't inflate/deflate percentages.
  const currentPerWeekAvg = currentVals.length ? mean(currentVals) : 0;

  // Require at least half the expected weeks before showing a comparison.
  const minComparisonWeeks = Math.max(1, Math.ceil(weeks / 2));

  // Prior period: N weeks immediately before current window
  const priorPerWeekAvg = useMemo(() => {
    const windowStart = anchorMs - weeks * WEEK_MS;
    const priorStart = windowStart - weeks * WEEK_MS;
    const priorPts = getWindowPoints(points, priorStart, windowStart - 1);
    const vals = priorPts.map((p) => p.metrics[title] ?? 0);
    return vals.length >= minComparisonWeeks ? mean(vals) : null;
  }, [points, anchorMs, weeks, title, minComparisonWeeks]);

  // YoY: same window 52 weeks ago
  const yoyPerWeekAvg = useMemo(() => {
    const windowStart = anchorMs - weeks * WEEK_MS;
    const yoyEnd = anchorMs - 52 * WEEK_MS;
    const yoyStart = windowStart - 52 * WEEK_MS;
    const yoyPts = getWindowPoints(points, yoyStart, yoyEnd);
    const vals = yoyPts.map((p) => p.metrics[title] ?? 0);
    return vals.length >= minComparisonWeeks ? mean(vals) : null;
  }, [points, anchorMs, weeks, title, minComparisonWeeks]);

  // Trend: linear regression on ALL data, predict per-week avg for current window
  const trendPerWeekAvg = useMemo(() => {
    const allWithVals = points.filter((p) => Object.prototype.hasOwnProperty.call(p.metrics, title));
    if (allWithVals.length < 2 || !currentWindowPoints.length) return null;
    const t0 = new Date(allWithVals[0].weekStartDate).getTime();
    const xs = allWithVals.map((p) => (new Date(p.weekStartDate).getTime() - t0) / WEEK_MS);
    const ys = allWithVals.map((p) => p.metrics[title]);
    const { slope, intercept } = linearRegressionSlopeAndIntercept(xs, ys);
    const predicted = currentWindowPoints.map((p) => {
      const x = (new Date(p.weekStartDate).getTime() - t0) / WEEK_MS;
      return slope * x + intercept;
    });
    return mean(predicted);
  }, [points, currentWindowPoints, title]);

  // All comparisons use per-week averages on both sides → apples-to-apples
  const vsPrior = priorPerWeekAvg !== null ? pctChange(currentPerWeekAvg, priorPerWeekAvg) : null;
  const vsYoy = yoyPerWeekAvg !== null ? pctChange(currentPerWeekAvg, yoyPerWeekAvg) : null;
  const vsTrend = trendPerWeekAvg !== null ? pctChange(currentPerWeekAvg, trendPerWeekAvg) : null;

  const isGood = (pct: number | null) =>
    pct === null ? null : pct > 0 ? higherIsBetter : pct < 0 ? !higherIsBetter : null;

  const tfLabel = tf === '4w' ? '4 weeks' : tf === '12w' ? '12 weeks' : '52 weeks';
  const aggLabel = aggMode === 'sum' ? 'Total' : 'Avg';

  const btnClass = (active: boolean) =>
    active
      ? 'bg-teal-600 text-white hover:bg-teal-700 border-teal-600'
      : 'border border-slate-200 text-slate-700 hover:bg-slate-50 bg-white';

  return (
    <Card className="border-2 border-emerald-100">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${btnClass(showMedian)}`}
              onClick={() => setShowMedian((v) => !v)}
              title="Rolling 3-week trailing median"
            >
              Median trend
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${btnClass(tf === '4w')}`}
              onClick={() => setTf('4w')}
            >
              4 weeks
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${btnClass(tf === '12w')}`}
              onClick={() => setTf('12w')}
            >
              12 weeks
            </button>
            <button
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${btnClass(tf === '52w')}`}
              onClick={() => setTf('52w')}
            >
              52 weeks
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start justify-between gap-6">
          <div className="text-sm text-slate-500">
            Showing last <span className="font-semibold text-slate-800">{tfLabel}</span>
          </div>
          <div className="flex flex-col gap-1.5 min-w-[220px]">
            <StatRow label={`${aggLabel} (${tfLabel})`} value={formatValue(periodAgg)} />
            <StatRow
              label="vs Prior period"
              pct={vsPrior}
              isGood={isGood(vsPrior)}
              tooltip={`${aggLabel} of previous ${tfLabel}`}
            />
            <StatRow
              label="vs Same period last yr"
              pct={vsYoy}
              isGood={isGood(vsYoy)}
              tooltip={`${aggLabel} of same ${tfLabel} one year ago`}
            />
            <StatRow
              label="vs Trend"
              pct={vsTrend}
              isGood={isGood(vsTrend)}
              tooltip="Actual vs linear regression projection for this period"
            />
          </div>
        </div>
        <LineChart points={series} trendPoints={medianSeries || undefined} formatValue={formatValue} />
      </CardContent>
    </Card>
  );
}

export function MetricHistoryCharts({ history }: { history: MetricsHistoryPoint[] }) {
  const sorted = useMemo(() => {
    const h = [...history];
    h.sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
    return h;
  }, [history]);

  const hasAny = sorted.length > 0;

  const normalized = useMemo(() => {
    return sorted.map((p) => ({
      ...p,
      metrics: {
        Revenue: p.metrics['Revenue'] ?? 0,
        'Conversion Rate': p.metrics['Conversion Rate'] ?? 0,
        AOV: p.metrics['AOV'] ?? 0,
        'Total Sessions': p.metrics['Total Sessions'] ?? 0,
        'Checkout Abandonment Rate': p.metrics['Checkout Abandonment Rate'] ?? 0,
      },
    }));
  }, [sorted]);

  if (!hasAny) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          No historical data yet. Upload at least 2 weeks to see charts.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <MetricCard
        title="Revenue"
        description="Weekly total revenue (USD)"
        points={normalized}
        formatValue={(v) => formatCurrency(v)}
        aggMode="sum"
        defaultTimeframe="4w"
      />
      <MetricCard
        title="Conversion Rate"
        description="Weekly conversion rate (%)"
        points={normalized}
        formatValue={(v) => `${clamp(v, 0, 100).toFixed(2)}%`}
        aggMode="mean"
        defaultTimeframe="4w"
      />
      <MetricCard
        title="AOV"
        description="Average order value (USD)"
        points={normalized}
        formatValue={(v) => formatCurrency(v)}
        aggMode="mean"
        defaultTimeframe="4w"
      />
      <MetricCard
        title="Total Sessions"
        description="Weekly sessions"
        points={normalized}
        formatValue={(v) => formatNumber(v)}
        aggMode="sum"
        defaultTimeframe="4w"
      />
      <MetricCard
        title="Checkout Abandonment Rate"
        description="Weekly checkout abandonment rate (%)"
        points={normalized}
        formatValue={(v) => `${clamp(v, 0, 100).toFixed(2)}%`}
        higherIsBetter={false}
        aggMode="mean"
        defaultTimeframe="4w"
      />

      {/* Methodology explanation */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-5 text-sm text-slate-600 space-y-3">
        <p className="font-semibold text-slate-800 text-base">How these figures are calculated</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div>
            <p className="font-medium text-slate-700 mb-0.5">Time window (4 / 12 / 52 weeks)</p>
            <p>The selected button controls how many weeks of data are shown in the chart and used in the stat box. The window ends on the most recent week in your data.</p>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-0.5">Total / Avg</p>
            <p><strong>Revenue</strong> and <strong>Total Sessions</strong> show the sum for the period. <strong>Conversion Rate</strong>, <strong>AOV</strong>, and <strong>Checkout Abandonment Rate</strong> show the average across weeks, since summing those would be meaningless.</p>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-0.5">vs Prior period</p>
            <p>Compares the weekly average of the selected window to the weekly average of the equal-length window immediately before it. Uses per-week averages on both sides so a shorter prior window doesn&apos;t distort the result.</p>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-0.5">vs Same period last year</p>
            <p>Compares the weekly average of the selected window to the weekly average of the same-length window exactly 52 weeks earlier. Shows <strong>—</strong> if fewer than half the expected weeks exist in the prior year window.</p>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-0.5">vs Trend</p>
            <p>Fits a linear regression line through <em>all</em> historical data points, then projects what the weekly average should have been during the selected window. A positive figure means you&apos;re beating the long-run trend; negative means you&apos;re trailing it.</p>
          </div>
          <div>
            <p className="font-medium text-slate-700 mb-0.5">Median trend overlay</p>
            <p>Toggles a 3-week trailing rolling median line on the chart (dashed blue). Useful for smoothing out week-to-week noise and seeing the underlying direction more clearly.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
