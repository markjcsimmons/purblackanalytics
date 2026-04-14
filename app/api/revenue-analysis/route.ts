import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      weekLabel,
      netSales,
      grossSales,
      totalDiscounts,
      compValue, compCount,
      promoDiscount, promoCount,
      classicDiscount, classicCount,
      refunds,
      shippingRev,
      taxRev,
      vsPriorPct, vsPriorAbs,
      vsYoyPct, vsYoyAbs,
      trend4, trend12, trend52,
      // Historical context
      recentWeeks,   // last 8 weeks of { weekStart, netSales, grossSales, totalDiscounts }
      correlations,  // { promoVsRevenue_r, classicVsRevenue_r, compVsRevenue_r }
    } = body;

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }
    const client = new Anthropic({ apiKey });

    const fmt = (v: number) =>
      v == null ? '—' : v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    const fmtPct = (v: number | null) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(1)}%`);

    const discountRate = grossSales > 0 ? ((totalDiscounts / grossSales) * 100).toFixed(1) : '—';
    const refundRate   = grossSales > 0 ? ((refunds / grossSales) * 100).toFixed(1) : '—';

    const historyLines = (recentWeeks || [])
      .map((w: any) =>
        `  ${w.weekStart}: Net Sales ${fmt(w.netSales)}, Gross ${fmt(w.grossSales)}, Total Discounts ${fmt(w.totalDiscounts)} (${w.grossSales > 0 ? ((w.totalDiscounts / w.grossSales) * 100).toFixed(1) : '—'}% of gross)`
      )
      .join('\n');

    const corrLines = correlations
      ? [
          `  Promo discounts → Revenue r=${correlations.promoVsRevenue_r?.toFixed(2) ?? '—'} (${correlations.promoVsRevenue_weeks ?? '—'} weeks)`,
          `  Discount codes → Revenue r=${correlations.classicVsRevenue_r?.toFixed(2) ?? '—'} (${correlations.classicVsRevenue_weeks ?? '—'} weeks)`,
          `  Comp giveaways → Revenue r=${correlations.compVsRevenue_r?.toFixed(2) ?? '—'} (${correlations.compVsRevenue_weeks ?? '—'} weeks)`,
        ].join('\n')
      : '  Not available';

    const prompt = `You are a concise e-commerce revenue analyst for Purblack, a premium health supplement brand.
Analyse the revenue data below and give a clear, direct business interpretation.
Be specific with numbers. No filler phrases. 3–5 short paragraphs max.

WEEK: ${weekLabel}

NET SALES: ${fmt(netSales)}
  vs Prior week: ${fmtPct(vsPriorPct)} (${fmt(vsPriorAbs)})
  vs Year ago:   ${fmtPct(vsYoyPct)} (${fmt(vsYoyAbs)})
  4-wk trend:  ${trend4 ?? '—'}
  12-wk trend: ${trend12 ?? '—'}
  52-wk trend: ${trend52 ?? '—'}

REVENUE WATERFALL:
  Gross Sales:            ${fmt(grossSales)}
  − Comp/free orders:     ${fmt(compValue)} (${compCount} orders)
  − Promo discounts:      ${fmt(promoDiscount)} (${promoCount} orders)
  − Discount codes:       ${fmt(classicDiscount)} (${classicCount} orders)
  − Refunded payments:    ${fmt(refunds)}
  + Shipping reversals:   ${fmt(shippingRev)}
  + Tax reversals:        ${fmt(taxRev)}
  = Net Sales:            ${fmt(netSales)}
  Total discount rate:    ${discountRate}% of gross
  Refund rate:            ${refundRate}% of gross

RECENT WEEKLY HISTORY (oldest → newest):
${historyLines || '  Not available'}

HISTORICAL DISCOUNT CORRELATIONS (Pearson r, −1 to +1):
${corrLines}

Focus on: (1) what this week's revenue level means in context, (2) whether the discount mix is working or eroding margin, (3) what the trend signals, (4) one actionable implication.`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    return NextResponse.json({ analysis: text });
  } catch (error: any) {
    console.error('Revenue analysis error:', error);
    return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
  }
}
