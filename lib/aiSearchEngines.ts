import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { BrandMention, extractBrands, SearchResult, SourceLink } from './brandTracker';

export interface SearchEngineConfig {
  name: string;
  enabled: boolean;
  apiKey?: string;
}

/**
 * Query Perplexity AI (using their API or web interface)
 */
export async function queryPerplexity(query: string, apiKey?: string): Promise<SearchResult> {
  const brands: BrandMention[] = [];
  let rawResponse = '';
  const sourceLinks: SourceLink[] = [];
  
  try {
    if (apiKey) {
      // Use Perplexity API if key is provided
      const response = await axios.post(
        'https://api.perplexity.ai/chat/completions',
        {
          model: 'llama-3.1-sonar-large-128k-online',
          messages: [
            {
              role: 'user',
              content: query,
            },
          ],
          return_citations: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      rawResponse = response.data.choices[0]?.message?.content || '';
      brands.push(...extractBrands(rawResponse));
      
      // Extract citations/sources from Perplexity API response
      if (response.data.citations) {
        response.data.citations.forEach((citation: any, index: number) => {
          sourceLinks.push({
            url: citation.url || citation,
            title: citation.title || `Source ${index + 1}`,
            snippet: citation.snippet,
            position: index + 1,
          });
        });
      }
    } else {
      // Fallback: Try to scrape Perplexity web interface
      // Note: This may not work due to dynamic content loading
      const response = await axios.get('https://www.perplexity.ai/search', {
        params: { q: query },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      const $ = cheerio.load(response.data);
      const text = $('body').text();
      rawResponse = text;
      brands.push(...extractBrands(text));
      
      // Try to extract source links from Perplexity page
      $('a[href^="http"]').each((index, element) => {
        if (index < 5) {
          const url = $(element).attr('href');
          const title = $(element).text().trim() || $(element).attr('title') || `Source ${index + 1}`;
          if (url && url.startsWith('http')) {
            sourceLinks.push({
              url,
              title,
              position: index + 1,
            });
          }
        }
      });
    }
  } catch (error: any) {
    console.error('Perplexity query error:', error.message);
    rawResponse = `Error: ${error.message}`;
  }
  
  return {
    query,
    searchEngine: 'Perplexity',
    timestamp: new Date().toISOString(),
    brands,
    rawResponse,
    sourceLinks: sourceLinks.slice(0, 5),
  };
}

/**
 * Query Google AI (Gemini) with Google Search Grounding
 */
export async function queryGoogleAI(query: string, apiKey?: string): Promise<SearchResult> {
  const brands: BrandMention[] = [];
  let rawResponse = '';
  const sourceLinks: SourceLink[] = [];
  
  if (!apiKey) {
    apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  }
  
  if (!apiKey) {
    rawResponse = 'Error: Google Gemini API key required. Set GOOGLE_GEMINI_API_KEY environment variable or pass as parameter.';
    return {
      query,
      searchEngine: 'Google AI Overview',
      timestamp: new Date().toISOString(),
      brands,
      rawResponse,
      sourceLinks: [],
    };
  }
  
  try {
    // Initialize Gemini API with Google Search grounding
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      tools: [{ googleSearch: {} }],
    });
    
    // Query with Google Search grounding enabled
    const prompt = `${query}. Please provide sources and citations.`;
    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // Get the text response
    rawResponse = response.text();
    brands.push(...extractBrands(rawResponse));
    
    // Extract citations and source links from grounding metadata
    if (response.groundingMetadata) {
      const grounding = response.groundingMetadata;
      
      // Extract web search results
      if (grounding.webSearchQueries) {
        // Web search queries were used
      }
      
      // Extract citations/chunks
      if (grounding.groundingChunks) {
        grounding.groundingChunks.forEach((chunk: any, index: number) => {
          if (chunk.web) {
            const web = chunk.web;
            if (web.uri) {
              sourceLinks.push({
                url: web.uri,
                title: web.title || `Source ${index + 1}`,
                snippet: chunk.chunk?.text || '',
                position: index + 1,
              });
            }
          }
        });
      }
      
      // Also try to extract from candidate metadata
      if (result.response.candidates && result.response.candidates[0]?.groundingMetadata) {
        const candidateGrounding = result.response.candidates[0].groundingMetadata;
        if (candidateGrounding.groundingChunks) {
          candidateGrounding.groundingChunks.forEach((chunk: any, index: number) => {
            if (chunk.web && chunk.web.uri) {
              const url = chunk.web.uri;
              // Avoid duplicates
              if (!sourceLinks.some(link => link.url === url)) {
                sourceLinks.push({
                  url,
                  title: chunk.web.title || new URL(url).hostname,
                  snippet: chunk.chunk?.text || '',
                  position: sourceLinks.length + 1,
                });
              }
            }
          });
        }
      }
    }
    
    // If no citations found, try to extract URLs from the response text
    if (sourceLinks.length === 0) {
      const urlRegex = /(https?:\/\/[^\s\)]+)/g;
      const urls = rawResponse.match(urlRegex) || [];
      urls.slice(0, 10).forEach((url, index) => {
        try {
          const hostname = new URL(url).hostname;
          if (!hostname.includes('google.com') && !hostname.includes('googleusercontent.com')) {
            sourceLinks.push({
              url,
              title: hostname,
              position: index + 1,
            });
          }
        } catch {
          // Invalid URL, skip
        }
      });
    }
    
  } catch (error: any) {
    console.error('Google AI (Gemini) query error:', error.message);
    rawResponse = `Error: ${error.message}`;
  }
  
  return {
    query,
    searchEngine: 'Google AI Overview',
    timestamp: new Date().toISOString(),
    brands,
    rawResponse,
    sourceLinks: sourceLinks.slice(0, 10),
  };
}

/**
 * Query Bing Chat (via Bing Search)
 */
export async function queryBingChat(query: string): Promise<SearchResult> {
  const brands: BrandMention[] = [];
  let rawResponse = '';
  const sourceLinks: SourceLink[] = [];
  
  try {
    const response = await axios.get('https://www.bing.com/search', {
      params: {
        q: query,
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const $ = cheerio.load(response.data);
    const text = $('body').text();
    rawResponse = text;
    brands.push(...extractBrands(text));
    
    // Extract Bing search results
    $('.b_algo, .b_title').each((index, element) => {
      if (index < 5) {
        const linkElement = $(element).find('a').first();
        const url = linkElement.attr('href');
        const title = $(element).find('h2, .b_title').first().text().trim() || linkElement.text().trim();
        const snippet = $(element).find('.b_caption p, .b_snippet').first().text().trim();
        
        if (url && url.startsWith('http')) {
          sourceLinks.push({
            url,
            title: title || `Result ${index + 1}`,
            snippet,
            position: index + 1,
          });
        }
      }
    });
    
    // Fallback: extract any links
    if (sourceLinks.length === 0) {
      $('a[href^="http"]').each((index, element) => {
        if (index < 5) {
          const url = $(element).attr('href');
          const title = $(element).text().trim() || $(element).attr('title') || `Source ${index + 1}`;
          if (url && url.startsWith('http') && !url.includes('bing.com') && !url.includes('microsoft.com')) {
            sourceLinks.push({
              url,
              title,
              position: index + 1,
            });
          }
        }
      });
    }
  } catch (error: any) {
    console.error('Bing Chat query error:', error.message);
    rawResponse = `Error: ${error.message}`;
  }
  
  return {
    query,
    searchEngine: 'Bing Chat',
    timestamp: new Date().toISOString(),
    brands,
    rawResponse,
    sourceLinks: sourceLinks.slice(0, 5),
  };
}

/**
 * Query ChatGPT (requires OpenAI API key)
 */
export async function queryChatGPT(query: string, apiKey?: string): Promise<SearchResult> {
  const brands: BrandMention[] = [];
  let rawResponse = '';
  const sourceLinks: SourceLink[] = [];
  
  if (!apiKey) {
    return {
      query,
      searchEngine: 'ChatGPT',
      timestamp: new Date().toISOString(),
      brands,
      rawResponse: 'Error: OpenAI API key required',
      sourceLinks: [],
    };
  }
  
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'user',
            content: `${query}. Please provide sources/links if available.`,
          },
        ],
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    
    rawResponse = response.data.choices[0]?.message?.content || '';
    brands.push(...extractBrands(rawResponse));
    
    // Extract URLs from ChatGPT response
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const urls = rawResponse.match(urlRegex) || [];
    urls.slice(0, 10).forEach((url, index) => {
      let title = `Source ${index + 1}`;
      try {
        title = new URL(url).hostname;
      } catch {
        // keep fallback title
      }
      sourceLinks.push({
        url,
        title,
        position: index + 1,
      });
    });
  } catch (error: any) {
    console.error('ChatGPT query error:', error.message);
    rawResponse = `Error: ${error.message}`;
  }
  
  return {
    query,
    searchEngine: 'ChatGPT',
    timestamp: new Date().toISOString(),
    brands,
    rawResponse,
    sourceLinks: sourceLinks.slice(0, 10),
  };
}

/**
 * Query all enabled search engines
 */
export async function queryAllEngines(
  query: string,
  config: {
    perplexityApiKey?: string;
    openaiApiKey?: string;
    geminiApiKey?: string;
    enabledEngines?: string[];
  } = {}
): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  const enabled = config.enabledEngines || ['perplexity', 'google', 'bing'];
  
  const queries: Promise<SearchResult>[] = [];
  
  if (enabled.includes('perplexity')) {
    queries.push(queryPerplexity(query, config.perplexityApiKey));
  }
  
  if (enabled.includes('google')) {
    queries.push(queryGoogleAI(query, config.geminiApiKey));
  }
  
  if (enabled.includes('bing')) {
    queries.push(queryBingChat(query));
  }
  
  if (enabled.includes('chatgpt') && config.openaiApiKey) {
    queries.push(queryChatGPT(query, config.openaiApiKey));
  }
  
  const searchResults = await Promise.allSettled(queries);
  
  searchResults.forEach((result) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      console.error('Search engine query failed:', result.reason);
    }
  });
  
  return results;
}
