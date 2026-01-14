'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, ExternalLink } from 'lucide-react';

interface SearchResult {
  searchEngine: string;
  topResults: Array<{
    url: string;
    title: string;
    snippet?: string;
    position: number;
  }>;
}

export function AISearchRankings() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSearchResults();
  }, []);

  const loadSearchResults = async () => {
    setIsLoading(true);
    setError(null);
    console.log('[AI Search Rankings] Starting to load results...');
    try {
      const response = await fetch('/api/ai-search-rankings');
      console.log('[AI Search Rankings] Response status:', response.status, response.ok);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[AI Search Rankings] Error response:', errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[AI Search Rankings] Response data:', data);
      
      if (data.success && Array.isArray(data.results)) {
        console.log('[AI Search Rankings] Setting results:', data.results.length, 'engines');
        setResults(data.results);
      } else {
        console.error('[AI Search Rankings] Unexpected response format:', data);
        setError('Unexpected response format');
        setResults([]);
      }
    } catch (error: any) {
      console.error('[AI Search Rankings] Failed to load search results:', error);
      setError(error.message || 'Failed to load search results');
      setResults([]);
    } finally {
      console.log('[AI Search Rankings] Setting isLoading to false');
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-100">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">AI Search Rankings: &quot;best shilajit&quot;</CardTitle>
            <CardDescription>Top 5 results from each AI search engine</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            {error}
          </div>
        )}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-50 animate-pulse" />
            <p>Loading AI search results...</p>
          </div>
        ) : results.length === 0 && !error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No search results available.</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {results.map((result, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 bg-gradient-to-br from-white to-gray-50"
              >
                <div className="mb-4 pb-3 border-b">
                  <h3 className="font-bold text-lg text-purple-700">{result.searchEngine}</h3>
                </div>
                <div className="space-y-3">
                  {result.topResults.map((link) => (
                    <div
                      key={link.position}
                      className="border rounded-md p-3 bg-white hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-2 mb-1">
                        <span className="flex-shrink-0 w-5 h-5 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                          {link.position}
                        </span>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                        >
                          {link.title}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      </div>
                      {link.snippet && link.snippet !== 'Fetching results...' && (
                        <p className="text-xs text-muted-foreground ml-7 line-clamp-2">
                          {link.snippet}
                        </p>
                      )}
                      {link.url && link.url !== '#' && (
                        <p className="text-xs text-muted-foreground ml-7 mt-1 truncate">
                          {link.url.startsWith('http') ? new URL(link.url).hostname : link.url}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
