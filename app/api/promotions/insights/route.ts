import { NextRequest, NextResponse } from 'next/server';
import { generatePromotionInsights } from '@/lib/openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    // Dynamically import database functions
    const { getAllPromotions, getAllData } = await import('@/lib/db');
    
    const allPromotions = getAllPromotions();
    const allWeeksData = getAllData();

    if (!allPromotions || allPromotions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No promotion data available. Please upload promotion data first.',
      }, { status: 400 });
    }

    // Generate insights using OpenAI
    const insights = await generatePromotionInsights({
      promotions: allPromotions,
      weeksData: allWeeksData,
    });

    return NextResponse.json({
      success: true,
      insights,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Promotion insights generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
