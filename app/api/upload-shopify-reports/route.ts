import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function parseNum(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const n = parseFloat(val.toString().replace(/,/g, '').replace(/\s+/g, ''));
  return isNaN(n) ? 0 : n;
}

// Parse a CSV string into an array of row objects
function parseCSV(text: string): Record<string, string>[] {
  // Strip BOM (byte-order mark) that Excel/Sheets sometimes prepends
  const cleaned = text.replace(/^\uFEFF/, '');
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  // Trim whitespace and any stray BOM from each header
  const headers = lines[0].split(',').map((h) => h.replace(/\uFEFF/g, '').trim());
  return lines.slice(1).map((line) => {
    // Handle quoted fields
    const values: string[] = [];
    let cur = '';
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === ',' && !inQuote) {
        values.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    values.push(cur.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

// Detect which Shopify report this CSV is based on its headers
function detectType(headers: string[]): 'store-metrics' | 'discount-categories' | 'unknown' {
  const h = headers.map((s) => s.toLowerCase());
  if (h.includes('gross sales') || h.some((x) => x === 'gross sales')) return 'store-metrics';
  if (h.some((x) => x.includes('free orders discounted') || x.includes('promotional orders'))) return 'discount-categories';
  return 'unknown';
}

function processStoreMetrics(rows: Record<string, string>[]): Array<{ weekStart: string; metrics: Record<string, number> }> {
  return rows
    .filter((r) => r['Week Start'] || r['week_start'])
    .map((r) => {
      const weekStart = (r['Week Start'] || r['week_start'] || '').trim();
      const grossSales    = parseNum(r['Gross sales']         || r['Gross Sales']);
      const discounts     = Math.abs(parseNum(r['Discounts']));
      const refunds       = Math.abs(parseNum(r['Refunded payments'] || r['Refunds']));
      const shippingRev   = Math.abs(parseNum(r['Shipping reversals'] || r['Shipping Reversals']));
      const taxRev        = Math.abs(parseNum(r['Tax reversals']      || r['Tax Reversals']));
      // Capture Shopify's own Net Sales figure for reconciliation
      const shopifyNet    = parseNum(r['Net sales'] || r['Net Sales']);

      const metrics: Record<string, number> = {};
      if (grossSales)   metrics['* Gross Sales']            = grossSales;
      if (discounts)    metrics['* Total Discount Amount']  = discounts;
      if (refunds)      metrics['* Refunds']                = refunds;
      if (shippingRev)  metrics['* Shipping Reversals']     = shippingRev;
      if (taxRev)       metrics['* Tax Reversals']          = taxRev;
      if (shopifyNet)   metrics['* Shopify Net Sales']      = shopifyNet;
      return { weekStart, metrics };
    })
    .filter((r) => r.weekStart && Object.keys(r.metrics).length > 0);
}

function processDiscountCategories(rows: Record<string, string>[]): Array<{ weekStart: string; metrics: Record<string, number> }> {
  return rows
    .filter((r) => r['week_start'] || r['Week Start'])
    .map((r) => {
      const weekStart = (r['week_start'] || r['Week Start'] || '').trim();
      const metrics: Record<string, number> = {};

      const freeCount = parseNum(r['Free Orders']);
      const freeValue = parseNum(r['Free Orders Discounted']);
      const promoCount = parseNum(r['Promotional Orders']);
      const promoSales = parseNum(r['Promotional Sales']);
      const promoDiscount = parseNum(r['Promotional Discounts']);
      const classicCount = parseNum(r['Orders with classic discount']);
      const classicSales = parseNum(r['Sales with classic discount']);
      const classicDiscount = parseNum(r['Discounts with classic discount']);

      if (freeCount) metrics['* Comp Order Count'] = freeCount;
      if (freeValue) metrics['* Comp Order Value'] = freeValue;
      if (promoCount) metrics['* Promo Order Count'] = promoCount;
      if (promoSales) metrics['* Promo Sales'] = promoSales;
      if (promoDiscount) metrics['* Promo Discount Value'] = promoDiscount;
      if (classicCount) metrics['* Classic Discount Count'] = classicCount;
      if (classicSales) metrics['* Classic Discount Sales'] = classicSales;
      if (classicDiscount) metrics['* Classic Discount Value'] = classicDiscount;

      return { weekStart, metrics };
    })
    .filter((r) => r.weekStart && Object.keys(r.metrics).length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const { upsertOverallMetrics } = await import('@/lib/db');

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files.length) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const results: Array<{ file: string; type: string; matched: number; skipped: number }> = [];

    for (const file of files) {
      const text = await file.text();
      const rows = parseCSV(text);
      if (!rows.length) continue;

      const headers = Object.keys(rows[0]);
      const type = detectType(headers);

      let processed: Array<{ weekStart: string; metrics: Record<string, number> }> = [];
      if (type === 'store-metrics') {
        processed = processStoreMetrics(rows);
      } else if (type === 'discount-categories') {
        processed = processDiscountCategories(rows);
      } else {
        results.push({ file: file.name, type: 'unknown', matched: 0, skipped: rows.length });
        continue;
      }

      let matched = 0;
      let skipped = 0;
      for (const { weekStart, metrics } of processed) {
        const ok = upsertOverallMetrics(weekStart, metrics);
        if (ok) matched++;
        else skipped++;
      }

      results.push({ file: file.name, type, matched, skipped });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Shopify reports upload error:', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
