import { NextRequest, NextResponse } from 'next/server';
import { getWeekData } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const weekId = parseInt(id);
    
    if (isNaN(weekId)) {
      return NextResponse.json(
        { error: 'Invalid week ID' },
        { status: 400 }
      );
    }

    const data = getWeekData(weekId);
    
    if (!data.week) {
      return NextResponse.json(
        { error: 'Week not found' },
        { status: 404 }
      );
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

