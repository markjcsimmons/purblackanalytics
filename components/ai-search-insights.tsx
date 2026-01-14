'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, AlertTriangle, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';

interface Insight {
  text: string;
  type: 'opportunity' | 'warning' | 'success' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
}

interface AISearchInsightsProps {
  searchQuery: string;
  results: Array<{
    searchEngine: string;
    topResults: Array<{
      url: string;
      title: string;
      snippet?: string;
      position: number;
    }>;
  }>;
  brandName?: string;
}

export function AISearchInsights({ searchQuery, results, brandName = 'Pürblack' }: AISearchInsightsProps) {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateInsights = async () => {
    if (results.length === 0) {
      setError('No search results to analyze');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-search-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          searchQuery,
          results,
          brandName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate insights (${response.status})`);
      }

      const data = await response.json();
      if (!data.insights || !Array.isArray(data.insights)) {
        throw new Error('Invalid response format from insights API');
      }

      setInsights(data.insights);
    } catch (err: any) {
      console.error('Insights generation error:', err);
      setError(err.message || 'Failed to generate insights. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'opportunity':
        return <TrendingUp className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'recommendation':
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getColorClasses = (type: string, priority: string) => {
    const baseClasses = 'border-l-4 ';
    
    if (type === 'opportunity') {
      return baseClasses + (priority === 'high' ? 'border-l-blue-500 bg-blue-50' : 'border-l-blue-400 bg-blue-50/50');
    } else if (type === 'warning') {
      return baseClasses + (priority === 'high' ? 'border-l-amber-500 bg-amber-50' : 'border-l-amber-400 bg-amber-50/50');
    } else if (type === 'success') {
      return baseClasses + (priority === 'high' ? 'border-l-green-500 bg-green-50' : 'border-l-green-400 bg-green-50/50');
    } else {
      return baseClasses + (priority === 'high' ? 'border-l-purple-500 bg-purple-50' : 'border-l-purple-400 bg-purple-50/50');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded border ${colors[priority as keyof typeof colors] || colors.medium}`}>
        {priority.toUpperCase()}
      </span>
    );
  };

  return (
    <Card className="border-2 border-purple-100">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100/50 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">AI Search Insights</CardTitle>
              <CardDescription>Actionable insights to improve your brand visibility</CardDescription>
            </div>
          </div>
          <Button
            onClick={handleGenerateInsights}
            disabled={isGenerating || results.length === 0}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Lightbulb className="h-4 w-4 mr-2" />
                Generate Insights
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            {error}
          </div>
        )}

        {insights.length === 0 && !isGenerating && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Click "Generate Insights" to analyze search results and get actionable recommendations</p>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-12 text-muted-foreground">
            <Loader2 className="h-12 w-12 mx-auto mb-3 animate-spin opacity-50" />
            <p className="text-sm">Analyzing search results and generating insights...</p>
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${getColorClasses(insight.type, insight.priority)}`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5 text-purple-600">
                      {getIcon(insight.type)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed text-gray-800">{insight.text}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {getPriorityBadge(insight.priority)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}