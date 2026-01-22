'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Lightbulb, AlertTriangle, CheckCircle, Rocket, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Insight {
  text: string;
  type: 'opportunity' | 'warning' | 'success' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
}

export function PromotionInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getIcon = (type: Insight['type']) => {
    switch (type) {
      case 'opportunity':
        return <Lightbulb className="h-4 w-4 text-blue-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'recommendation':
        return <Rocket className="h-4 w-4 text-purple-600" />;
      default:
        return <Sparkles className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityClass = (priority: Insight['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const generateInsights = async () => {
    setIsLoading(true);
    setError(null);
    setInsights([]);
    try {
      const response = await fetch('/api/promotions/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.insights)) {
        setInsights(data.insights);
      } else {
        setError('Unexpected response format from insights API');
      }
    } catch (err: any) {
      console.error('Failed to generate promotion insights:', err);
      setError(err.message || 'Failed to generate promotion insights');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-green-100">
      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Promotion Insights</CardTitle>
            <CardDescription>AI-powered analysis of your promotion performance and revenue impact</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <Button
          onClick={generateInsights}
          disabled={isLoading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Insights...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Promotion Insights
            </>
          )}
        </Button>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            {error}
          </div>
        )}

        {isLoading && insights.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-10 w-10 mx-auto mb-3 opacity-50 animate-pulse" />
            <p>AI is analyzing your promotion data...</p>
          </div>
        )}

        {!isLoading && insights.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Click "Generate Promotion Insights" to get detailed analysis of your promotion performance.</p>
          </div>
        )}

        {insights.length > 0 && (
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="border rounded-lg p-4 bg-white shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  {getIcon(insight.type)}
                  <span className={cn('text-sm font-semibold', getPriorityClass(insight.priority))}>
                    {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                  </span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', getPriorityClass(insight.priority))}>
                    {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)} Priority
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{insight.text}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
