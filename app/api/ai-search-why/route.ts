import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
  rawResponse?: string;
};

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || process.env.OPEN_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required to run AI search "why" analysis.');
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const query = body.query as string | undefined;
    const results = body.results as SearchResult[] | undefined;
    const brand = (body.brand as string | undefined) || 'Purblack';
    const brandDomains = (body.brandDomains as string[] | undefined) || ['purblack.com'];
    const brandAliases = (body.brandAliases as string[] | undefined) || ['Pürblack', 'Purblack', 'Pur black'];

    if (!query || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Missing query or results' }, { status: 400 });
    }

    const client = getOpenAIClient();

    const prompt = `You are an expert in AI search visibility and citations.

Your job: answer "WHY are these the results?" for query "${query}", and specifically why ${brand} appears or does NOT appear.

Use ONLY the provided data. Do not assume anything not in the results. If evidence is missing, say so and propose what data to collect next.

BRAND:
- Name: ${brand}
- Domains: ${JSON.stringify(brandDomains)}
- Aliases: ${JSON.stringify(brandAliases)}

AI SEARCH RESULTS (top 10 per engine):
${JSON.stringify(results, null, 2)}

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON (no markdown).
- Include evidence by referencing the exact engine and the exact result position(s) you used.
- Be concrete and action-oriented. Avoid generic SEO advice.

Return JSON shape:
{
  "summary": string,
  "engines": [
    {
      "searchEngine": string,
      "purblack": {
        "appears": boolean,
        "appearances": [{"position": number, "url": string, "title": string}],
        "whyLikely": string[],
        "whyNotLikely": string[]
      },
      "resultPatterns": [{"pattern": string, "evidence": [{"position": number, "url": string, "title": string}]}],
      "recommendations": [{"action": string, "why": string, "evidence": [{"position": number, "url": string, "title": string}]}]
    }
  ],
  "nextDataToCollect": string[]
}`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Return valid JSON only.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(content);

    return NextResponse.json({
      analysis: {
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        engines: Array.isArray(parsed.engines) ? parsed.engines : [],
        nextDataToCollect: Array.isArray(parsed.nextDataToCollect) ? parsed.nextDataToCollect : [],
      },
    });
  } catch (error: any) {
    console.error('AI search why analysis error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

