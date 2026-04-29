'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, RotateCcw } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface RevenueAnalysisChatProps {
  initialAnalysis: string;
  weekLabel: string;
  // Original week data needed for follow-ups
  analysisContext: {
    netSales: number;
    grossSales: number;
    totalDiscounts: number;
    compValue: number;
    promoDiscount: number;
    classicDiscount: number;
    refunds: number;
    vsPriorPct: number | null;
    vsYoyPct: number | null;
    trend4: string | null;
    trend12: string | null;
    trend52: string | null;
    channels: Record<string, any>;
  };
}

export function RevenueAnalysisChat({
  initialAnalysis,
  weekLabel,
  analysisContext,
}: RevenueAnalysisChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: initialAnalysis },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAsk = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/revenue-analysis/follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekLabel,
          netSales: analysisContext.netSales,
          grossSales: analysisContext.grossSales,
          totalDiscounts: analysisContext.totalDiscounts,
          compValue: analysisContext.compValue,
          promoDiscount: analysisContext.promoDiscount,
          classicDiscount: analysisContext.classicDiscount,
          refunds: analysisContext.refunds,
          vsPriorPct: analysisContext.vsPriorPct,
          vsYoyPct: analysisContext.vsYoyPct,
          trend4: analysisContext.trend4,
          trend12: analysisContext.trend12,
          trend52: analysisContext.trend52,
          channels: analysisContext.channels,
          previousAnalysis: messages[0].content, // Original analysis
          userQuestion: userMessage,
          conversationHistory: messages.slice(1), // Only conversation, not initial analysis
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Follow-up failed');

      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (e: any) {
      setError(e.message || 'Failed to get response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([{ role: 'assistant', content: initialAnalysis }]);
    setInput('');
    setError('');
  };

  return (
    <div className="space-y-3 border-t border-slate-200 pt-3">
      {/* Conversation Thread */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2.5 rounded-lg text-sm ${
              msg.role === 'assistant'
                ? 'bg-violet-50 border border-violet-100 text-slate-700'
                : 'bg-slate-100 border border-slate-200 text-slate-800 ml-6'
            }`}
          >
            <div className="font-semibold text-xs mb-1">
              {msg.role === 'assistant' ? (
                <span className="flex items-center gap-1 text-violet-700">
                  <Sparkles className="h-3 w-3" /> Claude
                </span>
              ) : (
                <span className="text-slate-600">You</span>
              )}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
          </div>
        ))}

        {isLoading && (
          <div className="p-2.5 rounded-lg bg-violet-50 border border-violet-100">
            <div className="text-xs text-violet-700 font-semibold mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-pulse" /> Thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleAsk()}
            placeholder="Ask a follow-up question..."
            disabled={isLoading}
            className="flex-1 h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
          />
          <Button
            onClick={handleAsk}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="bg-violet-600 hover:bg-violet-700 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleClear}
            disabled={isLoading}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Clear
          </Button>
          <div className="text-xs text-slate-400 flex items-center">
            {messages.length > 1 && `${messages.length - 1} follow-up question${messages.length > 2 ? 's' : ''}`}
          </div>
        </div>
      </div>
    </div>
  );
}
