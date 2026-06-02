'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Send, RotateCcw, Database } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'What was Meta ads ROAS for April?',
  'Which channel had the highest ROAS this year?',
  'Show me revenue trend over the last 8 weeks',
  'Compare Meta vs Google spend and returns',
  'What weeks had the highest discount rate?',
];

export function GlobalAnalyticsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const ask = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMsg: Message = { role: 'user', content: question.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/analytics-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          conversationHistory: messages, // send prior history for multi-turn
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Chat failed');

      setMessages([...updatedMessages, { role: 'assistant', content: data.answer }]);
    } catch (e: any) {
      setError(e.message || 'Failed to get response');
      // Remove optimistic user message on error
      setMessages(messages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => ask(input);

  const handleClear = () => {
    setMessages([]);
    setInput('');
    setError('');
  };

  return (
    <div className="flex flex-col h-full min-h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-violet-100">
            <Database className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">Ask about all your data</p>
            <p className="text-xs text-slate-500">Claude has access to every week you've uploaded</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            onClick={handleClear}
            size="sm"
            variant="outline"
            className="ml-auto text-xs h-7"
          >
            <RotateCcw className="h-3 w-3 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* Suggested questions (shown when no messages) */}
      {messages.length === 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Try asking</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => ask(q)}
                disabled={isLoading}
                className="text-xs px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl text-sm ${
              msg.role === 'assistant'
                ? 'bg-violet-50 border border-violet-100 text-slate-700'
                : 'bg-slate-100 border border-slate-200 text-slate-800 ml-8'
            }`}
          >
            <div className="font-semibold text-xs mb-1.5">
              {msg.role === 'assistant' ? (
                <span className="flex items-center gap-1 text-violet-700">
                  <Sparkles className="h-3 w-3" /> Claude
                </span>
              ) : (
                <span className="text-slate-500">You</span>
              )}
            </div>
            <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
          </div>
        ))}

        {isLoading && (
          <div className="p-3 rounded-xl bg-violet-50 border border-violet-100">
            <div className="text-xs text-violet-700 font-semibold mb-1 flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-pulse" /> Thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-3 border-t border-slate-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
          placeholder="e.g. What was Meta ROAS for April?"
          disabled={isLoading}
          className="flex-1 h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
        />
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          size="sm"
          className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
