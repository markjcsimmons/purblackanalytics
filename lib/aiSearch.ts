interface SearchResult {
  searchEngine: string;
  topResults: Array<{
    url: string;
    title: string;
    snippet?: string;
    position: number;
  }>;
}

// Query Perplexity AI
async function queryPerplexity(query: string): Promise<SearchResult | null> {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.log('[AI Search] Perplexity API key not found');
      return null;
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Provide search results with URLs and descriptions.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        return_citations: true,
      }),
    });

    if (!response.ok) {
      console.error('[AI Search] Perplexity API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const citations = data.citations || [];
    const content = data.choices?.[0]?.message?.content || '';

    // Extract top 5 results from citations
    const topResults = citations.slice(0, 5).map((citation: string, index: number) => ({
      position: index + 1,
      url: citation,
      title: new URL(citation).hostname.replace('www.', ''),
      snippet: content.substring(0, 100) + '...',
    }));

    return {
      searchEngine: 'Perplexity AI',
      topResults: topResults.length > 0 ? topResults : [],
    };
  } catch (error) {
    console.error('[AI Search] Perplexity error:', error);
    return null;
  }
}

// Query Google Custom Search
async function queryGoogleSearch(query: string): Promise<SearchResult | null> {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
    
    if (!apiKey || !searchEngineId) {
      console.log('[AI Search] Google API key or Search Engine ID not found');
      return null;
    }

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=5`
    );

    if (!response.ok) {
      console.error('[AI Search] Google API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const items = data.items || [];

    const topResults = items.slice(0, 5).map((item: any, index: number) => ({
      position: index + 1,
      url: item.link,
      title: item.title,
      snippet: item.snippet,
    }));

    return {
      searchEngine: 'Google AI Overview',
      topResults,
    };
  } catch (error) {
    console.error('[AI Search] Google error:', error);
    return null;
  }
}

// Query Bing Search
async function queryBingSearch(query: string): Promise<SearchResult | null> {
  try {
    const apiKey = process.env.BING_API_KEY;
    if (!apiKey) {
      console.log('[AI Search] Bing API key not found');
      return null;
    }

    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('[AI Search] Bing API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    const webPages = data.webPages?.value || [];

    const topResults = webPages.slice(0, 5).map((page: any, index: number) => ({
      position: index + 1,
      url: page.url,
      title: page.name,
      snippet: page.snippet,
    }));

    return {
      searchEngine: 'Bing Chat',
      topResults,
    };
  } catch (error) {
    console.error('[AI Search] Bing error:', error);
    return null;
  }
}

export async function queryAllAISearchEngines(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // Query all engines in parallel
  const [perplexityResult, googleResult, bingResult] = await Promise.all([
    queryPerplexity(query),
    queryGoogleSearch(query),
    queryBingSearch(query),
  ]);

  if (perplexityResult) results.push(perplexityResult);
  if (googleResult) results.push(googleResult);
  if (bingResult) results.push(bingResult);

  return results;
}
