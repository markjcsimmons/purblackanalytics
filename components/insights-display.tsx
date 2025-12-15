'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Insight {
  text: string;
  type: 'opportunity' | 'warning' | 'success' | 'recommendation';
  priority: 'high' | 'medium' | 'low';
  id?: number;
}

interface InsightsDisplayProps {
  weekId?: number;
  existingInsights?: Insight[];
  onGenerate?: () => void;
}

export function InsightsDisplay({ weekId, existingInsights = [], onGenerate }: InsightsDisplayProps) {
  const [insights, setInsights] = useState<Insight[]>(existingInsights);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [showContextInput, setShowContextInput] = useState(false);

  const handleGenerateInsights = async () => {
    if (!weekId) {
      setError('Please select a week first');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          weekId,
          additionalContext: additionalContext.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }

      const data = await response.json();
      setInsights(data.insights);
      
      if (onGenerate) {
        onGenerate();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate insights');
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
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'opportunity':
        return 'border-blue-200 bg-blue-50';
      case 'warning':
        return 'border-amber-200 bg-amber-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      default:
        return 'border-purple-200 bg-purple-50';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800 border-red-300',
      medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      low: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return (
      <Badge className={colors[priority as keyof typeof colors] || colors.medium}>
        {priority.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Insights & Recommendations
            </CardTitle>
            <CardDescription>
              Actionable insights powered by AI analysis
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowContextInput(!showContextInput)}
              variant="ghost"
              size="sm"
            >
              {showContextInput ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showContextInput ? 'Hide' : 'Add'} Context
            </Button>
            <Button
              onClick={handleGenerateInsights}
              disabled={isGenerating || !weekId}
              variant="outline"
            >
              {isGenerating ? 'Generating...' : insights.length > 0 ? 'Regenerate' : 'Generate Insights'}
            </Button>
          </div>
        </div>
        
        {showContextInput && (
          <div className="mt-4 space-y-2">
            <Textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Add any additional context for better insights...
              
Examples:
• 'This week had a Black Friday sale - traffic and conversions were expected to be higher'
• 'We launched a new product line on Wednesday'
• 'Site went down for 3 hours on Monday due to hosting issues'
• 'Running first-time customer promotion offering 20% off'"
              rows={4}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">
              💡 This context will be combined with any notes from data upload to generate more accurate insights
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            {error}
          </div>
        )}

        {insights.length === 0 && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No insights yet. Click &quot;Generate Insights&quot; to analyze your data.</p>
          </div>
        )}

        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div
              key={insight.id || index}
              className={`p-4 rounded-lg border ${getColorClass(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{getIcon(insight.type)}</div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(insight.priority)}
                    <Badge variant="outline" className="capitalize">
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed">{insight.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

