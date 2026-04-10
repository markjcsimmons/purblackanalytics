'use client';

import { useMemo } from 'react';
import { MetricCard, type MetricsHistoryPoint } from '@/components/metric-history-charts';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface MetricConfig {
  aggMode: 'sum' | 'mean';
  higherIsBetter: boolean;
  formatValue: (v: number) => string;
  priority: number; // lower = earlier in list
}

function getMetricConfig(metricName: string): MetricConfig {
  const lower = metricName.toLowerCase();

  // ROAS — check before currency so "roas" doesn't match "revenue"
  if (lower.includes('roas')) {
    return {
      aggMode: 'mean',
      higherIsBetter: true,
      formatValue: (v) => v.toFixed(2) + 'x',
      priority: 20,
    };
  }

  // Revenue / Sales / Profit
  if (
    lower.includes('revenue') ||
    lower.includes('sales') ||
    lower.includes('profit')
  ) {
    return {
      aggMode: 'sum',
      higherIsBetter: true,
      formatValue: (v) => formatCurrency(v),
      priority: lower.includes('revenue') ? 1 : lower.includes('sales') ? 2 : 3,
    };
  }

  // Spend / Cost
  if (lower.includes('spend') || lower.includes('cost')) {
    return {
      aggMode: 'sum',
      higherIsBetter: false,
      formatValue: (v) => formatCurrency(v),
      priority: 25,
    };
  }

  // Rate / Percentage metrics
  if (lower.includes('rate') || lower.includes('ctr') || lower.includes('%')) {
    const isAbandonment = lower.includes('abandon');
    return {
      aggMode: 'mean',
      higherIsBetter: !isAbandonment,
      formatValue: (v) => v.toFixed(2) + '%',
      priority: 40,
    };
  }

  // Count metrics
  if (
    lower.includes('click') ||
    lower.includes('impression') ||
    lower.includes('reach') ||
    lower.includes('session') ||
    lower.includes('order') ||
    lower.includes('conversion') ||
    lower.includes('visit')
  ) {
    const pri =
      lower.includes('order') ? 10
      : lower.includes('conversion') ? 11
      : lower.includes('click') ? 30
      : lower.includes('impression') ? 35
      : lower.includes('reach') ? 36
      : 38;
    return {
      aggMode: 'sum',
      higherIsBetter: true,
      formatValue: (v) => formatNumber(v),
      priority: pri,
    };
  }

  // Default: treat as a count
  return {
    aggMode: 'sum',
    higherIsBetter: true,
    formatValue: (v) => formatNumber(v),
    priority: 50,
  };
}

// Build description string for a metric
function metricDescription(channel: string, metricName: string): string {
  return `${channel} — weekly ${metricName.toLowerCase()}`;
}

interface ChannelHistoryChartsProps {
  channelHistory: Record<string, MetricsHistoryPoint[]>;
}

export function ChannelHistoryCharts({ channelHistory }: ChannelHistoryChartsProps) {
  const channels = useMemo(
    () => Object.keys(channelHistory).sort(),
    [channelHistory]
  );

  if (!channels.length) {
    return (
      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground">
          No channel history yet. Upload at least 2 weeks of data with marketing channel metrics to see trends here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      {channels.map((channel) => {
        const points = channelHistory[channel];

        // Collect all metric names that appear in this channel's data
        const metricSet = new Set<string>();
        for (const p of points) {
          for (const k of Object.keys(p.metrics)) {
            metricSet.add(k);
          }
        }

        // Filter to metrics that have data in at least 2 weeks
        const validMetrics = Array.from(metricSet).filter((metric) => {
          const count = points.filter(
            (p) => Object.prototype.hasOwnProperty.call(p.metrics, metric)
          ).length;
          return count >= 2;
        });

        if (!validMetrics.length) return null;

        // Sort by config priority
        const sortedMetrics = validMetrics.sort((a, b) => {
          const pa = getMetricConfig(a).priority;
          const pb = getMetricConfig(b).priority;
          return pa !== pb ? pa - pb : a.localeCompare(b);
        });

        return (
          <div key={channel} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <h2 className="text-xl font-bold text-slate-800 px-2">{channel}</h2>
              <div className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="grid gap-6">
              {sortedMetrics.map((metric) => {
                const config = getMetricConfig(metric);
                return (
                  <MetricCard
                    key={metric}
                    title={metric}
                    description={metricDescription(channel, metric)}
                    points={points}
                    formatValue={config.formatValue}
                    aggMode={config.aggMode}
                    higherIsBetter={config.higherIsBetter}
                    defaultTimeframe="4w"
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
