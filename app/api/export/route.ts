import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'overview';

  try {
    const { getAllData } = await import('@/lib/db');
    const allData = getAllData();

    let csv = '';
    let filename = '';

    if (type === 'overview') {
      // ── Weekly Overview: one row per week, columns for key metrics ──
      const METRIC_COLS = [
        'Revenue',
        'Gross Sales',
        'Total Discount Amount',
        'Refunds',
        'Shipping Reversals',
        'Tax Reversals',
        'Comp Order Value',
        'Comp Order Count',
        'Promo Discount Value',
        'Promo Order Count',
        'Classic Discount Value',
        'Classic Discount Count',
        'Total Sessions',
        'Conversion Rate',
        'AOV',
        'Checkout Abandonment Rate',
        'Orders',
      ];

      const headers = ['Week Start', 'Week End', ...METRIC_COLS, 'Notes'];
      csv = headers.join(',') + '\n';

      for (const { week, overallMetrics } of allData) {
        const metricMap: Record<string, number> = {};
        for (const m of overallMetrics as any[]) {
          // Strip leading "* " prefix stored in DB
          const key = m.metric_name.replace(/^\*\s*/, '');
          metricMap[key] = m.metric_value;
        }
        const row = [
          week.week_start_date,
          week.week_end_date,
          ...METRIC_COLS.map((col) => metricMap[col] ?? ''),
          `"${(week.notes || '').replace(/"/g, '""')}"`,
        ];
        csv += row.join(',') + '\n';
      }
      filename = `purblack-weekly-overview-${today()}.csv`;

    } else if (type === 'channels') {
      // ── Marketing Channels: one row per week × channel ──
      const headers = ['Week Start', 'Week End', 'Channel', 'Metric', 'Value'];
      csv = headers.join(',') + '\n';

      for (const { week, marketingChannels } of allData) {
        for (const m of marketingChannels as any[]) {
          const row = [
            week.week_start_date,
            week.week_end_date,
            `"${m.channel_name}"`,
            `"${m.metric_name.replace(/^\*\s*/, '')}"`,
            m.metric_value,
          ];
          csv += row.join(',') + '\n';
        }
      }
      filename = `purblack-marketing-channels-${today()}.csv`;

    } else if (type === 'promotions') {
      // ── Promotions ──
      const headers = ['Start Date', 'End Date', 'Offer Type', 'Net Sales', 'Gross Sales', 'Week'];
      csv = headers.join(',') + '\n';

      for (const { week, promotions } of allData) {
        for (const p of promotions as any[]) {
          const row = [
            p.start_date,
            p.end_date,
            `"${p.offer_type}"`,
            p.net_sales ?? '',
            p.gross_sales ?? '',
            week.week_start_date,
          ];
          csv += row.join(',') + '\n';
        }
      }

      // Also include promotions not linked to a week
      const { getAllPromotions } = await import('@/lib/db');
      const allPromos = getAllPromotions() as any[];
      const linkedIds = new Set(
        allData.flatMap(({ promotions }) => (promotions as any[]).map((p: any) => p.id))
      );
      for (const p of allPromos) {
        if (!linkedIds.has(p.id)) {
          csv += [p.start_date, p.end_date, `"${p.offer_type}"`, p.net_sales ?? '', p.gross_sales ?? '', ''].join(',') + '\n';
        }
      }
      filename = `purblack-promotions-${today()}.csv`;

    } else if (type === 'funnel') {
      // ── Funnel Metrics ──
      const headers = ['Week Start', 'Week End', 'Stage', 'Metric', 'Value'];
      csv = headers.join(',') + '\n';

      for (const { week, funnelMetrics } of allData) {
        for (const m of funnelMetrics as any[]) {
          const row = [
            week.week_start_date,
            week.week_end_date,
            `"${m.stage_name}"`,
            `"${m.metric_name}"`,
            m.metric_value,
          ];
          csv += row.join(',') + '\n';
        }
      }
      filename = `purblack-funnel-${today()}.csv`;

    } else {
      return NextResponse.json({ error: 'Unknown export type' }, { status: 400 });
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}
