import { NextRequest, NextResponse } from 'next/server';
import { getAllData } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function formatAllDataAsContext(allData: ReturnType<typeof getAllData>): string {
  if (!allData.length) return 'No data has been uploaded yet.';

  const fmtNum = (v: number) => {
    if (v == null) return '—';
    // If looks like a currency value (>= 1 and a whole-ish number), format as currency
    return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

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

    // Overall metrics — emit every stored metric, stripping the "* " prefix
    if (overallMetrics.length) {
      lines.push('  Overall metrics:');
      for (const r of overallMetrics) {
        const name = r.metric_name.replace(/^\*\s*/, '');
        // Skip product-level rows (noisy)
        if (name.startsWith('/products/')) continue;
        lines.push(`    ${name}: ${fmtNum(r.metric_value)}`);
      }
    }

    // Marketing channels — emit EVERY metric for EVERY channel, no filtering
    if (marketingChannels.length) {
      // Group by channel
      const byChannel: Record<string, Array<{ name: string; value: number }>> = {};
      for (const r of marketingChannels) {
        if (!byChannel[r.channel_name]) byChannel[r.channel_name] = [];
        byChannel[r.channel_name].push({
          name: r.metric_name.replace(/^\*\s*/, ''),
          value: r.metric_value,
        });
      }

      lines.push('  Channel metrics:');
      for (const [ch, metrics] of Object.entries(byChannel)) {
        lines.push(`    [${ch}]`);
        for (const { name, value } of metrics) {
          lines.push(`      ${name}: ${fmtNum(value)}`);
        }
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
      max_tokens: 1200,
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
