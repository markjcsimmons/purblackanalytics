import OpenAI from 'openai';

// Lazy-load OpenAI client to prevent build-time initialization
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    // Check for all possible environment variable name variations
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || process.env.OPEN_API_KEY;
    
    if (!apiKey) {
      // Debug: Check what env vars are available (without exposing values)
      const envVars = Object.keys(process.env).filter(key => 
        key.toUpperCase().includes('OPEN') || key.toUpperCase().includes('API')
      );
      console.error('OpenAI API key not found. Available env vars with "OPEN" or "API":', envVars);
      console.error('Checked for: OPENAI_API_KEY, OPEN_AI_KEY, OPEN_API_KEY');
      throw new Error('OPENAI_API_KEY, OPEN_AI_KEY, or OPEN_API_KEY environment variable is required. Please check your Render environment variables and restart the service.');
    }
    
    // Validate API key format (should start with sk-)
    if (!apiKey.startsWith('sk-')) {
      console.error('OpenAI API key format appears invalid (should start with "sk-")');
      throw new Error('Invalid OpenAI API key format. Key should start with "sk-". Please check the key value in Render.');
    }
    
    console.log('OpenAI client initialized successfully');
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  // TypeScript doesn't understand that openai is not null after the check
  return openai as OpenAI;
}

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
  historicalData?: any[];
  businessContext?: string;
  recommendationRules?: string[];
}): Promise<Insight[]> {
  const { week, overallMetrics, marketingChannels, funnelMetrics, previousWeekData, historicalData, businessContext, recommendationRules } = data;

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

  
  // Format historical data for pattern and seasonality analysis
  const formatHistoricalData = (weeks: any[]) => {
    if (!weeks || weeks.length === 0) return '';
    
    // Group by month/season for seasonality analysis
    const byMonth: { [key: string]: any[] } = {};
    const byQuarter: { [key: string]: any[] } = {};
    
    weeks.forEach((weekData: any) => {
      if (!weekData.week) return;
      const weekStart = new Date(weekData.week.week_start_date);
      const month = weekStart.toLocaleString('default', { month: 'long', year: 'numeric' });
      const quarter = `Q${Math.floor(weekStart.getMonth() / 3) + 1} ${weekStart.getFullYear()}`;
      
      if (!byMonth[month]) byMonth[month] = [];
      if (!byQuarter[quarter]) byQuarter[quarter] = [];
      
      byMonth[month].push(weekData);
      byQuarter[quarter].push(weekData);
    });
    
    // Extract key metrics for trend analysis
    const keyMetrics = ['Total Revenue', 'Total Orders', 'Conversion Rate', 'Average Order Value'];
    const trends: { [metric: string]: { values: number[], dates: string[] } } = {};
    
    keyMetrics.forEach(metric => {
      trends[metric] = { values: [], dates: [] };
      weeks.forEach((weekData: any) => {
        if (weekData.overallMetrics) {
          const metricData = weekData.overallMetrics.find((m: any) => 
            m.metric_name === metric || m.metric_name.includes(metric)
          );
          if (metricData) {
            const value = parseFloat(metricData.metric_value.toString().replace(/[^0-9.-]/g, ''));
            if (!isNaN(value)) {
              trends[metric].values.push(value);
              trends[metric].dates.push(weekData.week.week_start_date);
            }
          }
        }
      });
    });
    
    // Format output
    let output = `HISTORICAL DATA ANALYSIS (${weeks.length} weeks of data):\n\n`;
    
    // Time-based patterns
    output += `📅 TIME-BASED PATTERNS:\n`;
    output += `- Data spans ${Object.keys(byMonth).length} months\n`;
    output += `- Data spans ${Object.keys(byQuarter).length} quarters\n\n`;
    
    // Trend analysis
    output += `📈 KEY METRIC TRENDS (last ${Math.min(weeks.length, 12)} weeks):\n`;
    Object.entries(trends).forEach(([metric, data]) => {
      if (data.values.length > 0) {
        const recent = data.values.slice(-4);
        const older = data.values.slice(-8, -4);
        if (recent.length > 0 && older.length > 0) {
          const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
          const olderAvg = older.length > 0 ? older.reduce((a, b) => a + b, 0) / older.length : recentAvg;
          const change = ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1);
          const direction = parseFloat(change) > 0 ? '↑' : '↓';
          output += `- ${metric}: ${direction} ${Math.abs(parseFloat(change))}% (recent 4 weeks vs previous 4 weeks)\n`;
        }
      }
    });
    
    output += `\n📊 SAMPLE HISTORICAL WEEKS (showing key metrics):\n`;
    // Show last 8 weeks as sample
    weeks.slice(0, 8).forEach((weekData: any, idx: number) => {
      if (weekData.week) {
        output += `\nWeek ${idx + 1}: ${weekData.week.week_start_date} to ${weekData.week.week_end_date}\n`;
        if (weekData.overallMetrics) {
          const revenue = weekData.overallMetrics.find((m: any) => m.metric_name.includes('Revenue') || m.metric_name.includes('Sales'));
          const orders = weekData.overallMetrics.find((m: any) => m.metric_name.includes('Order') && !m.metric_name.includes('Value'));
          const conversion = weekData.overallMetrics.find((m: any) => m.metric_name.includes('Conversion'));
          if (revenue) output += `  Revenue: ${revenue.metric_value}\n`;
          if (orders) output += `  Orders: ${orders.metric_value}\n`;
          if (conversion) output += `  Conversion: ${conversion.metric_value}\n`;
        }
      }
    });
    
    return output;
  };
  
  const historicalAnalysisText = historicalData && historicalData.length > 0 
    ? formatHistoricalData(historicalData) 
    : '';
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

${recommendationRules && recommendationRules.length > 0 ? `
🚨 MANDATORY RULES - YOU MUST FOLLOW THESE AT ALL TIMES:

The following rules MUST be applied to all recommendations you generate:

${recommendationRules.map((rule: string, i: number) => `${i + 1}. ${rule}`).join('\n')}

⚠️ CRITICAL: 
- DO NOT generate recommendations that violate these rules
- If a rule says "Don't recommend X", then DO NOT suggest X under any circumstances
- These rules override default suggestions
- Think carefully before each recommendation to ensure it doesn't conflict with any rule above

` : ''}

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

${historicalAnalysisText ? `🔍🔍🔍 DEEP HISTORICAL PATTERN & SEASONALITY ANALYSIS (${historicalData?.length || 0} weeks of data) 🔍🔍🔍

${historicalAnalysisText}

⚠️⚠️⚠️ CRITICAL ANALYSIS REQUIREMENTS - YOU MUST USE THIS HISTORICAL DATA:

1. **PATTERN IDENTIFICATION**: Look for recurring patterns across weeks, months, and quarters. Identify:
   - Seasonal trends (e.g., higher sales in certain months)
   - Weekly patterns (e.g., certain days/weeks consistently perform better)
   - Growth trends (improving, declining, or stable over time)
   - Cyclical patterns (repeating patterns over time)

2. **SEASONALITY ANALYSIS**: Compare current week performance to:
   - Same period last year (if available)
   - Same month in previous years
   - Typical performance for this time period
   - Identify if current performance is above/below seasonal norms

3. **TREND ANALYSIS**: Analyze:
   - Long-term trends (over 3+ months)
   - Short-term trends (last 4-8 weeks)
   - Acceleration or deceleration of trends
   - Whether current week is part of a larger trend or an anomaly

4. **CONTEXTUAL COMPARISONS**: Instead of just comparing to last week, compare to:
   - Average of last 4 weeks
   - Average of last 8 weeks
   - Average of same month in previous periods
   - Best performing weeks in the dataset
   - Worst performing weeks in the dataset

5. **INSIGHT GENERATION**: Your insights MUST:
   - Reference historical patterns when explaining current performance
   - Identify if current metrics are typical or unusual for this time period
   - Consider seasonality when making recommendations
   - Use trend data to predict future performance
   - Distinguish between short-term fluctuations and long-term changes

⚠️ DO NOT just compare to the previous week. Use the full historical context to provide deeper, more informed insights.

` : ''}
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
- ROI and efficiency across channels (compare to historical averages, not just last week)
- Conversion rate optimization (identify if current rates are above/below seasonal norms)
- Customer acquisition cost trends (analyze long-term trends, not just week-over-week)
- Funnel drop-off points (compare to historical patterns to identify anomalies)
- Channel performance comparisons (benchmark against historical channel performance)
- Budget allocation recommendations (based on historical ROI patterns, not just recent performance)
- Seasonal patterns and cyclical trends (identify if current performance aligns with historical patterns)
- Long-term trajectory vs short-term fluctuations (distinguish between trends and anomalies)
${businessContext ? '- How the business context affects performance interpretation' : ''}
${historicalData && historicalData.length > 0 ? '- Historical pattern analysis: Reference specific historical periods when explaining current performance' : ''}`;

  try {
    // Log if context is being used for debugging
    if (businessContext) {
      console.log('Business context being used in insights generation:', businessContext.substring(0, 100) + '...');
    }
    
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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
  } catch (error: any) {
    console.error('Error generating insights:', error);
    
    // Provide more specific error messages
    if (error.message && error.message.includes('API key')) {
      throw new Error('OpenAI API key issue: ' + error.message + '. Please verify the key is set correctly in Render and restart the service.');
    }
    if (error.status === 401) {
      throw new Error('OpenAI API authentication failed. The API key may be invalid or expired. Please check your OPENAI_API_KEY in Render.');
    }
    if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
    }
    
    throw new Error('Failed to generate insights: ' + (error.message || 'Unknown error') + '. Check server logs for details.');
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
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
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

