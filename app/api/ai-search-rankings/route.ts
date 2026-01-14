import { NextRequest, NextResponse } from 'next/server';
import { queryAllAISearchEngines } from '@/lib/aiSearch';

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || 'best shilajit';
    console.log('[API] AI Search Rankings endpoint called with query:', query);
    
    // Try to fetch real data from AI search engines
    let results: SearchResult[] = [];
    
    try {
      results = await queryAllAISearchEngines(query);
    } catch (error) {
      console.error('[API] Error querying AI search engines:', error);
    }
    
    // If no results from APIs, return empty array (component will show "No results")
    // Don't use mock data - user wants actual data only
    
    const response = {
      success: true,
      query,
      results,
      timestamp: new Date().toISOString(),
    };
    
    console.log('[API] Returning response with', results.length, 'search engines');
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('AI search rankings error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
