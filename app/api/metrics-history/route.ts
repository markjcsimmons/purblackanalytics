import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    const { getOverallMetricsHistory } = await import('@/lib/db');
    const history = getOverallMetricsHistory();
    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('Metrics history error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics history' },
      { status: 500 }
    );
  }
}

