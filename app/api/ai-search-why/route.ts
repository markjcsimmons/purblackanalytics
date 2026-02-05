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
    const brand = (body.brand as string | undefined) || 'Pürblack';
    const brandDomains = (body.brandDomains as string[] | undefined) || ['purblack.com'];
    const brandAliases = (body.brandAliases as string[] | undefined) || ['Pürblack', 'Purblack', 'Pur black'];

    if (!query || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Missing query or results' }, { status: 400 });
    }

    const client = getOpenAIClient();

    const prompt = `You are an expert in AI search visibility and citation mechanics.

Your job: answer "WHY are these the results?" for query "${query}", and specifically why ${brand} appears or does NOT appear — with granular, competitor-specific reasons.

IMPORTANT RULES:
- Use ONLY the provided data (URLs/titles/snippets/brandsFound). Do NOT guess or browse the web.
- If you cannot prove a claim from the evidence here, you MUST label it as a hypothesis and state what evidence would confirm it.
- Avoid generic advice. Every insight/recommendation MUST reference evidence from the results (engine + position).
- Always spell the brand as "${brand}" exactly (with the umlaut) in your output text.

BRAND:
- Name: ${brand}
- Domains: ${JSON.stringify(brandDomains)}
- Aliases: ${JSON.stringify(brandAliases)}

AI SEARCH RESULTS (top 10 per engine):
${JSON.stringify(results, null, 2)}

WHAT TO EXTRACT (be specific):
- For each engine, list the dominant citation patterns (e.g., Reddit threads, listicles, review sites, affiliate blogs, ecommerce product pages, lab/COA pages, news/press mentions).
- Identify competitors that are appearing and explain *why they did well* based on signals in URL/title/snippet/hostname. Examples of acceptable granular signals:
  - Mentions of "COA", "lab report", "certificate of analysis", "third-party testing" in URL/title/snippet
  - Named media outlets in hostname/title (press coverage)
  - "best", "top", "review", "vs", "comparison", "coupon", "affiliate" patterns
  - Community/forum signals (Reddit, Quora, niche forums)
  - Authority aggregators (Healthline-style, Wirecutter-style, etc.)

OUTPUT REQUIREMENTS:
- Return ONLY valid JSON (no markdown).
- Evidence must reference the exact engine and result position(s) used.
- Prefer short bullet-like strings in arrays.

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
        "whyNotLikely": string[],
        "evidenceSignals": [{"signal": string, "evidence": [{"position": number, "url": string, "title": string}]}]
      },
      "competitors": [
        {
          "name": string,
          "appearances": [{"position": number, "url": string, "title": string}],
          "whyTheyDidWell": string[],
          "evidenceSignals": [{"signal": string, "evidence": [{"position": number, "url": string, "title": string}]}],
          "gapsToVerify": string[]
        }
      ],
      "resultPatterns": [{"pattern": string, "evidence": [{"position": number, "url": string, "title": string}]}],
      "recommendations": [{"action": string, "why": string, "evidence": [{"position": number, "url": string, "title": string}]}]
    }
  ],
  "nextDataToCollect": string[]
}

Competitor selection rules:
- Use brandsFound plus any obvious brand names from titles/hostnames.
- Include up to 6 competitors per engine (prioritize those appearing highest).`;

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

