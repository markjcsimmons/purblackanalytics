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
    
    // OpenAI client initialized successfully');
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
  sameWeekYearEarlierData?: any;
  historicalData?: any[];
  businessContext?: string;
  recommendationRules?: string[];
  promotions?: any[];
}): Promise<Insight[]> {
  const { week, overallMetrics, marketingChannels, funnelMetrics, previousWeekData, sameWeekYearEarlierData, historicalData, businessContext, recommendationRules, promotions } = data;

  // Format data for the prompt
  const overallMetricsText = overallMetrics
    .map((m: any) => String(m.metric_name) + ': ' + String(m.metric_value))
    .join('\\n');

  const channelsText = marketingChannels.reduce((acc: any, m: any) => {
    if (!acc[m.channel_name]) acc[m.channel_name] = [];
    acc[m.channel_name].push(String(m.metric_name) + ': ' + String(m.metric_value));
    return acc;
  }, {});

  const channelsFormatted = Object.entries(channelsText)
    .map(([channel, metrics]: [string, any]) => `${channel}:\n  ${metrics.join('\n  ')}`)
    .join('\n\n');

  const funnelText = funnelMetrics.reduce((acc: any, m: any) => {
    if (!acc[m.stage_name]) acc[m.stage_name] = [];
    acc[m.stage_name].push(String(m.metric_name) + ': ' + String(m.metric_value));
    return acc;
  }, {});

  const funnelFormatted = Object.entries(funnelText)
    .map(([stage, metrics]: [string, any]) => `${stage}:\n  ${metrics.join('\n  ')}`)
    .join('\n\n');

  
  // Format historical data for pattern and seasonality analysis
    const formatHistoricalData = (weeks: any[]) => {
    if (!weeks || weeks.length === 0) return '';
    
    // Helper function to extract numeric value from metric
    const getNumericValue = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9.-]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    };
    
    // Helper function to calculate statistics
    const calculateStats = (values: number[]) => {
      if (values.length === 0) return null;
      const sorted = [...values].sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        avg: sum / values.length,
        median: sorted.length % 2 === 0 
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)],
        count: values.length
      };
    };
    
    // Group by month/quarter/year for seasonality analysis
    const byMonth: { [key: string]: any[] } = {};
    const byQuarter: { [key: string]: any[] } = {};
    const byYear: { [key: string]: any[] } = {};
    const byMonthName: { [key: string]: any[] } = {}; // For YoY comparison (e.g., all Januaries)
    
    weeks.forEach((weekData: any) => {
      if (!weekData.week) return;
      const weekStart = new Date(weekData.week.week_start_date);
      const month = weekStart.toLocaleString('default', { month: 'long', year: 'numeric' });
      const monthName = weekStart.toLocaleString('default', { month: 'long' }); // Just month name
      const quarter = `Q${Math.floor(weekStart.getMonth() / 3) + 1} ${weekStart.getFullYear()}`;
      const year = weekStart.getFullYear().toString();
      
      if (!byMonth[month]) byMonth[month] = [];
      if (!byQuarter[quarter]) byQuarter[quarter] = [];
      if (!byYear[year]) byYear[year] = [];
      if (!byMonthName[monthName]) byMonthName[monthName] = [];
      
      byMonth[month].push(weekData);
      byQuarter[quarter].push(weekData);
      byYear[year].push(weekData);
      byMonthName[monthName].push(weekData);
    });
    
    // Extract ALL metrics for comprehensive analysis
    const allMetrics: { [key: string]: { values: number[], dates: string[], weekData: any[] } } = {};
    
    // Process overall metrics
    weeks.forEach((weekData: any) => {
      if (weekData.overallMetrics) {
        weekData.overallMetrics.forEach((m: any) => {
          const metricName = m.metric_name;
          if (!allMetrics[metricName]) {
            allMetrics[metricName] = { values: [], dates: [], weekData: [] };
          }
          const value = getNumericValue(m.metric_value);
          if (value > 0 || metricName.includes('Rate') || metricName.includes('%')) {
            allMetrics[metricName].values.push(value);
            allMetrics[metricName].dates.push(weekData.week.week_start_date);
            allMetrics[metricName].weekData.push(weekData);
          }
        });
      }
    });
    
    // Process channel metrics
    const channelMetrics: { [channel: string]: { [metric: string]: number[] } } = {};
    weeks.forEach((weekData: any) => {
      if (weekData.marketingChannels) {
        weekData.marketingChannels.forEach((m: any) => {
          const channel = m.channel_name;
          const metric = m.metric_name;
          if (!channelMetrics[channel]) channelMetrics[channel] = {};
          if (!channelMetrics[channel][metric]) channelMetrics[channel][metric] = [];
          const value = getNumericValue(m.metric_value);
          if (value > 0) {
            channelMetrics[channel][metric].push(value);
          }
        });
      }
    });
    
    // Format comprehensive output
    let output = `🔍 COMPREHENSIVE HISTORICAL ANALYSIS (${weeks.length} weeks spanning ${Object.keys(byYear).length} years):

`;
    
    // 1. TIME-BASED PATTERNS
    output += `📅 TIME-BASED PATTERNS:
`;
    output += `- Total weeks analyzed: ${weeks.length}
`;
    output += `- Data spans ${Object.keys(byMonth).length} unique months
`;
    output += `- Data spans ${Object.keys(byQuarter).length} quarters
`;
    output += `- Data spans ${Object.keys(byYear).length} years: ${Object.keys(byYear).sort().join(', ')}

`;
    
    // 2. STATISTICAL SUMMARIES FOR KEY METRICS
    output += `📊 STATISTICAL SUMMARIES (across all ${weeks.length} weeks):

`;
    const keyMetrics = ['Total Revenue', 'Revenue', 'Total Orders', 'Orders', 'Conversion Rate', 'Average Order Value', 'AOV'];
    keyMetrics.forEach(metricKey => {
      const matchingMetrics = Object.keys(allMetrics).filter(m => 
        m.includes(metricKey) || metricKey.includes(m.split(' ')[0])
      );
      if (matchingMetrics.length > 0) {
        const metricName = matchingMetrics[0];
        const data = allMetrics[metricName];
        if (data.values.length > 0) {
          const stats = calculateStats(data.values);
          if (stats) {
            const formatValue = (val: number) => {
              if (metricName.includes('Rate') || metricName.includes('%')) {
                return `${val.toFixed(2)}%`;
              }
              if (metricName.includes('Revenue') || metricName.includes('Sales')) {
                return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
              }
              return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            };
            output += `${metricName}:
`;
            output += `  - Average: ${formatValue(stats.avg)}
`;
            output += `  - Median: ${formatValue(stats.median)}
`;
            output += `  - Minimum: ${formatValue(stats.min)} (${data.dates[data.values.indexOf(stats.min)]})
`;
            output += `  - Maximum: ${formatValue(stats.max)} (${data.dates[data.values.indexOf(stats.max)]})
`;
            output += `  - Range: ${formatValue(stats.max - stats.min)}
`;
            output += `  - Data points: ${stats.count} weeks

`;
          }
        }
      }
    });
    
    // 3. TREND ANALYSIS (multiple timeframes)
    output += `📈 TREND ANALYSIS:

`;
    keyMetrics.forEach(metricKey => {
      const matchingMetrics = Object.keys(allMetrics).filter(m => 
        m.includes(metricKey) || metricKey.includes(m.split(' ')[0])
      );
      if (matchingMetrics.length > 0) {
        const metricName = matchingMetrics[0];
        const data = allMetrics[metricName];
        if (data.values.length >= 8) {
          // Recent 4 weeks vs previous 4 weeks
          const recent4 = data.values.slice(0, 4);
          const prev4 = data.values.slice(4, 8);
          if (recent4.length === 4 && prev4.length === 4) {
            const recentAvg = recent4.reduce((a, b) => a + b, 0) / 4;
            const prevAvg = prev4.reduce((a, b) => a + b, 0) / 4;
            const change = ((recentAvg - prevAvg) / prevAvg * 100);
            const direction = change > 0 ? '↑' : '↓';
            output += `${metricName} - Recent 4 weeks vs Previous 4 weeks: ${direction} ${Math.abs(change).toFixed(1)}%
`;
          }
          
          // Last 12 weeks vs previous 12 weeks (if available)
          if (data.values.length >= 24) {
            const recent12 = data.values.slice(0, 12);
            const prev12 = data.values.slice(12, 24);
            const recentAvg = recent12.reduce((a, b) => a + b, 0) / 12;
            const prevAvg = prev12.reduce((a, b) => a + b, 0) / 12;
            const change = ((recentAvg - prevAvg) / prevAvg * 100);
            const direction = change > 0 ? '↑' : '↓';
            output += `${metricName} - Last 12 weeks vs Previous 12 weeks: ${direction} ${Math.abs(change).toFixed(1)}%
`;
          }
          
          // Year-over-year if we have 52+ weeks
          if (data.values.length >= 52) {
            const thisYear = data.values.slice(0, 52);
            const lastYear = data.values.slice(52, 104);
            if (lastYear.length >= 52) {
              const thisYearAvg = thisYear.reduce((a, b) => a + b, 0) / 52;
              const lastYearAvg = lastYear.reduce((a, b) => a + b, 0) / 52;
              const change = ((thisYearAvg - lastYearAvg) / lastYearAvg * 100);
              const direction = change > 0 ? '↑' : '↓';
              output += `${metricName} - Year-over-Year (last 52 weeks vs previous 52): ${direction} ${Math.abs(change).toFixed(1)}%
`;
            }
          }
        }
      }
    });
    output += `
`;
    
    // 4. SEASONAL BENCHMARKS (monthly averages)
    output += `🌍 SEASONAL BENCHMARKS (Monthly Averages):

`;
    Object.keys(byMonthName).sort().forEach(month => {
      const monthWeeks = byMonthName[month];
      if (monthWeeks.length > 0) {
        // Calculate average revenue for this month across all years
        const revenues: number[] = [];
        monthWeeks.forEach((weekData: any) => {
          if (weekData.overallMetrics) {
            const revenue = weekData.overallMetrics.find((m: any) => 
              m.metric_name.includes('Revenue') || m.metric_name.includes('Sales')
            );
            if (revenue) {
              const value = getNumericValue(revenue.metric_value);
              if (value > 0) revenues.push(value);
            }
          }
        });
        if (revenues.length > 0) {
          const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;
          output += `${month}: Average Revenue $${avgRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (${revenues.length} weeks across ${new Set(monthWeeks.map((w: any) => new Date(w.week.week_start_date).getFullYear())).size} years)
`;
        }
      }
    });
    output += `
`;
    
    // 5. QUARTERLY COMPARISONS
    output += `📅 QUARTERLY PERFORMANCE SUMMARY:

`;
    const quarters = Object.keys(byQuarter).sort();
    quarters.forEach(quarter => {
      const quarterWeeks = byQuarter[quarter];
      const revenues: number[] = [];
      quarterWeeks.forEach((weekData: any) => {
        if (weekData.overallMetrics) {
          const revenue = weekData.overallMetrics.find((m: any) => 
            m.metric_name.includes('Revenue') || m.metric_name.includes('Sales')
          );
          if (revenue) {
            const value = getNumericValue(revenue.metric_value);
            if (value > 0) revenues.push(value);
          }
        }
      });
      if (revenues.length > 0) {
        const totalRevenue = revenues.reduce((a, b) => a + b, 0);
        const avgRevenue = totalRevenue / revenues.length;
        output += `${quarter}: Total $${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}, Avg/Week $${avgRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (${revenues.length} weeks)
`;
      }
    });
    output += `
`;
    
    // 6. BEST/WORST PERFORMING PERIODS
    output += `🏆 BEST & WORST PERFORMING PERIODS:

`;
    const revenueMetric = Object.keys(allMetrics).find(m => m.includes('Revenue') || m.includes('Sales'));
    if (revenueMetric && allMetrics[revenueMetric].values.length > 0) {
      const revenueData = allMetrics[revenueMetric];
      const maxIndex = revenueData.values.indexOf(Math.max(...revenueData.values));
      const minIndex = revenueData.values.indexOf(Math.min(...revenueData.values));
      output += `Best Week: ${revenueData.dates[maxIndex]} - $${revenueData.values[maxIndex].toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
`;
      output += `Worst Week: ${revenueData.dates[minIndex]} - $${revenueData.values[minIndex].toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
`;
      output += `Performance Range: ${((revenueData.values[maxIndex] - revenueData.values[minIndex]) / revenueData.values[minIndex] * 100).toFixed(1)}% difference
`;
    }
    output += `
`;
    
    // 7. CHANNEL-SPECIFIC HISTORICAL PATTERNS
    output += `📺 CHANNEL-SPECIFIC HISTORICAL PATTERNS:

`;
    Object.keys(channelMetrics).forEach(channel => {
      output += `${channel}:
`;
      Object.keys(channelMetrics[channel]).forEach(metric => {
        const values = channelMetrics[channel][metric];
        if (values.length > 0) {
          const stats = calculateStats(values);
          if (stats) {
            const formatValue = (val: number) => {
              if (metric.includes('Rate') || metric.includes('%')) {
                return `${val.toFixed(2)}%`;
              }
              if (metric.includes('Revenue') || metric.includes('Sales') || metric.includes('Spend')) {
                return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
              }
              return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
            };
            output += `  ${metric}: Avg ${formatValue(stats.avg)}, Range ${formatValue(stats.min)}-${formatValue(stats.max)} (${stats.count} data points)
`;
          }
        }
      });
      output += `
`;
    });
    
    // 8. RECENT WEEKS DETAIL (last 12 weeks for detailed context)
    output += `📋 RECENT WEEKS DETAIL (Last 12 weeks for context):

`;
    weeks.slice(0, 12).forEach((weekData: any, idx: number) => {
      if (weekData.week) {
        output += `Week ${idx + 1}: ${weekData.week.week_start_date} to ${weekData.week.week_end_date}
`;
        if (weekData.overallMetrics) {
          const revenue = weekData.overallMetrics.find((m: any) => m.metric_name.includes('Revenue') || m.metric_name.includes('Sales'));
          const orders = weekData.overallMetrics.find((m: any) => m.metric_name.includes('Order') && !m.metric_name.includes('Value'));
          const conversion = weekData.overallMetrics.find((m: any) => m.metric_name.includes('Conversion'));
          const aov = weekData.overallMetrics.find((m: any) => m.metric_name.includes('Average Order Value') || m.metric_name.includes('AOV'));
          if (revenue) output += `  Revenue: ${revenue.metric_value}
`;
          if (orders) output += `  Orders: ${orders.metric_value}
`;
          if (conversion) output += `  Conversion: ${conversion.metric_value}
`;
          if (aov) output += `  AOV: ${aov.metric_value}
`;
        }
        output += `
`;
      }
    });
    
    return output;
  };
  
  const historicalAnalysisText = historicalData && historicalData.length > 0 
    ? formatHistoricalData(historicalData) 
    : '';
const prompt = `You are an expert ecommerce marketing analyst for Pürblack.com, a premium health supplement brand. Analyze the following weekly marketing data and provide actionable insights and recommendations.

Week: ${week.week_start_date} to ${week.week_end_date}

${promotions && promotions.length > 0 ? `🎯🎯🎯 PROMOTIONS & DISCOUNTS ACTIVE THIS WEEK 🎯🎯🎯

The following promotions were active during this week:

${promotions.map((promo: any, i: number) => {
  const discountAmount = promo.gross_sales && promo.net_sales ? promo.gross_sales - promo.net_sales : null;
  const discountPercent = discountAmount && promo.gross_sales ? (discountAmount / promo.gross_sales * 100).toFixed(1) : null;
  const roi = discountAmount && promo.net_sales ? ((promo.net_sales / discountAmount) * 100).toFixed(1) : null;
  
  return `
${i + 1}. ${promo.offer_type}
   - Dates: ${promo.start_date} to ${promo.end_date}
   ${promo.gross_sales ? `   - Gross Sales: $${promo.gross_sales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ''}
   ${promo.net_sales ? `   - Net Sales: $${promo.net_sales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : ''}
   ${discountAmount ? `   - Discount Given: $${discountAmount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} (${discountPercent}% of gross)` : ''}
   ${roi ? `   - ROI: ${roi}% (net sales per $1 of discount)` : ''}
`;
}).join('')}

⚠️⚠️⚠️ CRITICAL: You MUST provide DETAILED, SPECIFIC analysis of these promotions:

1. **PROMOTION IMPACT ANALYSIS** (REQUIRED - be specific):
   - Calculate the exact revenue difference: Compare this week's revenue to the same week a year earlier and previous week
   - State clearly: "This week's revenue of $X is [Y%] higher/lower than the same week last year ($Z) and [W%] higher/lower than last week ($V)"
   - If promotion sales data is provided, calculate: "The promotion generated $X in net sales, representing [Y%] of this week's total revenue"
   - Determine if revenue increase is from promotion or organic growth: "The [X%] revenue increase is [entirely/partially/not] attributable to the promotion"

2. **PROMOTION EFFECTIVENESS METRICS** (REQUIRED - use actual numbers):
   - Discount efficiency: "For every $1 in discounts given, the promotion generated $X in net sales (ROI: Y%)"
   - Compare to week's overall revenue: "Promotion net sales ($X) represent [Y%] of total week revenue ($Z)"
   - If multiple promotions: Compare which performed better with specific numbers

3. **COMPARATIVE ANALYSIS** (REQUIRED - be specific):
   - Week-over-week: "Revenue increased [X%] from last week. Given the [promotion name], this is [expected/unexpected]. Last week had [promotion/no promotion]."
   - Year-over-year: "Revenue is [X%] higher than same week last year ($Y vs $Z). The [promotion name] likely contributed [estimated %] of this increase."
   - AOV impact: "AOV is $X, which is [Y%] higher/lower than last week. This [aligns/doesn't align] with the [promotion type] which typically [increases/decreases] AOV."

4. **DETAILED RECOMMENDATIONS** (REQUIRED - be actionable):
   - Specific promotion strategy: "The [promotion type] generated $X net sales with $Y in discounts. Consider [specific action] to improve ROI."
   - Timing recommendations: "This promotion ran [dates]. Compare to similar promotions in [other periods] to determine optimal timing."
   - Discount level optimization: "The [X%] discount generated $Y net sales. Test [specific alternative] to potentially increase net sales while maintaining profitability."

5. **PROFITABILITY ANALYSIS** (if data available):
   - Net vs Gross: "Gross sales were $X, but after $Y in discounts, net sales were $Z. This represents a [X%] margin."
   - Incremental value: "The promotion drove $X in net sales. Without the promotion, estimated revenue would be $Y, meaning the promotion generated $Z in incremental revenue."

⚠️ DO NOT provide generic insights. Every insight about promotions MUST include:
- Specific dollar amounts
- Percentage calculations
- Comparisons to previous periods
- Clear attribution of revenue changes to promotions
- Actionable recommendations with specific numbers

` : ''}

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

${recommendationRules.map((rule: string, i: number) => `${i + 1}. ${rule}`).join('\\n')}

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
${previousWeekData.overallMetrics?.map((m: any) => String(m.metric_name) + ': ' + String(m.metric_value)).join('\\n') || 'No metrics available'}

Previous Week Channels:
${Object.entries(
  (previousWeekData.marketingChannels || []).reduce((acc: any, item: any) => {
    if (!acc[item.channel_name]) acc[item.channel_name] = [];
    acc[item.channel_name].push(String(item.metric_name) + ': ' + String(item.metric_value));
    return acc;
  }, {})
).map(([channel, metrics]: [string, any]) => `${channel}: ${metrics.join(', ')}`).join('\\n') || 'No channel data available'}

⚠️ IMPORTANT: Use this previous week data to:
- Compare current week performance vs previous week
- Identify trends (improving, declining, stable)
- Calculate percentage changes where relevant
- Highlight significant changes that warrant attention



${sameWeekYearEarlierData ? `📅 SAME WEEK A YEAR EARLIER (YEAR-OVER-YEAR COMPARISON):
This is the historical average for comparison - the same week from one year ago. This data is critical for year-over-year analysis and understanding seasonal patterns.

Same Week Year Earlier: ${sameWeekYearEarlierData.week?.week_start_date} to ${sameWeekYearEarlierData.week?.week_end_date}
${sameWeekYearEarlierData.week?.notes ? `Same Week Year Earlier Notes: ${sameWeekYearEarlierData.week.notes}` : ''}

Same Week Year Earlier Metrics:
${sameWeekYearEarlierData.overallMetrics?.map((m: any) => String(m.metric_name) + ': ' + String(m.metric_value)).join('\n') || 'No metrics available'}

Same Week Year Earlier Channels:
${Object.entries(
  (sameWeekYearEarlierData.marketingChannels || []).reduce((acc: any, item: any) => {
    if (!acc[item.channel_name]) acc[item.channel_name] = [];
    acc[item.channel_name].push(String(item.metric_name) + ': ' + String(item.metric_value));
    return acc;
  }, {})
).map(([channel, metrics]: [string, any]) => `${channel}: ${metrics.join(', ')}`).join('\n') || 'No channel data available'}}

⚠️ CRITICAL: When referencing "historical average" in your insights, you MUST mean the same week a year earlier. Always state comparisons with:
1. The same week a year earlier (year-over-year comparison)
2. The week immediately prior (week-over-week comparison)

` : ''}${historicalAnalysisText ? `🔍🔍🔍 DEEP HISTORICAL PATTERN & SEASONALITY ANALYSIS (${historicalData?.length || 0} weeks of data) 🔍🔍🔍

${historicalAnalysisText}

⚠️⚠️⚠️ CRITICAL ANALYSIS REQUIREMENTS - YOU MUST USE THIS COMPREHENSIVE HISTORICAL DATA:

🚨 MANDATORY: The historical data includes statistical summaries, seasonal benchmarks, quarterly comparisons, and channel patterns. You MUST reference these in your insights.

1. **STATISTICAL ANALYSIS**: Use the provided statistical summaries (min, max, average, median) to:
   - Identify if current metrics are in the top/bottom quartiles historically
   - Compare current performance to the same week a year earlier (historical average) and medians
   - Reference the best/worst performing periods when relevant
   - Calculate how many standard deviations current performance is from the mean

2. **SEASONALITY & BENCHMARKING**: Use the seasonal benchmarks to:
   - Compare current week to the monthly average for this time of year
   - Identify if performance is above/below seasonal norms
   - Reference year-over-year comparisons when available
   - Explain anomalies using seasonal context (e.g., "This is typically a slow month, so the performance is actually strong")

3. **TREND ANALYSIS**: Use multiple timeframes:
   - Recent 4 weeks vs previous 4 weeks (short-term momentum)
   - Last 12 weeks vs previous 12 weeks (quarterly trend)
   - Year-over-year (52 weeks vs previous 52) if available
   - Identify acceleration, deceleration, or stabilization of trends
   - Distinguish between cyclical patterns and structural changes

4. **QUARTERLY & YEARLY CONTEXT**: Reference quarterly summaries to:
   - Compare current quarter performance to historical quarters
   - Identify seasonal patterns across quarters
   - Explain performance in context of typical quarterly cycles

5. **CHANNEL-SPECIFIC PATTERNS**: Use channel historical patterns to:
   - Identify which channels are performing above/below the same week a year earlier (historical average)
   - Compare channel efficiency (ROI) to historical norms
   - Recommend channel budget shifts based on historical performance patterns

6. **BEST/WORST PERIOD ANALYSIS**: Reference the best/worst performing periods to:
   - Explain what made those periods exceptional
   - Identify if current conditions are similar to best/worst periods
   - Learn from historical extremes

7. **INSIGHT GENERATION REQUIREMENTS**: Each insight MUST:
   - ALWAYS state comparisons with BOTH:
     * The same week a year earlier (year-over-year comparison) - this is the "historical average"
     * The week immediately prior (week-over-week comparison)
   - When referencing "historical average", you MUST mean the same week a year earlier
   - Reference specific statistical data with clear comparisons (e.g., "Current revenue is 15% above the same week a year earlier ($8,773) and 30.9% above the previous week")
   - Compare to seasonal benchmarks (e.g., "For January, this is 20% higher than the same week last year")
   - Use trend analysis (e.g., "This continues a 3-month upward trend")
   - Reference historical context (e.g., "Similar to Q2 2023 performance pattern")
   - Distinguish short-term fluctuations from long-term changes
   - Provide actionable recommendations based on historical patterns
   - DO NOT make suggestions about changes to the cart (cart abandonment, cart optimization, exit-intent pop-ups, etc.)

⚠️ CRITICAL COMPARISON REQUIREMENTS:
- You MUST ALWAYS compare with BOTH:
  1. The same week a year earlier (year-over-year) - this is the "historical average"
  2. The week immediately prior (week-over-week)
- When you say "historical average" or "compared to historical average", you MUST mean the same week a year earlier
- Use statistical analysis, seasonal benchmarks, quarterly comparisons, and trend analysis to provide deep, data-driven insights
- State both comparisons clearly in each insight (e.g., "30.9% above the same week a year earlier and 15% above the previous week")

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

🛡️ DEFAULT RECOMMENDATION RULES:
- DO NOT make suggestions about changes to the cart (cart abandonment, cart optimization, exit-intent pop-ups for cart, etc.)

Focus on:
- ROI and efficiency across channels (compare to the same week a year earlier and the previous week)
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
      // Business context included in insights generation
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

interface AISearchResult {
  searchEngine: string;
  topResults: Array<{
    url: string;
    title: string;
    snippet?: string;
    position: number;
  }>;
}

export async function generateAISearchInsights(data: {
  searchQuery: string;
  results: AISearchResult[];
  brandName?: string;
}): Promise<Insight[]> {
  const { searchQuery, results, brandName = 'Pürblack' } = data;

  try {
    const client = getOpenAIClient();

    // Format search results for analysis
    const resultsText = results.map(result => {
      const engineName = result.searchEngine;
      const topResults = result.topResults
        .map((item, idx) => `${idx + 1}. ${item.title}\n   ${item.snippet || 'No snippet'}\n   URL: ${item.url}`)
        .join('\n\n');
      return `${engineName}:\n${topResults}`;
    }).join('\n\n---\n\n');

    const prompt = `You are an expert SEO and brand visibility analyst. Analyze the following AI search results for the query "${searchQuery}" and provide actionable insights to help the brand "${brandName}" improve its visibility and performance in AI-powered search results.

SEARCH QUERY: "${searchQuery}"

AI SEARCH RESULTS:
${resultsText}

Your analysis should cover:

1. **Brand Visibility Assessment**
   - Is "${brandName}" appearing in any of the top 5 results? If yes, in which search engines and at what positions?
   - Which competitors are appearing most frequently across all search engines?
   - What's the competitive landscape (who dominates, who's missing)?

2. **Content Themes & Patterns**
   - What common themes, topics, or keywords appear across top-performing results?
   - What types of content formats are ranking (articles, product pages, reviews, etc.)?
   - What messaging or value propositions are winning?

3. **Opportunities & Gaps**
   - Where can "${brandName}" improve to rank higher?
   - What content gaps exist that "${brandName}" could fill?
   - What are competitors doing that "${brandName}" isn't?

4. **Actionable Recommendations**
   - Specific content topics or formats "${brandName}" should create
   - SEO improvements (title tags, meta descriptions, content structure)
   - Link building or citation opportunities
   - Messaging adjustments to match what's resonating

Provide 5-8 specific, actionable insights. Format your response as a JSON object with an "insights" array:

{
  "insights": [
    {
      "text": "Insight description (2-4 sentences)...",
      "type": "opportunity",
      "priority": "high"
    },
    ...
  ]
}

Each insight MUST have:
- text: The insight description (2-4 sentences, be specific)
- type: One of "opportunity", "warning", "success", or "recommendation"
- priority: One of "high", "medium", or "low"

Focus on insights that will help "${brandName}" appear in more top 5 results across AI search engines. Be specific and actionable.

Return ONLY the JSON object, no markdown, no code blocks, no additional text.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert SEO and brand visibility analyst. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '';
    console.log('[AI Search Insights] Raw response length:', content.length);
    console.log('[AI Search Insights] Response preview:', content.substring(0, 300));
    
    let insights: Insight[] = [];

    try {
      // Try to extract JSON from the response (in case there's extra text)
      let jsonContent = content.trim();
      
      // Remove markdown code blocks if present
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Try to find JSON array or object in the content
      const jsonArrayMatch = jsonContent.match(/\[[\s\S]*\]/);
      const jsonObjectMatch = jsonContent.match(/\{[\s\S]*\}/);
      
      let parsed: any;
      
      if (jsonArrayMatch) {
        // Found JSON array
        parsed = JSON.parse(jsonArrayMatch[0]);
      } else if (jsonObjectMatch) {
        // Found JSON object
        parsed = JSON.parse(jsonObjectMatch[0]);
      } else {
        // Try parsing the whole content
        parsed = JSON.parse(jsonContent);
      }
      
      console.log('[AI Search Insights] Parsed JSON keys:', Object.keys(parsed));
      
      // Handle different possible response formats
      if (Array.isArray(parsed)) {
        insights = parsed;
        console.log('[AI Search Insights] Found array with', insights.length, 'items');
      } else if (parsed.insights && Array.isArray(parsed.insights)) {
        insights = parsed.insights;
        console.log('[AI Search Insights] Found insights array with', insights.length, 'items');
      } else if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        insights = parsed.recommendations;
        console.log('[AI Search Insights] Found recommendations array with', insights.length, 'items');
      } else if (parsed.data && Array.isArray(parsed.data)) {
        insights = parsed.data;
        console.log('[AI Search Insights] Found data array with', insights.length, 'items');
      } else {
        // Try to extract insights from any array-valued key
        const keys = Object.keys(parsed);
        console.log('[AI Search Insights] Searching for array in keys:', keys);
        for (const key of keys) {
          if (Array.isArray(parsed[key]) && parsed[key].length > 0) {
            // Check if it looks like insights (has objects with text property)
            const firstItem = parsed[key][0];
            if (firstItem && typeof firstItem === 'object' && (firstItem.text || firstItem.insight || firstItem.recommendation)) {
              insights = parsed[key];
              console.log('[AI Search Insights] Found insights in key:', key, 'with', insights.length, 'items');
              break;
            }
          }
        }
      }

      // If still no insights, try to parse as structured text
      if (insights.length === 0 && content.length > 0) {
        console.log('[AI Search Insights] No structured insights found, attempting text parsing');
        // Try to extract insights from numbered list format
        const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
        for (const line of lines) {
          // Match numbered lists or bullet points with insight-like content
          const match = line.match(/^[\d•\-\*]\s*[\.\)]?\s*(.+)/);
          if (match && insights.length < 10) {
            const text = match[1].trim();
            if (text.length > 20) { // Only include substantial insights
              insights.push({
                text,
                type: 'recommendation',
                priority: 'medium',
              });
            }
          }
        }
        console.log('[AI Search Insights] Extracted', insights.length, 'insights from text');
      }

      // Validate and filter insights
      insights = insights
        .filter((insight: any) => {
          if (!insight || typeof insight !== 'object') return false;
          // Support multiple field names for text
          const hasText = insight.text || insight.insight || insight.recommendation || insight.description;
          return hasText && String(hasText).trim().length > 0;
        })
        .map((insight: any) => ({
          text: String(insight.text || insight.insight || insight.recommendation || insight.description || ''),
          type: ['opportunity', 'warning', 'success', 'recommendation'].includes(insight.type)
            ? insight.type
            : 'recommendation',
          priority: ['high', 'medium', 'low'].includes(insight.priority)
            ? insight.priority
            : 'medium',
        }));

      console.log('[AI Search Insights] Final insights count:', insights.length);

      if (insights.length === 0) {
        console.error('[AI Search Insights] No valid insights after processing');
        console.error('[AI Search Insights] Original content:', content);
        throw new Error('No valid insights found in response');
      }

      return insights;
    } catch (parseError: any) {
      console.error('[AI Search Insights] Parse error:', parseError);
      console.error('[AI Search Insights] Error message:', parseError.message);
      console.error('[AI Search Insights] Full response content:', content);
      
      // Last resort: create a fallback insight
      if (content.length > 0) {
        console.log('[AI Search Insights] Creating fallback insight from content');
        return [{
          text: `Analysis completed. Raw response: ${content.substring(0, 500)}${content.length > 500 ? '...' : ''}`,
          type: 'recommendation' as const,
          priority: 'medium' as const,
        }];
      }
      
      throw new Error('Failed to parse insights from AI response: ' + (parseError.message || 'Unknown error'));
    }
  } catch (error: any) {
    console.error('Error generating AI search insights:', error);
    throw new Error('Failed to generate AI search insights: ' + (error.message || 'Unknown error'));
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

