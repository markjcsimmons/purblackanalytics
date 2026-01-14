'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const [searchQuery, setSearchQuery] = useState('best shilajit');
  const [currentQuery, setCurrentQuery] = useState('best shilajit');

  useEffect(() => {
    loadSearchResults(currentQuery);
  }, []);

  const loadSearchResults = async (query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/ai-search-rankings?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
      } else {
        setError('Unexpected response format');
        setResults([]);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load search results');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debug: log current state
  console.log('[AI Search Rankings Render] isLoading:', isLoading, 'results.length:', results.length, 'error:', error);

  return (
    <Card className="border-2 border-purple-100">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500 rounded-lg">
            <Search className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">AI Search Rankings</CardTitle>
            <CardDescription>Top 5 results from each AI search engine</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="flex gap-3">
          <Input
            type="text"
            placeholder="Enter search query (e.g., best shilajit)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setCurrentQuery(searchQuery);
                loadSearchResults(searchQuery);
              }
            }}
            className="flex-1"
          />
          <Button
            onClick={() => {
              setCurrentQuery(searchQuery);
              loadSearchResults(searchQuery);
            }}
            disabled={isLoading || !searchQuery.trim()}
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>
        {currentQuery && (
          <div className="text-sm text-muted-foreground pb-2">
            Showing results for: <span className="font-semibold text-foreground">&quot;{currentQuery}&quot;</span>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50 animate-pulse" />
            <p className="text-base">Loading AI search results...</p>
          </div>
        )}

        {!isLoading && results.length === 0 && !error && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-base">No search results available.</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="grid gap-8 grid-cols-1 md:grid-cols-2">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-6 bg-gradient-to-br from-white to-gray-50 shadow-sm"
                >
                  <div className="mb-5 pb-4 border-b border-gray-200">
                    <h3 className="font-bold text-lg text-purple-700">{result.searchEngine}</h3>
                  </div>
                  <div className="space-y-4">
                    {result.topResults.map((link) => (
                      <div
                        key={link.position}
                        className="border rounded-lg p-4 bg-white hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {link.position}
                          </span>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                          >
                            {link.title}
                            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                          </a>
                        </div>
                        {link.snippet && link.snippet !== 'Fetching results...' && (
                          <p className="text-xs text-muted-foreground ml-9 line-clamp-2 leading-relaxed">
                            {link.snippet}
                          </p>
                        )}
                        {link.url && link.url !== '#' && (
                          <p className="text-xs text-muted-foreground ml-9 mt-2 truncate">
                            {link.url.startsWith('http') ? new URL(link.url).hostname : link.url}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
