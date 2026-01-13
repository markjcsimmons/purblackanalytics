import { NextRequest, NextResponse } from 'next/server';
import { queryAllEngines } from '@/lib/aiSearchEngines';
import { calculateRankings, SearchResult } from '@/lib/brandTracker';
import { promises as fs } from 'fs';
import path from 'path';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

const DATA_DIR = path.join(process.cwd(), 'data');
const RESULTS_FILE = path.join(DATA_DIR, 'brand-tracking-results.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR);
  } catch {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error: any) {
      // On platforms like Render with ephemeral filesystem, this might fail
      // We'll handle it gracefully by not persisting data
      console.warn('Could not create data directory:', error.message);
    }
  }
}

// Load existing results
async function loadResults(): Promise<SearchResult[]> {
  try {
    await ensureDataDir();
    const data = await fs.readFile(RESULTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error: any) {
    // On platforms with ephemeral filesystem, return empty array
    // Data won't persist between deployments, but app will still work
    console.warn('Could not load results from file system:', error.message);
    return [];
  }
}

// Save results
async function saveResults(results: SearchResult[]) {
  try {
    await ensureDataDir();
    await fs.writeFile(RESULTS_FILE, JSON.stringify(results, null, 2), 'utf-8');
  } catch (error: any) {
    // On platforms with ephemeral filesystem, silently fail
    // Data won't persist, but app will continue to work
    console.warn('Could not save results to file system:', error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, perplexityApiKey, openaiApiKey, enabledEngines } = body;
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Query all enabled search engines
    const searchResults = await queryAllEngines(query, {
      perplexityApiKey,
      openaiApiKey,
      enabledEngines: enabledEngines || ['perplexity', 'google', 'bing'],
    });
    
    // Load existing results and append new ones
    const existingResults = await loadResults();
    const allResults = [...existingResults, ...searchResults];
    
    // Keep only last 1000 results to prevent file from growing too large
    const trimmedResults = allResults.slice(-1000);
    await saveResults(trimmedResults);
    
    // Calculate rankings
    const rankings = calculateRankings(searchResults);
    
    return NextResponse.json({
      success: true,
      results: searchResults,
      rankings,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Brand tracking error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    
    const allResults = await loadResults();
    
    // Filter by query if provided
    const filteredResults = query
      ? allResults.filter(r => r.query.toLowerCase().includes(query.toLowerCase()))
      : allResults;
    
    // Calculate overall rankings
    const rankings = calculateRankings(filteredResults);
    
    return NextResponse.json({
      success: true,
      results: filteredResults,
      rankings,
      totalResults: filteredResults.length,
    });
  } catch (error: any) {
    console.error('Get results error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
