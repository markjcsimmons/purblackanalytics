import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type SearchResult = {
  searchEngine: string;
  query: string;
  timestamp: string;
  topResults: Array<{
    url: string;
    title: string;
    snippet?: string;
    position: number;
  }>;
  brandsFound: string[];
};

const INSIGHTS_MODEL = 'claude-opus-4-6';

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is required to generate AI search insights.');
  return new Anthropic({ apiKey });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const retryable = error?.status === 529 || error?.status === 500;
      if (retryable && attempt < maxRetries - 1) {
        const delayMs = Math.pow(2, attempt) * 1000;
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body.query as string | undefined;
    const results = body.results as SearchResult[] | undefined;

    if (!query || !results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Missing query or results' },
        { status: 400 }
      );
    }

    const client = getClient();

    const prompt =`You are an expert in AI search visibility for Pürblack (Purblack), a premium shilajit brand. Analyze the AI search results for the query "${query}" and deliver VERY SPECIFIC, competitive insights about how Pürblack appears versus competitors.\n\nRESULTS:\n${JSON.stringify(results, null, 2)}\n\nREQUIREMENTS:\n- Compare Pürblack visibility to competitors found in the results.\n- Explain WHY competitors appear (e.g., Reddit mentions, review sites, listicles, affiliate blogs) using evidence from results.\n- Provide precise, action-oriented recommendations tied to those sources (e.g., “comment on top Reddit threads about shilajit,” “secure inclusion in X listicle,” “pitch Y publisher”).\n- Avoid generic advice. Every insight must reference a source pattern from the results.\n\nReturn ONLY a JSON object with an "insights" array. Each item must include:\n- text (string)\n- type (opportunity|warning|success|recommendation)\n- priority (high|medium|low)\n\nExample:\n{\n  "insights": [\n    { "text": "...", "type": "opportunity", "priority": "high" }\n  ]\n}`;

    const response = await withRetry(() => client.messages.create({
      model: INSIGHTS_MODEL,
      system: 'Return valid JSON only.',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }));

    const content = (response.content.find((b: any) => b.type === 'text') as any)?.text || '{}';
    const parsed = JSON.parse(content);
    const insights = Array.isArray(parsed.insights) ? parsed.insights : [];

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('AI search insights error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
