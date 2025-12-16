import { NextRequest, NextResponse } from 'next/server';
import { saveWeekData, type WeekData } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const data: WeekData = await request.json();

    // Validate required fields
    if (!data.weekStartDate || !data.weekEndDate) {
      return NextResponse.json(
        { error: 'Missing required fields: weekStartDate, weekEndDate' },
        { status: 400 }
      );
    }

    const weekId = saveWeekData(data);

    return NextResponse.json({ 
      success: true, 
      weekId,
      message: 'Data uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload data' },
      { status: 500 }
    );
  }
}



