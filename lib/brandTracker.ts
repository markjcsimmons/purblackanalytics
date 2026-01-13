export interface BrandMention {
  brand: string;
  position: number;
  context: string;
  source: string;
  timestamp: string;
  sourceUrl?: string;
}

export interface SearchResult {
  query: string;
  searchEngine: string;
  timestamp: string;
  brands: BrandMention[];
  rawResponse?: string;
  sourceLinks?: SourceLink[];
}

export interface SourceLink {
  url: string;
  title: string;
  snippet?: string;
  position: number;
}

export interface BrandRanking {
  brand: string;
  totalMentions: number;
  averagePosition: number;
  searchEngines: string[];
  lastSeen: string;
}

// Common shilajit brands to track
export const KNOWN_BRANDS = [
  'Purblack',
  'Himalayan Shilajit',
  'PrimaVie',
  'Lost Empire Herbs',
  'Shilajit Gold',
  'Organic India',
  'Pürblack',
  'Pure Himalayan',
  'Himalayan Healing',
  'Shilajit Resin',
  'Ancient Purity',
  'Sunfood',
  'Banyan Botanicals',
  'Omica Organics',
  'Mountain Drop',
];

/**
 * Extract brand mentions from text
 */
export function extractBrands(text: string): BrandMention[] {
  const mentions: BrandMention[] = [];
  const lowerText = text.toLowerCase();
  
  KNOWN_BRANDS.forEach((brand, index) => {
    const brandLower = brand.toLowerCase();
    const regex = new RegExp(`\\b${brandLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = text.matchAll(regex);
    
    for (const match of matches) {
      const start = Math.max(0, match.index! - 50);
      const end = Math.min(text.length, match.index! + match[0].length + 50);
      const context = text.substring(start, end).trim();
      
      mentions.push({
        brand,
        position: index + 1,
        context,
        source: 'extracted',
        timestamp: new Date().toISOString(),
      });
    }
  });
  
  return mentions;
}

/**
 * Calculate brand rankings from search results
 */
export function calculateRankings(results: SearchResult[]): BrandRanking[] {
  const brandMap = new Map<string, {
    mentions: number;
    positions: number[];
    engines: Set<string>;
    lastSeen: string;
  }>();
  
  results.forEach(result => {
    result.brands.forEach(mention => {
      const existing = brandMap.get(mention.brand) || {
        mentions: 0,
        positions: [],
        engines: new Set<string>(),
        lastSeen: mention.timestamp,
      };
      
      existing.mentions++;
      existing.positions.push(mention.position);
      existing.engines.add(result.searchEngine);
      
      if (new Date(mention.timestamp) > new Date(existing.lastSeen)) {
        existing.lastSeen = mention.timestamp;
      }
      
      brandMap.set(mention.brand, existing);
    });
  });
  
  return Array.from(brandMap.entries())
    .map(([brand, data]) => ({
      brand,
      totalMentions: data.mentions,
      averagePosition: data.positions.length > 0
        ? data.positions.reduce((a, b) => a + b, 0) / data.positions.length
        : 0,
      searchEngines: Array.from(data.engines),
      lastSeen: data.lastSeen,
    }))
    .sort((a, b) => {
      // Sort by total mentions, then by average position
      if (b.totalMentions !== a.totalMentions) {
        return b.totalMentions - a.totalMentions;
      }
      return a.averagePosition - b.averagePosition;
    });
}
