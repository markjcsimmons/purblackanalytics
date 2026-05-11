import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      weekLabel,
      // Revenue
      revenue, grossSales, refunds, totalDiscounts,
      compValue, compCount, promoDiscount, promoCount, classicDiscount, classicCount,
      // Traffic & conversion
      sessions, conversionRate, aov, orders, checkoutAbandonmentRate,
      // Comparisons
      vsPriorRevPct, vsYoyRevPct,
      vsPriorCrPct, vsPriorAovPct, vsPriorSessionsPct,
      // Trends
      trend4Rev, trend4Cr, trend4Aov, trend4Sessions,
      // Channels
      channels,
      // Context
      weekNotes,
    } = body;

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }
    const client = new Anthropic({ apiKey });

    const fmt = (v: number | null | undefined) =>
      v == null ? '—' : v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    const fmtPct = (v: number | null | undefined) =>
      v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`;
    const fmtNum = (v: number | null | undefined) =>
      v == null ? '—' : v.toLocaleString();

    // Build channel context
    let channelLines = 'No channel data';
    if (channels && Object.keys(channels).length > 0) {
      channelLines = Object.entries(channels)
        .filter(([_, d]: [string, any]) => d.revenue > 0)
        .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.revenue - a.revenue)
        .map(([name, d]: [string, any]) => {
          const roas = d.roas ?? (d.spend > 0 ? (d.revenue / d.spend).toFixed(2) : null);
          return `  ${name}: revenue ${fmt(d.revenue)}${d.spend > 0 ? `, spend ${fmt(d.spend)}, ROAS ${roas}x` : ''}`;
        })
        .join('\n');
    }

    const prompt = `You are a senior e-commerce analyst for Pürblack, a premium Himalayan shilajit health supplement brand.
Generate a concise weekly performance review with actionable insights for the week of ${weekLabel}.

REVENUE
  Net Sales: ${fmt(revenue)}   Gross Sales: ${fmt(grossSales)}
  Refunds: ${fmt(refunds)}   Discounts: ${fmt(totalDiscounts)}
  Comp/free orders: ${fmt(compValue)} (${fmtNum(compCount)} orders)
  Promo discounts: ${fmt(promoDiscount)} (${fmtNum(promoCount)} orders)
  Discount codes: ${fmt(classicDiscount)} (${fmtNum(classicCount)} orders)

TRAFFIC & CONVERSION
  Sessions: ${fmtNum(sessions)}   Orders: ${fmtNum(orders)}
  Conversion Rate: ${conversionRate != null ? conversionRate.toFixed(2) + '%' : '—'}
  Avg Order Value: ${fmt(aov)}
  Checkout Abandonment: ${checkoutAbandonmentRate != null ? checkoutAbandonmentRate.toFixed(1) + '%' : '—'}

WEEK-OVER-WEEK
  Revenue: ${fmtPct(vsPriorRevPct)}   Sessions: ${fmtPct(vsPriorSessionsPct)}
  Conversion Rate: ${fmtPct(vsPriorCrPct)}   AOV: ${fmtPct(vsPriorAovPct)}

YEAR-OVER-YEAR  Revenue: ${fmtPct(vsYoyRevPct)}

4-WEEK TRENDS
  Revenue: ${trend4Rev ?? '—'}   Conversion Rate: ${trend4Cr ?? '—'}
  AOV: ${trend4Aov ?? '—'}   Sessions: ${trend4Sessions ?? '—'}

MARKETING CHANNELS
${channelLines}
${weekNotes ? `\nWEEK NOTES\n  ${weekNotes}` : ''}

Write your response in this exact format:

## Summary
2-3 sentence overview of the week's performance — highlight the single most important story.

## What's Working
- 2-3 bullet points on genuine positives with specific numbers

## What Needs Attention
- 2-3 bullet points on risks or underperformance with specific numbers

## Top 3 Recommendations
1. [Specific, actionable recommendation with reasoning]
2. [Specific, actionable recommendation with reasoning]
3. [Specific, actionable recommendation with reasoning]

Keep each section tight. No filler phrases. Reference actual numbers from the data.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const insights = message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('Week insights error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate insights' }, { status: 500 });
  }
}
