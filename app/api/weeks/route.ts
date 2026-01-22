import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Dynamically import database functions to avoid build-time execution
    const { getWeeks } = await import('@/lib/db');
    const weeks = getWeeks();
    return NextResponse.json({ weeks });
  } catch (error) {
    console.error('Error fetching weeks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weeks' },
      { status: 500 }
    );
  }
}



