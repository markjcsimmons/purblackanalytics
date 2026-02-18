'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { format, subMonths } from 'date-fns';

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
}: {
  points: Array<{ xLabel: string; xDate: Date; y: number }>;
  formatValue: (v: number) => string;
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 900;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 28, left: 44 };

  const ys = points.map((p) => p.y);
  const minY = ys.length ? Math.min(...ys) : 0;
  const maxY = ys.length ? Math.max(...ys) : 0;
  const range = maxY - minY || 1;

  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const coords = points.map((p, i) => {
    const x = padding.left + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
    const y = padding.top + (1 - (p.y - minY) / range) * plotH;
    return { ...p, x, y };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
    .join(' ');

  const xLeft = points[0]?.xDate;
  const xRight = points[points.length - 1]?.xDate;

  const hovered = hoverIdx !== null ? coords[hoverIdx] : null;
  const tooltip = hovered
    ? {
        date: format(hovered.xDate, 'MMM d, yyyy'),
        value: formatValue(hovered.y),
        x: hovered.x,
        y: hovered.y,
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
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r="3" fill="#0f766e" />
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
            <circle cx={tooltip.x} cy={tooltip.y} r="5" fill="#0f766e" stroke="#ffffff" strokeWidth="2" />
            {(() => {
              const boxW = 170;
              const boxH = 46;
              const x = clamp(tooltip.x + 10, padding.left, width - padding.right - boxW);
              const y = clamp(tooltip.y - boxH - 10, padding.top, height - padding.bottom - boxH);
              return (
                <g>
                  <rect x={x} y={y} width={boxW} height={boxH} rx={8} fill="#0f172a" opacity={0.92} />
                  <text x={x + 10} y={y + 18} fontSize="11" fill="#e2e8f0">
                    {tooltip.date}
                  </text>
                  <text x={x + 10} y={y + 36} fontSize="12" fill="#ffffff" fontWeight={700 as any}>
                    {tooltip.value}
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
  defaultTimeframe = '12m',
}: {
  title: string;
  description: string;
  points: MetricsHistoryPoint[];
  formatValue: (v: number) => string;
  defaultTimeframe?: Timeframe;
}) {
  const [tf, setTf] = useState<Timeframe>(defaultTimeframe);

  const series = useMemo(() => {
    const filtered = filterByTimeframe(points, tf);
    return filtered.map((p) => ({
      xLabel: p.weekStartDate,
      xDate: new Date(p.weekStartDate),
      y: p.metrics[title] ?? 0,
    }));
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

  return (
    <Card className="border-2 border-emerald-100">
      <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
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
          <div className="text-sm">
            <span className="text-slate-500 mr-2">Change ({timeframeLabel}):</span>
            <span
              className={`font-semibold ${
                changePct === null
                  ? 'text-slate-500'
                  : changePct === Infinity
                  ? 'text-emerald-700'
                  : changePct > 0
                  ? 'text-emerald-700'
                  : changePct < 0
                  ? 'text-red-600'
                  : 'text-slate-700'
              }`}
            >
              {changePct === null ? '—' : changePct === Infinity ? 'New' : `${changePct > 0 ? '+' : ''}${changePct.toFixed(1)}%`}
            </span>
          </div>
        </div>
        <LineChart points={series} formatValue={formatValue} />
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
    </div>
  );
}

