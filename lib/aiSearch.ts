import OpenAI from 'openai';

interface SearchResult {
  searchEngine: string;
  topResults: Array<{
    url: string;
    title: string;
    snippet?: string;
    position: number;
  }>;
}

// Get OpenAI client (similar to lib/openai.ts)
function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new OpenAI({ apiKey });
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

// Query ChatGPT (using OpenAI API)
async function queryChatGPT(query: string): Promise<SearchResult | null> {
  try {
    const client = getOpenAIClient();
    if (!client) {
      console.log('[AI Search] OpenAI API key not found for ChatGPT');
      return null;
    }

    const prompt = `For the query "${query}", provide 5 specific recommendations with brand names or product names. Format as a list with titles and brief descriptions. Include actual brand/product names when possible.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that provides specific product recommendations. When asked about products, provide actual brand names and product details when possible.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || '';
    
    // Parse the response to extract recommendations
    // Simple parsing - look for numbered lists or bullet points
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    const recommendations: Array<{ title: string; snippet: string }> = [];
    
    for (const line of lines) {
      // Match numbered lists (1., 2., etc.) or bullet points
      const match = line.match(/^[\d•\-\*]\s*[\.\)]?\s*(.+)/);
      if (match && recommendations.length < 5) {
        const text = match[1].trim();
        // Split title and description if there's a colon or dash
        const [title, ...rest] = text.split(/[:–-]/);
        const snippet = rest.join(':').trim() || text.substring(0, 150);
        recommendations.push({
          title: title.trim(),
          snippet: snippet.substring(0, 200),
        });
      }
    }

    // If we didn't get structured recommendations, create them from the content
    if (recommendations.length === 0 && content.length > 0) {
      // Split content into sentences and create recommendations
      const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
      for (let i = 0; i < Math.min(5, sentences.length); i++) {
        const sentence = sentences[i].trim();
        const words = sentence.split(' ');
        const title = words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');
        recommendations.push({
          title,
          snippet: sentence.substring(0, 150),
        });
      }
    }

    const topResults = recommendations.slice(0, 5).map((rec, index) => ({
      position: index + 1,
      url: '#', // ChatGPT doesn't provide URLs
      title: rec.title || `Recommendation ${index + 1}`,
      snippet: rec.snippet,
    }));

    return {
      searchEngine: 'ChatGPT',
      topResults: topResults.length > 0 ? topResults : [],
    };
  } catch (error) {
    console.error('[AI Search] ChatGPT error:', error);
    return null;
  }
}

// Query Claude (Anthropic)
async function queryClaude(query: string): Promise<SearchResult | null> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.log('[AI Search] Anthropic API key not found for Claude');
      return null;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `For the query "${query}", provide 5 specific recommendations with brand names or product names. Format as a numbered list with titles and brief descriptions. Include actual brand/product names when possible.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('[AI Search] Claude API error:', response.status, response.statusText, errorText);
      return null;
    }

    const data = await response.json();
    console.log('[AI Search] Claude response received, content length:', data.content?.[0]?.text?.length || 0);
    const content = data.content?.[0]?.text || '';
    
    // Parse the response to extract recommendations
    const lines = content.split('\n').filter((line: string) => line.trim().length > 0);
    const recommendations: Array<{ title: string; snippet: string }> = [];
    
    for (const line of lines) {
      // Match numbered lists (1., 2., etc.) or bullet points
      const match = line.match(/^[\d•\-\*]\s*[\.\)]?\s*(.+)/);
      if (match && recommendations.length < 5) {
        const text = match[1].trim();
        // Split title and description if there's a colon or dash
        const [title, ...rest] = text.split(/[:–-]/);
        const snippet = rest.join(':').trim() || text.substring(0, 150);
        recommendations.push({
          title: title.trim(),
          snippet: snippet.substring(0, 200),
        });
      }
    }

    // If we didn't get structured recommendations, create them from the content
    if (recommendations.length === 0 && content.length > 0) {
      // Split content into sentences and create recommendations
      const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 20);
      for (let i = 0; i < Math.min(5, sentences.length); i++) {
        const sentence = sentences[i].trim();
        const words = sentence.split(' ');
        const title = words.slice(0, 8).join(' ') + (words.length > 8 ? '...' : '');
        recommendations.push({
          title,
          snippet: sentence.substring(0, 150),
        });
      }
    }

    const topResults = recommendations.slice(0, 5).map((rec, index) => ({
      position: index + 1,
      url: '#', // Claude doesn't provide URLs
      title: rec.title || `Recommendation ${index + 1}`,
      snippet: rec.snippet,
    }));

    console.log('[AI Search] Claude parsed', topResults.length, 'recommendations');
    
    if (topResults.length === 0) {
      console.log('[AI Search] Claude: No recommendations parsed, content was:', content.substring(0, 200));
    }

    return {
      searchEngine: 'Claude',
      topResults: topResults.length > 0 ? topResults : [],
    };
  } catch (error) {
    console.error('[AI Search] Claude error:', error);
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
  const [perplexityResult, googleResult, bingResult, chatGPTResult, claudeResult] = await Promise.all([
    queryPerplexity(query),
    queryGoogleSearch(query),
    queryBingSearch(query),
    queryChatGPT(query),
    queryClaude(query),
  ]);

  if (perplexityResult) results.push(perplexityResult);
  if (googleResult) results.push(googleResult);
  if (bingResult) results.push(bingResult);
  if (chatGPTResult) results.push(chatGPTResult);
  if (claudeResult) results.push(claudeResult);

  return results;
}
