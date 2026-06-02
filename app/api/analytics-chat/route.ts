import { NextRequest, NextResponse } from 'next/server';
import { getAllData } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function formatAllDataAsContext(allData: ReturnType<typeof getAllData>): string {
  if (!allData.length) return 'No data has been uploaded yet.';

  const fmt = (v: number) =>
    v == null
      ? '—'
      : v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

  const lines: string[] = [
    `PURBLACK ANALYTICS DATA — ${allData.length} weeks loaded`,
    '='.repeat(60),
    '',
  ];

  // Sort oldest → newest for temporal reasoning
  const sorted = [...allData].sort(
    (a, b) =>
      new Date(a.week.week_start_date).getTime() - new Date(b.week.week_start_date).getTime()
  );

  for (const entry of sorted) {
    const { week, overallMetrics, marketingChannels } = entry as any;
    lines.push(`WEEK: ${week.week_start_date} → ${week.week_end_date}`);

    // Overall metrics
    if (overallMetrics.length) {
      const om: Record<string, number> = {};
      for (const r of overallMetrics) {
        om[r.metric_name.replace(/^\*\s*/, '')] = r.metric_value;
      }

      const kpis = [
        ['Revenue (Net Sales)', om['Revenue'] ?? om['Shopify Net Sales']],
        ['Gross Sales', om['Gross Sales']],
        ['Conversion Rate', om['Conversion Rate']],
        ['AOV', om['AOV']],
        ['Total Sessions', om['Total Sessions']],
        ['Total Discounts', om['Total Discounts']],
        ['Refunds', om['Refunds']],
      ].filter(([, v]) => v != null);

      if (kpis.length) {
        lines.push('  Overall:');
        for (const [label, val] of kpis) {
          if (typeof val === 'number') {
            const display =
              label === 'Conversion Rate'
                ? `${val.toFixed(2)}%`
                : label === 'Total Sessions'
                ? val.toLocaleString()
                : fmt(val);
            lines.push(`    ${label}: ${display}`);
          }
        }
      }
    }

    // Marketing channels
    if (marketingChannels.length) {
      // Group by channel
      const byChannel: Record<string, Record<string, number>> = {};
      for (const r of marketingChannels) {
        if (!byChannel[r.channel_name]) byChannel[r.channel_name] = {};
        byChannel[r.channel_name][r.metric_name.replace(/^\*\s*/, '')] = r.metric_value;
      }

      lines.push('  Channels:');
      for (const [ch, metrics] of Object.entries(byChannel)) {
        const revenue = metrics['Revenue'] ?? metrics['revenue'];
        const spend = metrics['Spend'] ?? metrics['spend'];
        const roas =
          metrics['ROAS'] ?? metrics['roas'] ?? (spend > 0 ? revenue / spend : null);
        const parts: string[] = [];
        if (revenue != null) parts.push(`Revenue ${fmt(revenue)}`);
        if (spend != null) parts.push(`Spend ${fmt(spend)}`);
        if (roas != null) parts.push(`ROAS ${typeof roas === 'number' ? roas.toFixed(2) : roas}x`);
        if (parts.length) lines.push(`    ${ch}: ${parts.join(', ')}`);
      }
    }

    lines.push('');
  }

  return lines.join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const { question, conversationHistory = [] } = await request.json();

    if (!question?.trim()) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }
    const client = new Anthropic({ apiKey });

    const allData = getAllData();
    const dataContext = formatAllDataAsContext(allData);

    const systemPrompt = `You are an analytics assistant for Purblack, a premium health supplement brand.
You have access to all uploaded weekly performance data shown below. Answer the user's question precisely and concisely using this data.
When citing numbers, be specific. If the data doesn't contain what's asked, say so clearly.
Keep answers under 6 sentences unless a table or list is genuinely helpful.

${dataContext}`;

    // Build messages array with conversation history
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
      ...conversationHistory,
      { role: 'user', content: question },
    ];

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages,
    });

    const answer = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    return NextResponse.json({ answer });
  } catch (error: any) {
    console.error('Analytics chat error:', error);
    return NextResponse.json({ error: error.message || 'Chat failed' }, { status: 500 });
  }
}
