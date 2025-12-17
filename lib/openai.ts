import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface Insight {
  text: string;
  type: 'opportunity' | 'warning' | 'success' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
}

export async function generateInsights(data: {
  week: any;
  overallMetrics: any[];
  marketingChannels: any[];
  funnelMetrics: any[];
  previousWeekData?: any;
  businessContext?: string;
}): Promise<Insight[]> {
  const { week, overallMetrics, marketingChannels, funnelMetrics, previousWeekData, businessContext } = data;

  // Format data for the prompt
  const overallMetricsText = overallMetrics
    .map((m: any) => `${m.metric_name}: ${m.metric_value}`)
    .join('\n');

  const channelsText = marketingChannels.reduce((acc: any, m: any) => {
    if (!acc[m.channel_name]) acc[m.channel_name] = [];
    acc[m.channel_name].push(`${m.metric_name}: ${m.metric_value}`);
    return acc;
  }, {});

  const channelsFormatted = Object.entries(channelsText)
    .map(([channel, metrics]: [string, any]) => `${channel}:\n  ${metrics.join('\n  ')}`)
    .join('\n\n');

  const funnelText = funnelMetrics.reduce((acc: any, m: any) => {
    if (!acc[m.stage_name]) acc[m.stage_name] = [];
    acc[m.stage_name].push(`${m.metric_name}: ${m.metric_value}`);
    return acc;
  }, {});

  const funnelFormatted = Object.entries(funnelText)
    .map(([stage, metrics]: [string, any]) => `${stage}:\n  ${metrics.join('\n  ')}`)
    .join('\n\n');

  const prompt = `You are an expert ecommerce marketing analyst for Pürblack.com, a premium health supplement brand. Analyze the following weekly marketing data and provide actionable insights and recommendations.

Week: ${week.week_start_date} to ${week.week_end_date}

${businessContext ? `🚨🚨🚨 CRITICAL: BUSINESS CONTEXT PROVIDED - THIS IS MANDATORY TO USE 🚨🚨🚨

The following business context was explicitly provided and MUST be incorporated into your analysis:

${businessContext}

⚠️⚠️⚠️ REQUIRED ACTIONS - YOU MUST FOLLOW THESE:
1. MANDATORY: At least 3-4 of your insights MUST explicitly reference and incorporate this context
2. When context mentions a sale/promotion, you MUST state something like: "Given the [specific event from context], the [metric change] is [expected/unexpected]..."
3. When context mentions technical issues, you MUST state: "The [metric impact] aligns with the [technical issue from context] mentioned..."
4. DO NOT provide generic insights that ignore the context - all insights should be filtered through the lens of this context
5. If the context explains why metrics are high/low, you MUST acknowledge this rather than suggesting the metrics are problematic

EXAMPLES OF PROPER CONTEXT USAGE:
- Context: "Black Friday sale this week"
  ✅ GOOD: "Given the Black Friday sale mentioned in context, the 40% revenue increase is expected and indicates strong promotional performance. The campaign successfully drove traffic and conversions."
  ❌ BAD: "Revenue increased 40% this week. Consider optimizing conversion rates." (ignores context)

- Context: "Site went down for 3 hours on Monday"
  ✅ GOOD: "The 15% drop in conversions aligns with the site downtime on Monday mentioned in context. Given the 3-hour outage, this performance is actually stronger than expected."
  ❌ BAD: "Conversion rates dropped 15%. Investigate checkout process issues." (ignores context)

- Context: "Launched new product line on Wednesday"
  ✅ GOOD: "With the new product line launch on Wednesday, the mid-week traffic spike of 35% is expected. Focus on converting this traffic through targeted retargeting campaigns."
  ❌ BAD: "Traffic increased 35% mid-week. Maintain this momentum." (ignores context)

NOW ANALYZE THE DATA BELOW, ENSURING YOU REFERENCE THE CONTEXT ABOVE IN MULTIPLE INSIGHTS:
` : ''}

OVERALL STORE PERFORMANCE:
${overallMetricsText}

MARKETING CHANNELS:
${channelsFormatted}

WEBSITE FUNNEL:
${funnelFormatted}

${previousWeekData ? `📊 PREVIOUS WEEK DATA FOR COMPARISON:
This data will help you identify trends and changes. Compare metrics between the current week and this previous week to highlight improvements, declines, or patterns.

Previous Week: ${previousWeekData.week?.week_start_date} to ${previousWeekData.week?.week_end_date}
${previousWeekData.week?.notes ? `Previous Week Notes: ${previousWeekData.week.notes}` : ''}

Previous Week Metrics:
${previousWeekData.overallMetrics?.map((m: any) => `${m.metric_name}: ${m.metric_value}`).join('\n') || 'No metrics available'}

Previous Week Channels:
${Object.entries(
  (previousWeekData.marketingChannels || []).reduce((acc: any, item: any) => {
    if (!acc[item.channel_name]) acc[item.channel_name] = [];
    acc[item.channel_name].push(`${item.metric_name}: ${item.metric_value}`);
    return acc;
  }, {})
).map(([channel, metrics]: [string, any]) => `${channel}: ${metrics.join(', ')}`).join('\n') || 'No channel data available'}

⚠️ IMPORTANT: Use this previous week data to:
- Compare current week performance vs previous week
- Identify trends (improving, declining, stable)
- Calculate percentage changes where relevant
- Highlight significant changes that warrant attention
` : ''}

Please provide 5-8 specific, actionable insights. ${businessContext ? '⚠️ REQUIRED: At least 3-4 insights MUST explicitly mention and incorporate the business context provided above. ' : ''}For each insight:
1. Identify what's working well, what needs improvement, or what opportunities exist
2. ${businessContext ? 'MANDATORY: If this insight relates to the business context provided above, you MUST explicitly reference it (e.g., "Given the [context detail], the [metric] indicates..."). ' : ''}Be specific with numbers and percentages when relevant
3. Provide concrete, actionable recommendations that account for the business context
4. Prioritize based on potential impact

Format your response as a JSON object with an "insights" array. ${businessContext ? '🚨 REMINDER: Multiple insights must explicitly reference the business context provided earlier in this prompt.' : ''}
{
  "insights": [
    {
      "text": "Detailed insight with specific metrics and actionable recommendation",
      "type": "opportunity" | "warning" | "success" | "recommendation",
      "priority": "high" | "medium" | "low"
    }
  ]
}

Focus on:
- ROI and efficiency across channels
- Conversion rate optimization
- Customer acquisition cost trends
- Funnel drop-off points
- Channel performance comparisons
- Budget allocation recommendations
${businessContext ? '- How the business context affects performance interpretation' : ''}`;

  try {
    // Log if context is being used for debugging
    if (businessContext) {
      console.log('Business context being used in insights generation:', businessContext.substring(0, 100) + '...');
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an expert ecommerce marketing analyst. Provide insights in JSON format only, no additional text.${businessContext ? ' CRITICAL: Business context was provided - you MUST reference it explicitly in at least 3-4 insights. Do not provide generic insights that ignore the context.' : ''}`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response from OpenAI');

    const parsed = JSON.parse(content);
    
    // Handle different possible response formats
    // With json_object format, it should be an object with "insights" key
    let insights = [];
    if (Array.isArray(parsed)) {
      insights = parsed;
    } else if (parsed.insights && Array.isArray(parsed.insights)) {
      insights = parsed.insights;
    } else if (typeof parsed === 'object') {
      // Try to find any array in the response
      const keys = Object.keys(parsed);
      for (const key of keys) {
        if (Array.isArray(parsed[key])) {
          insights = parsed[key];
          break;
        }
      }
    }
    
    return insights.map((insight: any) => ({
      text: insight.text,
      type: insight.type || 'recommendation',
      priority: insight.priority || 'medium',
    }));
  } catch (error) {
    console.error('Error generating insights:', error);
    throw new Error('Failed to generate insights. Please check your OpenAI API key.');
  }
}

export async function generateWeeklySummary(allWeeksData: any[]): Promise<string> {
  const prompt = `You are an expert ecommerce marketing analyst for Pürblack.com. Review the following historical weekly data and provide a comprehensive executive summary highlighting:

1. Overall trends across all weeks
2. Best and worst performing periods
3. Channel performance patterns
4. Key recommendations for the next quarter

Data:
${JSON.stringify(allWeeksData, null, 2)}

Provide a concise, executive-level summary (3-4 paragraphs).`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert ecommerce marketing analyst providing executive summaries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || 'Unable to generate summary.';
  } catch (error) {
    console.error('Error generating summary:', error);
    throw new Error('Failed to generate summary. Please check your OpenAI API key.');
  }
}

