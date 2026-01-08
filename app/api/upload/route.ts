import { NextRequest, NextResponse } from 'next/server';
import type { WeekData } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const data: WeekData & { weekId?: number } = await request.json();

    // Validate required fields
    if (!data.weekStartDate || !data.weekEndDate) {
      return NextResponse.json(
        { error: 'Missing required fields: weekStartDate, weekEndDate' },
        { status: 400 }
      );
    }

    // Dynamically import database functions to avoid build-time execution
    const { saveWeekData } = await import('@/lib/db');
    const weekId = saveWeekData(data, data.weekId);

    return NextResponse.json({ 
      success: true, 
      weekId,
      message: 'Data uploaded successfully' 
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload data' },
      { status: 500 }
    );
  }
}



