import { NextRequest, NextResponse } from 'next/server';
import { generateInsights } from '@/lib/openai';
import { getRecommendationRules } from '@/lib/db';

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
    
    // Get ALL historical weeks for pattern and seasonality analysis
    // Weeks are ordered by week_start_date DESC (most recent first)
    const weeks = getWeeks();
    const currentWeekIndex = weeks.findIndex((w: any) => w.id === weekId);
    
    // Get all weeks except the current one for historical analysis
    // This allows the AI to identify patterns, trends, and seasonality
    const historicalWeeks = weeks
      .filter((w: any, index: number) => index !== currentWeekIndex)
      .map((w: any) => getWeekData(w.id));
    
    // Also keep previousWeekData for backward compatibility and quick comparison
    let previousWeekData = null;
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

    // Fetch recommendation rules
    const rulesData = getRecommendationRules();
    const rules = rulesData.map((r: any) => r.rule_text);

    // Generate insights using OpenAI with full historical context
    const insights = await generateInsights({
      ...weekData,
      previousWeekData,
      historicalData: historicalWeeks,
      businessContext: combinedContext,
      recommendationRules: rules,
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

