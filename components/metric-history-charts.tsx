'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { addYears, format, subMonths } from 'date-fns';

type Timeframe = 'all' | '12m' | '3m';

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

function linearRegressionSlope(xs: number[], ys: number[]) {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const xBar = mean(xs);
  const yBar = mean(ys);
  let num = 0;
  let den = 0;
  for (let i = 0; i < xs.length; i++) {
    const dx = xs[i] - xBar;
    num += dx * (ys[i] - yBar);
    den += dx * dx;
  }
  return den === 0 ? 0 : num / den;
}

function getCutoffDate(points: MetricsHistoryPoint[], months: number) {
  const last = points[points.length - 1];
  const anchor = last ? new Date(last.weekStartDate) : new Date();
  return subMonths(anchor, months);
}

function filterByTimeframe(points: MetricsHistoryPoint[], tf: Timeframe) {
  if (tf === 'all') return points;
  const cutoff = getCutoffDate(points, tf === '12m' ? 12 : 3);
  return points.filter((p) => new Date(p.weekStartDate) >= cutoff);
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
    const x = padding.left + (trendPoints && trendPoints.length === 1 ? plotW / 2 : (i / ((trendPoints?.length || 1) - 1)) * plotW);
    const yPx = padding.top + (1 - (p.y - minY) / range) * plotH;
    return { ...p, x, yPx };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.yPx.toFixed(2)}`)
    .join(' ');

  const trendPath = trendCoords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.yPx.toFixed(2)}`)
    .join(' ');

  const xLeft = points[0]?.xDate;
  const xRight = points[points.length - 1]?.xDate;

  const hovered = hoverIdx !== null ? coords[hoverIdx] : null;
  const hoveredTrend = hoverIdx !== null && trendPoints && trendPoints.length === coords.length ? trendPoints[hoverIdx] : null;
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
        {/* grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = padding.top + t * plotH;
          return <line key={t} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e5e7eb" />;
        })}

        {/* y labels */}
        {[maxY, minY].map((v, idx) => {
          const y = padding.top + (idx === 0 ? 0 : plotH);
          return (
            <text key={idx} x={8} y={y + 4} fontSize="11" fill="#64748b">
              {formatValue(v)}
            </text>
          );
        })}

        {/* line */}
        <path d={path} fill="none" stroke="#0f766e" strokeWidth="2.5" />
        {trendPoints && trendCoords.length > 1 && (
          <path d={trendPath} fill="none" stroke="#1d4ed8" strokeWidth="2.5" strokeDasharray="6 4" />
        )}
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.yPx} r="3" fill="#0f766e" />
        ))}

        {/* hover guide + tooltip */}
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

        {/* x labels */}
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

function MetricCard({
  title,
  description,
  points,
  formatValue,
  higherIsBetter = true,
  defaultTimeframe = '12m',
}: {
  title: string;
  description: string;
  points: MetricsHistoryPoint[];
  formatValue: (v: number) => string;
  higherIsBetter?: boolean;
  defaultTimeframe?: Timeframe;
}) {
  const [tf, setTf] = useState<Timeframe>(defaultTimeframe);
  const [showMedian, setShowMedian] = useState(false);
  const medianWindow = 3;

  const series = useMemo(() => {
    const filtered = filterByTimeframe(points, tf);
    return filtered.map((p) => ({
      xLabel: p.weekStartDate,
      xDate: new Date(p.weekStartDate),
      y: p.metrics[title] ?? 0,
      hasValue: Object.prototype.hasOwnProperty.call(p.metrics, title),
    }));
  }, [points, tf, title]);

  const medianSeries = useMemo(() => {
    if (!showMedian || series.length < 2) return null;
    const ys = series.map((p) => p.y);
    const med = rollingMedian(ys, medianWindow);
    return series.map((p, i) => ({ ...p, y: med[i] }));
  }, [series, showMedian]);

  const trendPctPerWeek = useMemo(() => {
    const present = series.filter((p) => p.hasValue);
    if (present.length < 2) return null;
    const t0 = present[0].xDate.getTime();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const xs = present.map((p) => (p.xDate.getTime() - t0) / weekMs);
    const ys = present.map((p) => p.y);
    const slopePerWeek = linearRegressionSlope(xs, ys);
    const avg = mean(ys);
    if (avg === 0) return slopePerWeek === 0 ? 0 : Infinity;
    return (slopePerWeek / Math.abs(avg)) * 100;
  }, [series]);

  const yoyPct = useMemo(() => {
    const currentWindow = filterByTimeframe(points, tf);
    const start = currentWindow[0] ? new Date(currentWindow[0].weekStartDate) : null;
    const end = currentWindow[currentWindow.length - 1] ? new Date(currentWindow[currentWindow.length - 1].weekStartDate) : null;
    if (!start || !end) return null;

    const currentVals = currentWindow
      .filter((p) => Object.prototype.hasOwnProperty.call(p.metrics, title))
      .map((p) => p.metrics[title])
      .filter((v): v is number => typeof v === 'number');
    if (currentVals.length < 2) return null;

    const priorStart = addYears(start, -1);
    const priorEnd = addYears(end, -1);
    const priorWindow = points.filter((p) => {
      const d = new Date(p.weekStartDate);
      return d >= priorStart && d <= priorEnd;
    });
    const priorVals = priorWindow
      .filter((p) => Object.prototype.hasOwnProperty.call(p.metrics, title))
      .map((p) => p.metrics[title])
      .filter((v): v is number => typeof v === 'number');
    if (priorVals.length < 2) return null;

    const avgCurrent = mean(currentVals);
    const avgPrior = mean(priorVals);
    if (avgPrior === 0) return avgCurrent === 0 ? 0 : Infinity;
    return ((avgCurrent - avgPrior) / Math.abs(avgPrior)) * 100;
  }, [points, tf, title]);

  const latest = series.length ? series[series.length - 1].y : 0;
  const changePct = useMemo(() => {
    if (series.length < 2) return null;
    const first = series[0].y;
    const last = series[series.length - 1].y;
    if (first === 0) return last === 0 ? 0 : Infinity;
    return ((last - first) / Math.abs(first)) * 100;
  }, [series]);

  const timeframeLabel = tf === 'all' ? 'All time' : tf === '12m' ? '12m' : '3m';
  const changeIsGood =
    changePct === null
      ? null
      : changePct === Infinity
      ? higherIsBetter
      : changePct > 0
      ? higherIsBetter
      : changePct < 0
      ? !higherIsBetter
      : null;
  const trendIsGood =
    trendPctPerWeek === null
      ? null
      : trendPctPerWeek === Infinity
      ? higherIsBetter
      : trendPctPerWeek > 0
      ? higherIsBetter
      : trendPctPerWeek < 0
      ? !higherIsBetter
      : null;
  const yoyIsGood =
    yoyPct === null
      ? null
      : yoyPct === Infinity
      ? higherIsBetter
      : yoyPct > 0
      ? higherIsBetter
      : yoyPct < 0
      ? !higherIsBetter
      : null;

  return (
    <Card className="border-2 border-emerald-100">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={showMedian ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowMedian((v) => !v)}
              title={`Rolling median (${medianWindow}-week trailing)`}
            >
              Median trend
            </Button>
            <Button variant={tf === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setTf('all')}>
              All Time
            </Button>
            <Button variant={tf === '12m' ? 'default' : 'outline'} size="sm" onClick={() => setTf('12m')}>
              12 months
            </Button>
            <Button variant={tf === '3m' ? 'default' : 'outline'} size="sm" onClick={() => setTf('3m')}>
              3 months
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-slate-600">
            Latest: <span className="font-semibold text-slate-900">{formatValue(latest)}</span>
          </div>
          <div className="flex flex-col items-end gap-1 text-sm">
            <div>
              <span className="text-slate-500 mr-2">Change ({timeframeLabel}):</span>
              <span
                className={`font-semibold ${
                  changePct === null
                    ? 'text-slate-500'
                    : changeIsGood === true
                    ? 'text-emerald-700'
                    : changeIsGood === false
                    ? 'text-red-600'
                    : 'text-slate-700'
                }`}
              >
                {changePct === null ? '—' : changePct === Infinity ? 'New' : `${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 mr-2">Trend:</span>
              <span
                className={`font-semibold ${
                  trendPctPerWeek === null
                    ? 'text-slate-500'
                    : trendIsGood === true
                    ? 'text-emerald-700'
                    : trendIsGood === false
                    ? 'text-red-600'
                    : 'text-slate-700'
                }`}
                title="Linear regression slope over the selected timeframe (normalized as % of average per week)"
              >
                {trendPctPerWeek === null
                  ? '—'
                  : trendPctPerWeek === Infinity
                  ? 'New'
                  : `${trendPctPerWeek > 0 ? '+' : ''}${trendPctPerWeek.toFixed(1)}%/wk`}
              </span>
            </div>
            <div>
              <span className="text-slate-500 mr-2">YoY:</span>
              <span
                className={`font-semibold ${
                  yoyPct === null
                    ? 'text-slate-500'
                    : yoyIsGood === true
                    ? 'text-emerald-700'
                    : yoyIsGood === false
                    ? 'text-red-600'
                    : 'text-slate-700'
                }`}
                title="Average over selected timeframe vs same weeks last year"
              >
                {yoyPct === null ? '—' : yoyPct === Infinity ? 'New' : `${yoyPct > 0 ? '+' : ''}${yoyPct.toFixed(1)}%`}
              </span>
            </div>
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
        <CardContent className="pt-6 text-sm text-muted-foreground">No historical data yet. Upload at least 2 weeks to see charts.</CardContent>
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
        defaultTimeframe="12m"
      />
      <MetricCard
        title="Conversion Rate"
        description="Weekly conversion rate (%)"
        points={normalized}
        formatValue={(v) => `${clamp(v, 0, 100).toFixed(2)}%`}
        defaultTimeframe="12m"
      />
      <MetricCard
        title="AOV"
        description="Average order value (USD)"
        points={normalized}
        formatValue={(v) => formatCurrency(v)}
        defaultTimeframe="12m"
      />
      <MetricCard
        title="Total Sessions"
        description="Weekly sessions"
        points={normalized}
        formatValue={(v) => formatNumber(v)}
        defaultTimeframe="3m"
      />
      <MetricCard
        title="Checkout Abandonment Rate"
        description="Weekly checkout abandonment rate (%)"
        points={normalized}
        formatValue={(v) => `${clamp(v, 0, 100).toFixed(2)}%`}
        higherIsBetter={false}
        defaultTimeframe="3m"
      />
    </div>
  );
}

