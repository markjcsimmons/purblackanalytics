import { NextRequest, NextResponse } from 'next/server';
import { queryAllEngines } from '@/lib/aiSearchEngines';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || 'best shilajit';
    const perplexityApiKey = searchParams.get('perplexityApiKey') || undefined;
    const openaiApiKey =
      searchParams.get('openaiApiKey') ||
      process.env.OPENAI_API_KEY ||
      undefined;
    
    // Query all search engines
    const searchResults = await queryAllEngines(query, {
      perplexityApiKey,
      openaiApiKey,
      enabledEngines: ['chatgpt', 'openai'],
    });
    
    // Format results for overview page - top 10 per engine with links
    const formattedResults = searchResults.map(result => ({
      searchEngine: result.searchEngine,
      query: result.query,
      timestamp: result.timestamp,
      topResults: (result.sourceLinks || []).slice(0, 10).map(link => ({
        url: link.url,
        title: link.title,
        snippet: link.snippet,
        position: link.position,
      })),
      brandsFound: result.brands.map(b => b.brand),
      rawResponse: result.rawResponse || '',
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
