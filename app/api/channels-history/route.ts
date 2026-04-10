import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_request: NextRequest) {
  try {
    const { getChannelMetricsHistory } = await import('@/lib/db');
    const history = getChannelMetricsHistory();
    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('Channel metrics history error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch channel metrics history' },
      { status: 500 }
    );
  }
}
