import { NextResponse } from 'next/server';
import { getWeeks, getAllData } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
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



