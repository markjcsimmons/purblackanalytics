import { NextRequest, NextResponse } from 'next/server';
import { getRecommendationRules, addRecommendationRule, deleteRecommendationRule } from '@/lib/db';

export async function GET() {
  try {
    const rules = getRecommendationRules();
    return NextResponse.json({ rules });
  } catch (error: any) {
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
    
    const ruleId = addRecommendationRule(ruleText.trim());
    return NextResponse.json({ success: true, ruleId });
  } catch (error: any) {
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
    
    deleteRecommendationRule(parseInt(ruleId));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete rule' },
      { status: 500 }
    );
  }
}

