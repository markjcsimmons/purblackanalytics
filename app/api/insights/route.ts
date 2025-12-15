import { NextRequest, NextResponse } from 'next/server';
import { getWeekData, getWeeks, saveInsights } from '@/lib/db';
import { generateInsights } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { weekId, additionalContext } = await request.json();

    if (!weekId) {
      return NextResponse.json(
        { error: 'Missing weekId' },
        { status: 400 }
      );
    }

    // Get current week data
    const weekData = getWeekData(weekId);
    
    // Get previous week for comparison (optional)
    const weeks = getWeeks();
    const currentWeekIndex = weeks.findIndex((w: any) => w.id === weekId);
    let previousWeekData = null;
    
    if (currentWeekIndex < weeks.length - 1) {
      previousWeekData = getWeekData((weeks[currentWeekIndex + 1] as any).id);
    }

    // Combine week notes and additional context
    let contextParts: string[] = [];
    if (weekData.week?.notes) {
      contextParts.push(`Week notes: ${weekData.week.notes}`);
    }
    if (additionalContext) {
      contextParts.push(`Additional context: ${additionalContext}`);
    }
    const combinedContext = contextParts.length > 0 ? contextParts.join('\n\n') : undefined;

    // Generate insights using OpenAI
    const insights = await generateInsights({
      ...weekData,
      previousWeekData,
      businessContext: combinedContext,
    });

    // Save insights to database
    saveInsights(weekId, insights);

    return NextResponse.json({ 
      success: true, 
      insights 
    });
  } catch (error: any) {
    console.error('Insights generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

