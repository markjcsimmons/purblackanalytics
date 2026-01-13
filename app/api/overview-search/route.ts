import { NextRequest, NextResponse } from 'next/server';
import { queryAllEngines } from '@/lib/aiSearchEngines';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || 'best shilajit';
    const perplexityApiKey = searchParams.get('perplexityApiKey') || undefined;
    const openaiApiKey = searchParams.get('openaiApiKey') || undefined;
    
    // Query all search engines
    const searchResults = await queryAllEngines(query, {
      perplexityApiKey,
      openaiApiKey,
      enabledEngines: ['perplexity', 'google', 'bing'],
    });
    
    // Format results for overview page - top 5 per engine with links
    const formattedResults = searchResults.map(result => ({
      searchEngine: result.searchEngine,
      query: result.query,
      timestamp: result.timestamp,
      topResults: (result.sourceLinks || []).slice(0, 5).map(link => ({
        url: link.url,
        title: link.title,
        snippet: link.snippet,
        position: link.position,
      })),
      brandsFound: result.brands.map(b => b.brand),
    }));
    
    return NextResponse.json({
      success: true,
      results: formattedResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Overview search error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
