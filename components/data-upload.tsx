'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface UploadStatus {
  type: 'success' | 'error' | 'idle';
  message: string;
}

export function DataUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });

  const parseCSV = (csvText: string): any => {
    const data: any = {
      overallMetrics: {},
      marketingChannels: {},
      funnelMetrics: {},
    };

    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parsed.errors[0].message}`);
    }

    parsed.data.forEach((row: any) => {
      const category = (row.Category || '').trim();
      const subcategory = (row.Subcategory || '').trim();
      const metric = (row.Metric || '').trim();
      const value = parseFloat((row.Value || '').toString().replace(/,/g, ''));

      if (!metric || isNaN(value)) {
        return;
      }

      // Overall Store Metrics
      if (category.toLowerCase() === 'overall' && subcategory.toLowerCase() === 'store') {
        // Map common metric names to expected format
        let metricName = metric;
        if (metric.toLowerCase() === 'total revenue') {
          metricName = '* Revenue';
        } else if (metric.toLowerCase() === 'total orders') {
          metricName = '* Orders';
        } else if (metric.toLowerCase() === 'conversion rate') {
          metricName = '* Conversion Rate';
        } else if (metric.toLowerCase() === 'visitors' || metric.toLowerCase() === 'total sessions') {
          metricName = '* Total Sessions';
        } else if (metric.toLowerCase() === 'aov') {
          metricName = '* AOV';
        } else if (metric.toLowerCase().startsWith('/products/')) {
          // Products are already in the correct format
          metricName = metric;
        } else {
          metricName = `* ${metric}`;
        }
        data.overallMetrics[metricName] = value;
      }
      // Marketing Channels
      else if (category.toLowerCase() === 'marketing') {
        const channelName = subcategory;
        if (!data.marketingChannels[channelName]) {
          data.marketingChannels[channelName] = {};
        }
        const metricName = metric.startsWith('*') ? metric : `* ${metric}`;
        data.marketingChannels[channelName][metricName] = value;
      }
      // Funnel Metrics
      else if (category.toLowerCase() === 'funnel') {
        const stageName = subcategory;
        if (!data.funnelMetrics[stageName]) {
          data.funnelMetrics[stageName] = {};
        }
        const metricName = metric.startsWith('*') ? metric : `* ${metric}`;
        data.funnelMetrics[stageName][metricName] = value;
      }
      // Products - handle different formats
      else if (category.toLowerCase() === 'products' || category.toLowerCase() === 'product') {
        // Products category - add /products/ prefix if not already present
        let productMetric = metric;
        if (!productMetric.toLowerCase().startsWith('/products/')) {
          // Convert product name to URL-friendly format
          const productSlug = productMetric
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          productMetric = `/products/${productSlug}`;
        }
        data.overallMetrics[productMetric] = value;
      }
      // Products with /products/ prefix in any category
      else if (metric.toLowerCase().startsWith('/products/')) {
        data.overallMetrics[metric] = value;
      }
      // Products might also be in Overall/Store with product names
      else if (category.toLowerCase() === 'overall' && subcategory.toLowerCase() === 'store') {
        // Check if this looks like a product (not a standard metric)
        const standardMetrics = ['revenue', 'orders', 'conversion', 'visitors', 'sessions', 'aov', 'total'];
        const isStandardMetric = standardMetrics.some(std => metric.toLowerCase().includes(std));
        if (!isStandardMetric && value > 0 && value < 10000) {
          // Likely a product - add /products/ prefix
          const productSlug = metric
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
          data.overallMetrics[`/products/${productSlug}`] = value;
        }
      }
    });

    return data;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setStatus({ type: 'error', message: 'Please select a CSV file' });
        return;
      }
      setFile(selectedFile);
      setStatus({ type: 'idle', message: '' });
    }
  };

  const handleUpload = async () => {
    if (!weekStartDate || !weekEndDate) {
      setStatus({ type: 'error', message: 'Please select both start and end dates' });
      return;
    }

    if (!file) {
      setStatus({ type: 'error', message: 'Please select a CSV file' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const fileText = await file.text();
      const parsedData = parseCSV(fileText);

      // Check if we parsed any data
      const hasData = 
        Object.keys(parsedData.overallMetrics).length > 0 ||
        Object.keys(parsedData.marketingChannels).length > 0 ||
        Object.keys(parsedData.funnelMetrics).length > 0;

      if (!hasData) {
        setStatus({ 
          type: 'error', 
          message: 'Could not parse any data from CSV. Please check the format.' 
        });
        setIsUploading(false);
        return;
      }

      const uploadData = {
        weekStartDate,
        weekEndDate,
        notes: notes.trim() || undefined,
        ...parsedData,
      };

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(uploadData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed with status ${response.status}`);
      }

      const result = await response.json();
      setStatus({ 
        type: 'success', 
        message: `✅ Data uploaded successfully! Week ID: ${result.weekId}. Found ${Object.keys(parsedData.overallMetrics).length} overall metrics, ${Object.keys(parsedData.marketingChannels).length} channels, and ${Object.keys(parsedData.funnelMetrics).length} funnel stages.` 
      });
      
      // Reset form
      setFile(null);
      setWeekStartDate('');
      setWeekEndDate('');
      setNotes('');
      
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      setStatus({ 
        type: 'error', 
        message: error.message || 'Failed to upload data. Please check your CSV format.' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          CSV Upload
        </CardTitle>
        <CardDescription>
          Upload your weekly data from a CSV file. Format: Category, Subcategory, Metric, Value
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="csv-week-start">Week Start Date</Label>
            <Input
              id="csv-week-start"
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="csv-week-end">Week End Date</Label>
            <Input
              id="csv-week-end"
              type="date"
              value={weekEndDate}
              onChange={(e) => setWeekEndDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-notes">Week Notes (Optional)</Label>
          <Textarea
            id="csv-notes"
            placeholder="E.g., 'Black Friday sale week', 'New product launch', etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-file">CSV File</Label>
          <Input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            required
          />
          <p className="text-xs text-muted-foreground">
            CSV should have columns: Category, Subcategory, Metric, Value
          </p>
        </div>

        {status.type !== 'idle' && (
          <div className={`flex items-start gap-2 p-3 rounded-lg ${
            status.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {status.type === 'success' ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            )}
            <p className="text-sm">{status.message}</p>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={isUploading || !file || !weekStartDate || !weekEndDate}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload Data'}
        </Button>
      </CardContent>
    </Card>
  );
}
