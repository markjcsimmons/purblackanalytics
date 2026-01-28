'use client';

import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, FileText, CheckCircle, AlertCircle, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UploadStatus {
  type: 'success' | 'error' | 'idle';
  message: string;
}

type CsvRow = {
  [key: string]: any;
};

function toISODate(input: string): string | null {
  const s = (input || '').trim();
  if (!s) return null;

  // Already ISO-ish
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const d = new Date(s);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

function parseNumber(val: any): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(n) ? null : n;
}

export function PromotionsUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setStatus({ type: 'error', message: 'Please select a CSV file.' });
      return;
    }
    setFile(selectedFile);
    setStatus({ type: 'idle', message: '' });
  };

  const parseCsv = (csvText: string): CsvRow[] => {
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
    if (parsed.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parsed.errors[0].message}`);
    }
    return parsed.data as CsvRow[];
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a CSV file.' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (!rows.length) {
        setStatus({ type: 'error', message: 'No rows found in CSV.' });
        return;
      }

      // Expected headers in your file:
      // Date Start, Date End, Promotion, Promotion Rule, Gross sales, Net sales, Discount name, ...
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const row of rows) {
        const startRaw = row['Date Start'] ?? row['Start Date'] ?? row['start_date'] ?? row['startDate'];
        const endRaw = row['Date End'] ?? row['End Date'] ?? row['end_date'] ?? row['endDate'];
        const name = (row['Promotion'] ?? row['Name'] ?? row['name'] ?? '').toString().trim();
        const rule = (row['Promotion Rule'] ?? row['Offer'] ?? row['offer'] ?? '').toString().trim();
        const discountName = (row['Discount name'] ?? row['Discount Name'] ?? row['discount_name'] ?? '').toString().trim();

        const startDate = toISODate(String(startRaw || ''));
        const endDate = toISODate(String(endRaw || ''));
        const gross = parseNumber(row['Gross sales'] ?? row['Gross Sales'] ?? row['gross_sales'] ?? row['grossSales']);
        const net = parseNumber(row['Net sales'] ?? row['Net Sales'] ?? row['net_sales'] ?? row['netSales']);

        if (!startDate || !endDate || !name || !rule) {
          errorCount++;
          errors.push(`Missing required fields for row: ${name || '(no name)'} ${startRaw || ''}–${endRaw || ''}`);
          continue;
        }

        // Preserve your CSV’s extra context in the offer text
        const offer = discountName ? `${rule} (code: ${discountName})` : rule;

        try {
          const res = await fetch('/api/promotions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              weekId: null, // DB will match by date overlap; getWeekData now also returns overlapping promos
              name,
              offer,
              startDate,
              endDate,
              grossSales: gross,
              netSales: net,
            }),
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(data.error || `HTTP ${res.status}`);
          }

          successCount++;
        } catch (e: any) {
          errorCount++;
          errors.push(`${name}: ${e?.message || 'Upload failed'}`);
        }
      }

      if (successCount > 0 && errorCount === 0) {
        setStatus({ type: 'success', message: `✅ Imported ${successCount} promotion${successCount > 1 ? 's' : ''}.` });
      } else if (successCount > 0) {
        setStatus({
          type: 'error',
          message: `⚠️ Imported ${successCount}, but ${errorCount} failed. First errors: ${errors.slice(0, 3).join('; ')}${
            errors.length > 3 ? '...' : ''
          }`,
        });
      } else {
        setStatus({
          type: 'error',
          message: `❌ Failed to import promotions. First errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}`,
        });
      }

      // Reset input
      setFile(null);
      const fileInput = document.getElementById('promotions-csv-file') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';

      if (onUploadSuccess && successCount > 0) onUploadSuccess();
    } catch (e: any) {
      setStatus({ type: 'error', message: e?.message || 'Failed to import promotions CSV.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border-2 border-green-100">
      <CardHeader className="bg-gradient-to-r from-green-50 to-green-100/50">
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          Promotions CSV Upload
        </CardTitle>
        <CardDescription>Import promotions so AI insights can account for them by week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="promotions-csv-file">CSV File</Label>
          <Input id="promotions-csv-file" type="file" accept=".csv" onChange={handleFileChange} />
          <p className="text-xs text-muted-foreground">
            Expected columns (from your file): <span className="font-mono">Date Start</span>, <span className="font-mono">Date End</span>,{' '}
            <span className="font-mono">Promotion</span>, <span className="font-mono">Promotion Rule</span>,{' '}
            <span className="font-mono">Gross sales</span>, <span className="font-mono">Net sales</span>.
          </p>
        </div>

        {status.type !== 'idle' && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg ${
              status.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {status.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{status.message}</p>
          </div>
        )}

        <Button onClick={handleUpload} disabled={isUploading || !file} className="w-full">
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Importing...' : 'Import Promotions'}
        </Button>

        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <FileText className="h-4 w-4 mt-0.5" />
          Promotions are associated to weeks by <strong>date overlap</strong> (so multi-week promos are included in every overlapping week’s AI insights).
        </div>
      </CardContent>
    </Card>
  );
}

