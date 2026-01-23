import axios from 'axios';
import * as cheerio from 'cheerio';
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
 * Query Google AI Overview (via Google Search)
 */
export async function queryGoogleAI(query: string): Promise<SearchResult> {
  const brands: BrandMention[] = [];
  let rawResponse = '';
  const sourceLinks: SourceLink[] = [];
  
  try {
    // Query Google Search and look for AI Overview section
    const response = await axios.get('https://www.google.com/search', {
      params: {
        q: query,
        hl: 'en',
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Referer': 'https://www.google.com/',
      },
    });
    
    const htmlContent = response.data;
    
    // Check if Google returned an error/redirect page
    if (htmlContent.includes('enablejs') || 
        htmlContent.includes('Please click') || 
        htmlContent.includes('http-equiv="refresh"') ||
        htmlContent.includes('sourceMappingURL') ||
        htmlContent.length < 1000) {
      rawResponse = 'Google Search is blocking automated requests. Please use Google Custom Search API or access Google Search manually.';
      return {
        query,
        searchEngine: 'Google AI Overview',
        timestamp: new Date().toISOString(),
        brands,
        rawResponse,
        sourceLinks: [],
      };
    }
    
    const $ = cheerio.load(htmlContent);
    
    // Try to find AI Overview section
    const aiOverview = $('#AIOverview, .kp-blk, [data-ved*="AI"]').first().text() || 
                       $('.hgKElc, .LGOjhe').first().text() ||
                       '';
    
    // Extract top search results (organic results)
    $('.g, .tF2Cxc').each((index, element) => {
      if (index < 10) {
        const linkElement = $(element).find('a[href^="http"]').first();
        const url = linkElement.attr('href');
        const title = $(element).find('h3').first().text().trim() || linkElement.text().trim();
        const snippet = $(element).find('.VwiC3b, .s').first().text().trim();
        
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
    
    // If no results found, try alternative selectors
    if (sourceLinks.length === 0) {
      $('a[href^="http"]').each((index, element) => {
        if (index < 10) {
          const url = $(element).attr('href');
          const title = $(element).text().trim() || $(element).attr('title') || `Source ${index + 1}`;
          if (url && url.startsWith('http') && !url.includes('google.com')) {
            sourceLinks.push({
              url,
              title,
              position: index + 1,
            });
          }
        }
      });
    }
    
    // Set raw response to AI Overview if found, otherwise use a summary
    if (aiOverview) {
      rawResponse = aiOverview;
      brands.push(...extractBrands(aiOverview));
    } else if (sourceLinks.length > 0) {
      rawResponse = `Found ${sourceLinks.length} search results for "${query}"`;
      // Extract brands from titles and snippets
      const allText = sourceLinks.map(link => `${link.title} ${link.snippet || ''}`).join(' ');
      brands.push(...extractBrands(allText));
    } else {
      rawResponse = 'No results found. Google may be blocking automated requests.';
    }
  } catch (error: any) {
    console.error('Google AI query error:', error.message);
    rawResponse = `Error: ${error.message}. Google Search may be blocking automated requests. Consider using Google Custom Search API.`;
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
    queries.push(queryGoogleAI(query));
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
