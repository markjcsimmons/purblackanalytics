import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    // Dynamically import database functions to avoid build-time execution
    const { getRecommendationRules } = await import('@/lib/db');
    const rules = getRecommendationRules();
    return NextResponse.json({ rules });
  } catch (error: any) {
    console.error('Error fetching rules:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ruleText } = await request.json();
    
    if (!ruleText || !ruleText.trim()) {
      return NextResponse.json(
        { error: 'Rule text is required' },
        { status: 400 }
      );
    }
    
    // Dynamically import database functions to avoid build-time execution
    const { addRecommendationRule } = await import('@/lib/db');
    const ruleId = addRecommendationRule(ruleText.trim());
    return NextResponse.json({ success: true, ruleId });
  } catch (error: any) {
    console.error('Error adding rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('id');
    
    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }
    
    // Dynamically import database functions to avoid build-time execution
    const { deleteRecommendationRule } = await import('@/lib/db');
    deleteRecommendationRule(parseInt(ruleId));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete rule' },
      { status: 500 }
    );
  }
}


