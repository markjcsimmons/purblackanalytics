import OpenAI from 'openai';

// Lazy-load OpenAI client to prevent build-time initialization
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || process.env.OPEN_API_KEY;
    
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY, OPEN_AI_KEY, or OPEN_API_KEY environment variable is required.');
    }
    
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format. Key should start with "sk-".');
    }
    
    openai = new OpenAI({
      apiKey: apiKey,
    });
  }
  return openai as OpenAI;
}

export interface Insight {
  text: string;
  type: 'opportunity' | 'warning' | 'success' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
}

export async function generatePromotionInsights(data: {
  promotions: any[];
  weeksData: any[];
}): Promise<Insight[]> {
  const { promotions, weeksData } = data;
  const client = getOpenAIClient();

  // Sort promotions by date (most recent first)
  const sortedPromotions = [...promotions].sort((a: any, b: any) => 
    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );

  const latestPromotion = sortedPromotions[0];
  if (!latestPromotion) {
    throw new Error('No promotions found');
  }

  // Find the week that contains the latest promotion
  const latestPromoWeek = weeksData.find((weekData: any) => {
    const week = weekData.week;
    if (!week) return false;
    const weekStart = new Date(week.week_start_date);
    const weekEnd = new Date(week.week_end_date);
    const promoStart = new Date(latestPromotion.start_date);
    const promoEnd = new Date(latestPromotion.end_date);
    return (promoStart <= weekEnd && promoEnd >= weekStart);
  });

  // Calculate promotion statistics
  const totalNetSales = sortedPromotions.reduce((sum: number, p: any) => sum + (p.net_sales || 0), 0);
  const totalGrossSales = sortedPromotions.reduce((sum: number, p: any) => sum + (p.gross_sales || 0), 0);
  const totalDiscounts = totalGrossSales - totalNetSales;
  const avgNetSales = sortedPromotions.length > 0 ? totalNetSales / sortedPromotions.length : 0;
  const avgGrossSales = sortedPromotions.length > 0 ? totalGrossSales / sortedPromotions.length : 0;

  // Group promotions by type
  const promotionsByType: { [key: string]: any[] } = {};
  sortedPromotions.forEach((promo: any) => {
    const type = promo.offer_type || 'Unknown';
    if (!promotionsByType[type]) {
      promotionsByType[type] = [];
    }
    promotionsByType[type].push(promo);
  });

  // Format promotion data for prompt
  const latestPromoText = `
LATEST PROMOTION:
- Type: ${latestPromotion.offer_type}
- Dates: ${latestPromotion.start_date} to ${latestPromotion.end_date}
- Net Sales: $${(latestPromotion.net_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
- Gross Sales: $${(latestPromotion.gross_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
- Discount Given: $${((latestPromotion.gross_sales || 0) - (latestPromotion.net_sales || 0)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
${latestPromotion.gross_sales && latestPromotion.net_sales ? `- Discount %: ${(((latestPromotion.gross_sales - latestPromotion.net_sales) / latestPromotion.gross_sales) * 100).toFixed(1)}%` : ''}
${latestPromotion.gross_sales && latestPromotion.net_sales ? `- ROI: ${((latestPromotion.net_sales / (latestPromotion.gross_sales - latestPromotion.net_sales)) * 100).toFixed(1)}%` : ''}
`;

  const weekRevenue = latestPromoWeek?.overallMetrics?.find((m: any) => 
    m.metric_name === 'Revenue' || m.metric_name === '* Revenue'
  )?.metric_value || 0;

  const previousPromotionsText = sortedPromotions.slice(1, 6).map((promo: any, i: number) => `
${i + 1}. ${promo.offer_type} (${promo.start_date} to ${promo.end_date})
   - Net Sales: $${(promo.net_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
   - Gross Sales: $${(promo.gross_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
   - Discount: $${((promo.gross_sales || 0) - (promo.net_sales || 0)).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
`).join('\n');

  const promotionTypeStatsText = Object.entries(promotionsByType).map(([type, promos]) => {
    const typeNetSales = promos.reduce((sum: number, p: any) => sum + (p.net_sales || 0), 0);
    const typeGrossSales = promos.reduce((sum: number, p: any) => sum + (p.gross_sales || 0), 0);
    const typeDiscounts = typeGrossSales - typeNetSales;
    return `
${type} (${promos.length} promotion${promos.length > 1 ? 's' : ''}):
  - Total Net Sales: $${typeNetSales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
  - Total Gross Sales: $${typeGrossSales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
  - Total Discounts: $${typeDiscounts.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
  - Avg Net Sales per Promotion: $${(typeNetSales / promos.length).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
`;
  }).join('\n');

  const prompt = `You are an expert ecommerce marketing analyst for Pürblack.com, a premium health supplement brand. Analyze the following promotion data and provide VERY SPECIFIC, DETAILED insights about promotion performance.

${latestPromoText}

WEEK CONTEXT:
${latestPromoWeek ? `
- Week: ${latestPromoWeek.week?.week_start_date} to ${latestPromoWeek.week?.week_end_date}
- Week Total Revenue: $${weekRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
- Latest Promotion Net Sales as % of Week Revenue: ${weekRevenue > 0 ? ((latestPromotion.net_sales || 0) / weekRevenue * 100).toFixed(1) : 0}%
- Latest Promotion Gross Sales as % of Week Revenue: ${weekRevenue > 0 ? ((latestPromotion.gross_sales || 0) / weekRevenue * 100).toFixed(1) : 0}%
` : 'Week data not available for latest promotion'}

PREVIOUS TOP 5 PROMOTIONS (for comparison):
${previousPromotionsText || 'No previous promotions available'}

PROMOTION TYPE STATISTICS:
${promotionTypeStatsText}

OVERALL STATISTICS:
- Total Promotions Analyzed: ${sortedPromotions.length}
- Total Net Sales (all promotions): $${totalNetSales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
- Total Gross Sales (all promotions): $${totalGrossSales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
- Total Discounts Given: $${totalDiscounts.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
- Average Net Sales per Promotion: $${avgNetSales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
- Average Gross Sales per Promotion: $${avgGrossSales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}

⚠️⚠️⚠️ CRITICAL REQUIREMENTS - YOU MUST PROVIDE VERY SPECIFIC INSIGHTS WITH EXACT NUMBERS:

1. **LATEST PROMOTION REVENUE CONTRIBUTION** (REQUIRED - be extremely specific):
   - State EXACT dollar amounts: "The latest promotion generated $X in net sales and $Y in gross sales"
   - Calculate and state the percentage of week revenue: "This represents X% of the week's total revenue ($Z)"
   - If discount data is available: "The promotion required $A in discounts, resulting in a net contribution of $X"
   - Calculate ROI if possible: "For every $1 in discounts, the promotion generated $B in net sales (ROI: C%)"

2. **COMPARISON TO PREVIOUS PROMOTIONS** (REQUIRED - use actual numbers):
   - Compare latest promotion to previous promotions: "The latest promotion's net sales of $X is [Y% higher/lower] than the previous promotion ($Z)"
   - Identify best/worst performing promotions with specific dollar amounts
   - Compare discount efficiency: "The latest promotion's discount efficiency of X% is [better/worse] than the average of Y%"

3. **PROMOTION TYPE PERFORMANCE** (REQUIRED - be specific):
   - Compare promotion types: "Promotions of type 'X' have generated an average of $Y in net sales, compared to $Z for type 'W'"
   - Identify which promotion types are most effective with specific numbers
   - Recommend which promotion types to use more/less based on data

4. **TRENDS AND PATTERNS** (REQUIRED):
   - Identify trends: "Net sales have [increased/decreased] by X% over the last Y promotions"
   - Note any patterns in timing, discount levels, or promotion types
   - Highlight any concerning trends (e.g., declining ROI, increasing discount requirements)

5. **ACTIONABLE RECOMMENDATIONS** (REQUIRED - be specific):
   - Provide specific recommendations with numbers: "Based on the data, consider [specific action] which could potentially increase net sales by [estimated %]"
   - Recommend optimal discount levels based on historical performance
   - Suggest timing strategies based on promotion performance patterns

⚠️ DO NOT provide generic insights. Every insight MUST include:
- Specific dollar amounts
- Percentage calculations
- Comparisons to previous promotions
- Clear attribution of revenue contributions
- Actionable recommendations with specific numbers

Return ONLY a JSON object with an "insights" array, no additional text. Format:
{
  "insights": [
    {
      "text": "Very specific insight with exact numbers and percentages...",
      "type": "opportunity",
      "priority": "high"
    },
    ...
  ]
}`;

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert ecommerce marketing analyst. Always respond with valid JSON only. Provide very specific insights with exact numbers, percentages, and comparisons.',
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
    console.log('[Promotion Insights] Raw AI response content (first 500 chars):', content.substring(0, 500));
    let insights: Insight[] = [];

    try {
      // Attempt to strip markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      const cleanedContent = jsonMatch ? jsonMatch[1].trim() : content.trim();
      console.log('[Promotion Insights] Cleaned content (first 500 chars):', cleanedContent.substring(0, 500));

      const parsed = JSON.parse(cleanedContent);
      console.log('[Promotion Insights] JSON parsed successfully.');

      // Handle different possible response formats
      if (Array.isArray(parsed)) {
        insights = parsed;
      } else if (parsed.insights && Array.isArray(parsed.insights)) {
        insights = parsed.insights;
      } else if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
        insights = parsed.recommendations;
      } else {
        // Try to extract insights from other keys if the structure is different
        const keys = Object.keys(parsed);
        for (const key of keys) {
          if (Array.isArray(parsed[key])) {
            insights = parsed[key];
            console.log(`[Promotion Insights] Extracted insights from key: ${key}`);
            break;
          }
        }
      }

      // Validate and filter insights
      insights = insights
        .filter((insight: any) => insight && typeof insight === 'object' && (insight.text || insight.insight || insight.recommendation || insight.description))
        .map((insight: any) => ({
          text: String(insight.text || insight.insight || insight.recommendation || insight.description || ''),
          type: ['opportunity', 'warning', 'success', 'recommendation'].includes(insight.type)
            ? insight.type
            : 'recommendation',
          priority: ['high', 'medium', 'low'].includes(insight.priority)
            ? insight.priority
            : 'medium',
        }));

      if (insights.length === 0) {
        console.warn('[Promotion Insights] No valid insights found after parsing. Raw content:', content.substring(0, 500));
        throw new Error('No valid insights found in response');
      }

      return insights;
    } catch (parseError: any) {
      console.error('[Promotion Insights] JSON parsing failed. Attempting fallback text parsing. Error:', parseError.message);
      // Fallback to text parsing if JSON parsing fails
      const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
      const fallbackInsights: Insight[] = [];

      for (const line of lines) {
        const match = line.match(/^[\d•\-\*]\s*[\.\)]?\s*(.+)/);
        if (match && fallbackInsights.length < 10) {
          const text = match[1].trim();
          fallbackInsights.push({
            text: text.substring(0, 300),
            type: 'recommendation',
            priority: 'medium',
          });
        }
      }

      if (fallbackInsights.length > 0) {
        console.log('[Promotion Insights] Fallback text parsing successful, found', fallbackInsights.length, 'insights.');
        return fallbackInsights;
      } else {
        console.error('[Promotion Insights] Fallback text parsing also failed. Raw content:', content.substring(0, 500));
        throw new Error('Failed to parse insights from AI response after multiple attempts.');
      }
    }
  } catch (error: any) {
    console.error('[Promotion Insights] OpenAI API error:', error);
    if (error.status === 401) {
      throw new Error('OpenAI API authentication failed. The API key may be invalid or expired. Please check your OPENAI_API_KEY in Render.');
    }
    if (error.status === 429) {
      throw new Error('OpenAI API rate limit exceeded. Please try again in a moment.');
    }

    throw new Error('Failed to generate promotion insights: ' + (error.message || 'Unknown error') + '. Check server logs for details.');
  }
}
