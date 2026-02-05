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

function compactResults(results: SearchResult[]) {
  const truncate = (s: unknown, max: number) => {
    const str = typeof s === 'string' ? s : '';
    if (!str) return '';
    return str.length > max ? `${str.slice(0, max)}…` : str;
  };

  return results.map((r) => ({
    searchEngine: r.searchEngine,
    query: r.query,
    timestamp: r.timestamp,
    brandsFound: Array.isArray(r.brandsFound) ? r.brandsFound.slice(0, 30) : [],
    topResults: Array.isArray(r.topResults)
      ? r.topResults.slice(0, 10).map((t) => ({
          position: t.position,
          url: t.url,
          title: truncate(t.title, 140),
          snippet: truncate(t.snippet, 260),
        }))
      : [],
  }));
}

function extractJsonObject(text: string): string | null {
  if (!text) return null;
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;
  return text.slice(first, last + 1);
}

function buildPlainTextPrompt(opts: {
  query: string;
  brand: string;
  brandDomains: string[];
  brandAliases: string[];
  resultsCompact: any;
}) {
  const { query, brand, brandDomains, brandAliases, resultsCompact } = opts;
  return `You are an expert in AI search visibility and citation mechanics.

Answer: WHY are these the AI search results for "${query}" and why ${brand} appears or does NOT appear.

Rules:
- Use ONLY the provided results (URLs/titles/snippets/brandsFound). Do not browse.
- Be granular and competitor-specific. Call out concrete signals like COA/lab reports, press/media, review/listicle patterns, Reddit/forum signals, etc.
- Always spell the brand as "${brand}" exactly.
- Cite evidence as: (Engine · #Position · hostname/path hint).

BRAND:
- Name: ${brand}
- Domains: ${JSON.stringify(brandDomains)}
- Aliases: ${JSON.stringify(brandAliases)}

RESULTS:
${JSON.stringify(resultsCompact, null, 2)}

Output format (plain text):
- Summary (3-6 bullets)
- Per engine:
  - Does ${brand} appear? Where?
  - Top competitors and why they did well (with evidence)
  - Patterns driving the citations
  - 3-6 concrete next actions tied to evidence
`;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || process.env.OPEN_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required to run AI search "why" analysis.');
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  let body: any = null;
  try {
    body = await request.json();
    const query = body.query as string | undefined;
    const results = body.results as SearchResult[] | undefined;
    const brand = (body.brand as string | undefined) || 'Pürblack';
    const brandDomains = (body.brandDomains as string[] | undefined) || ['purblack.com'];
    const brandAliases = (body.brandAliases as string[] | undefined) || ['Pürblack', 'Purblack', 'Pur black'];

    if (!query || !results || !Array.isArray(results)) {
      return NextResponse.json({ error: 'Missing query or results' }, { status: 400 });
    }

    const client = getOpenAIClient();
    const resultsCompact = compactResults(results);

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
${JSON.stringify(resultsCompact, null, 2)}

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
      temperature: 0.1,
      max_tokens: 900,
      // Keep JSON mode; we also have parsing/repair fallbacks below.
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Sometimes models still return malformed JSON (e.g., unescaped newlines).
      // Try extracting the first {...} block and parsing again.
      const extracted = extractJsonObject(content);
      if (extracted) {
        try {
          parsed = JSON.parse(extracted);
        } catch {
          // Final fallback: ask the model to repair/normalize to valid JSON.
          const repairPrompt = `Fix and normalize the following into valid JSON ONLY.

Rules:
- Output ONLY JSON (no markdown, no commentary).
- Keep the same data, just make it valid JSON.
- Ensure keys: summary (string), engines (array), nextDataToCollect (array).

Malformed JSON:
${content}`;

          const repaired = await client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: 'Return valid JSON only.' },
              { role: 'user', content: repairPrompt },
            ],
            temperature: 0,
            max_tokens: 900,
            response_format: { type: 'json_object' },
          });

          const repairedContent = repaired.choices[0]?.message?.content || '{}';
          try {
            parsed = JSON.parse(repairedContent);
          } catch {
            const extractedRepaired = extractJsonObject(repairedContent);
            if (!extractedRepaired) throw new Error('Model returned invalid JSON.');
            parsed = JSON.parse(extractedRepaired);
          }
        }
      } else {
        throw new Error('Model returned invalid JSON.');
      }
    }

    return NextResponse.json({
      analysis: {
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        engines: Array.isArray(parsed.engines) ? parsed.engines : [],
        nextDataToCollect: Array.isArray(parsed.nextDataToCollect) ? parsed.nextDataToCollect : [],
        parsed: true,
      },
    });
  } catch (error: any) {
    console.error('AI search why analysis error:', error);
    const isJsonish = error?.name === 'SyntaxError' || /JSON/i.test(String(error?.message || ''));
    // If JSON formatting failed, fall back to a plain-text analysis so the user still gets an answer.
    if (isJsonish) {
      try {
        const client = getOpenAIClient();
        const plainTextPrompt = buildPlainTextPrompt({
          query: body?.query,
          brand: (body?.brand as string | undefined) || 'Pürblack',
          brandDomains: (body?.brandDomains as string[] | undefined) || ['purblack.com'],
          brandAliases: (body?.brandAliases as string[] | undefined) || ['Pürblack', 'Purblack', 'Pur black'],
          resultsCompact: compactResults((body?.results as SearchResult[]) || []),
        });
        const fallback = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'Return plain text only.' },
            { role: 'user', content: plainTextPrompt },
          ],
          temperature: 0.2,
          max_tokens: 900,
        });
        const text = fallback.choices[0]?.message?.content || '';
        return NextResponse.json({
          analysis: {
            summary: '',
            engines: [],
            nextDataToCollect: [],
            parsed: false,
            analysisText: text,
          },
        });
      } catch (fallbackError: any) {
        console.error('AI search why analysis fallback error:', fallbackError);
        return NextResponse.json(
          { error: 'AI analysis failed. Please try again.' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

