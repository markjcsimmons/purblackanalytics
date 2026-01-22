import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const weekId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const includeComparisons = searchParams.get('comparisons') === 'true';
    
    if (isNaN(weekId)) {
      return NextResponse.json(
        { error: 'Invalid week ID' },
        { status: 400 }
      );
    }

    // Dynamically import database functions to avoid build-time execution
    const { getWeekData, findPreviousWeek, findSameWeekYearAgo } = await import('@/lib/db');
    const data = getWeekData(weekId);
    
    if (!data.week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
    }

    // Add comparison data if requested
    if (includeComparisons && data.week && typeof data.week === 'object' && 'week_start_date' in data.week) {
      const weekStartDate = (data.week as any).week_start_date;
      const previousWeekData = findPreviousWeek(weekStartDate);
      const sameWeekYearAgoData = findSameWeekYearAgo(weekStartDate);
      
      return NextResponse.json({
        ...data,
        comparisons: {
          previousWeek: previousWeekData,
          sameWeekYearAgo: sameWeekYearAgoData
        }
      });
    }

    // getWeekData already transforms insights to the correct format
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching week data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch week data' },
      { status: 500 }
    );
  }
}

