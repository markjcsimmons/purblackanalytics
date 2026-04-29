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
      compValue,
      promoDiscount,
      classicDiscount,
      refunds,
      vsPriorPct,
      vsYoyPct,
      trend4,
      trend12,
      trend52,
      channels,
      previousAnalysis,
      userQuestion,
      conversationHistory,
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

    // Build channel summary for context
    let channelContext = 'No channel data available';
    if (channels && Object.keys(channels).length > 0) {
      const topChannels = Object.entries(channels)
        .filter(([_, data]: [string, any]) => data.revenue > 0)
        .sort(([_, a]: [string, any], [__, b]: [string, any]) => b.revenue - a.revenue)
        .slice(0, 3);

      if (topChannels.length > 0) {
        channelContext = topChannels
          .map(([name, data]: [string, any]) => {
            const roas = data.roas ?? (data.spend > 0 ? (data.revenue / data.spend).toFixed(2) : '—');
            return `  ${name}: ${fmt(data.revenue)} (${roas}x ROAS)`;
          })
          .join('\n');
      }
    }

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = '\n\nPREVIOUS CONVERSATION:\n';
      conversationHistory.forEach((msg: any) => {
        conversationContext += `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}\n`;
      });
    }

    const prompt = `You are a concise e-commerce revenue analyst for Purblack, a premium health supplement brand.
The user is asking a follow-up question about revenue analysis for the week of ${weekLabel}.

WEEK DATA CONTEXT:
  Net Sales: ${fmt(netSales)}
  Gross Sales: ${fmt(grossSales)}
  Total Discounts: ${fmt(totalDiscounts)}
  Refunds: ${fmt(refunds)}

  Performance:
    vs Prior week: ${fmtPct(vsPriorPct)}
    vs Year ago: ${fmtPct(vsYoyPct)}
    4-week trend: ${trend4 ?? '—'}
    12-week trend: ${trend12 ?? '—'}
    52-week trend: ${trend52 ?? '—'}

  Discount Mix:
    Comp/free orders: ${fmt(compValue)}
    Promotional discounts: ${fmt(promoDiscount)}
    Discount codes: ${fmt(classicDiscount)}

  Top Channels:
${channelContext}

PREVIOUS ANALYSIS:
${previousAnalysis}
${conversationContext}

USER QUESTION:
"${userQuestion}"

IMPORTANT:
- Answer specifically and concisely (2-4 sentences max)
- Reference the data/context provided
- If the question is outside the scope of the data, say so
- Be direct - no filler phrases
- Provide actionable insight if relevant`;

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join('');

    return NextResponse.json({ answer: text });
  } catch (error: any) {
    console.error('Follow-up analysis error:', error);
    return NextResponse.json({ error: error.message || 'Follow-up analysis failed' }, { status: 500 });
  }
}
