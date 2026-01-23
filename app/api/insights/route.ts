import { NextRequest, NextResponse } from 'next/server';
import { generateInsights } from '@/lib/openai 2';

// Force dynamic rendering - don't try to pre-render this route
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { weekId, additionalContext } = await request.json();

    if (!weekId) {
      return NextResponse.json(
        { error: 'Missing weekId' },
        { status: 400 }
      );
    }

    // Dynamically import database functions to avoid build-time execution
    const { getWeekData, getWeeks, saveInsights } = await import('@/lib/db');

    // Get current week data
    const weekData = getWeekData(weekId);
    
    // Get previous week for comparison (optional)
    // Weeks are ordered by week_start_date DESC (most recent first)
    // Previous week would be the one with an earlier date (higher index in the array)
    const weeks = getWeeks();
    const currentWeekIndex = weeks.findIndex((w: any) => w.id === weekId);
    let previousWeekData = null;
    
    // Get the previous week (earlier date) - it's at a higher index since weeks are sorted DESC
    if (currentWeekIndex >= 0 && currentWeekIndex < weeks.length - 1) {
      const previousWeek = weeks[currentWeekIndex + 1] as any;
      previousWeekData = getWeekData(previousWeek.id);
    }

    // Combine week notes and additional context
    let contextParts: string[] = [];
    if (weekData.week && typeof weekData.week === 'object' && 'notes' in weekData.week) {
      const weekNotes = (weekData.week as any).notes;
      if (weekNotes) {
        contextParts.push(`Week notes: ${weekNotes}`);
      }
    }
    if (additionalContext) {
      contextParts.push(`Additional context: ${additionalContext}`);
    }
    const combinedContext = contextParts.length > 0 ? contextParts.join('\n\n') : undefined;

    // Generate insights using OpenAI (promotions are already included in weekData if getWeekData was updated)
    const insights = await generateInsights({
      ...weekData,
      previousWeekData,
      businessContext: combinedContext,
      promotions: weekData.promotions || [],
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

