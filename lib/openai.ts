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

  const prompt = `You are an expert ecommerce marketing analyst for Purblack.com, a premium health supplement brand. Analyze the following weekly marketing data and provide actionable insights and recommendations.

Week: ${week.week_start_date} to ${week.week_end_date}

${businessContext ? `IMPORTANT BUSINESS CONTEXT:
${businessContext}

⚠️ Use this context to interpret the metrics correctly. For example:
- If there was a sale or promotion, higher metrics are expected/normal
- If there were technical issues, lower metrics should be viewed in that light
- Account for seasonal events, product launches, or other special circumstances
` : ''}

OVERALL STORE PERFORMANCE:
${overallMetricsText}

MARKETING CHANNELS:
${channelsFormatted}

WEBSITE FUNNEL:
${funnelFormatted}

${previousWeekData ? `PREVIOUS WEEK FOR COMPARISON:
${JSON.stringify(previousWeekData, null, 2)}` : ''}

Please provide 5-8 specific, actionable insights. For each insight:
1. Identify what's working well, what needs improvement, or what opportunities exist
2. Be specific with numbers and percentages when relevant
3. Provide concrete, actionable recommendations
4. Prioritize based on potential impact

Format your response as a JSON array of objects with the following structure:
[
  {
    "text": "Detailed insight with specific metrics and actionable recommendation",
    "type": "opportunity" | "warning" | "success" | "recommendation",
    "priority": "high" | "medium" | "low"
  }
]

Focus on:
- ROI and efficiency across channels
- Conversion rate optimization
- Customer acquisition cost trends
- Funnel drop-off points
- Channel performance comparisons
- Budget allocation recommendations`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert ecommerce marketing analyst. Provide insights in JSON format only, no additional text.',
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
    const insights = Array.isArray(parsed) ? parsed : parsed.insights || [];
    
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
  const prompt = `You are an expert ecommerce marketing analyst for Purblack.com. Review the following historical weekly data and provide a comprehensive executive summary highlighting:

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

