import { NextRequest, NextResponse } from 'next/server';
import { generateAISearchInsights } from '@/lib/openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SearchResult {
  searchEngine: string;
  topResults: Array<{
    url: string;
    title: string;
    snippet?: string;
    position: number;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { searchQuery, results, brandName } = await request.json();

    if (!searchQuery || !results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Missing required fields: searchQuery, results' },
        { status: 400 }
      );
    }

    // Generate insights using OpenAI
    const insights = await generateAISearchInsights({
      searchQuery,
      results: results as SearchResult[],
      brandName: brandName || 'Pürblack',
    });

    return NextResponse.json({
      success: true,
      insights,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('AI Search Insights generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}