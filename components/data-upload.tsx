'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus({ type: 'idle', message: '' });
    }
  };

  const parseCSVData = (csvData: any[]): any => {
    // Support two CSV formats:
    // 1. Flat format with direct column names (new format)
    // 2. Category/Subcategory/Metric/Value format (legacy format)
    
    if (csvData.length === 0) {
      throw new Error('CSV file is empty');
    }

    const firstRow = csvData[0];
    const hasFlatFormat = 'week_start' in firstRow || 'total_revenue' in firstRow;

    if (hasFlatFormat) {
      // New flat format - multiple rows, each row is a week
      // Process all rows and return array of week data
      return csvData.map((row: any) => {
        const data: any = {
          weekStartDate: row.week_start || '',
          weekEndDate: row.week_end || '',
          notes: row.week_note || '',
          romansRecommendations: row.roman_recommendations || '',
          overallMetrics: [],
          marketingChannels: [],
          funnelMetrics: [],
          topProducts: [],
        };

        // Helper to parse value
        const parseValue = (value: any): number => {
          if (value === null || value === undefined || value === '') return 0;
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          return isNaN(numValue) ? 0 : numValue;
        };

        // Helper to add overall metric
        const addOverallMetric = (metric: string, value: any) => {
          const numValue = parseValue(value);
          if (numValue > 0) {
            data.overallMetrics.push({ metric, value: numValue });
          }
        };

        // Helper to add channel metric
        const addChannelMetric = (channel: string, metric: string, value: any) => {
          const numValue = parseValue(value);
          if (numValue > 0) {
            data.marketingChannels.push({ channel, metric, value: numValue });
          }
        };

        // Helper to add funnel metric
        const addFunnelMetric = (stage: string, metric: string, value: any) => {
          const numValue = parseValue(value);
          if (numValue > 0) {
            data.funnelMetrics.push({ stage, metric, value: numValue });
          }
        };

        // Overall Store Metrics
      addOverallMetric('* Revenue', row.total_revenue);
      addOverallMetric('* Orders', row.total_orders);
      addOverallMetric('* AOV', row.avg_order_value);
      addOverallMetric('* Conversion Rate', row.conversion_rate);
      addOverallMetric('* Total Sessions', row.total_sessions);

      // Google Ads
      addChannelMetric('Google Ads', '* Sales', row.google_ads_revenue);
      addChannelMetric('Google Ads', '* Spend', row.google_ads_spend);
      addChannelMetric('Google Ads', '* Clicks', row.google_ads_clicks);
      addChannelMetric('Google Ads', '* Conversions', row.google_ads_conversions);
      addChannelMetric('Google Ads', '* Sessions', row.google_ads_sessions);
      addFunnelMetric('Google Ads', 'Add to Cart', row.google_ads_add_to_cart);
      addFunnelMetric('Google Ads', 'Checkout', row.google_ads_checkout);
      addFunnelMetric('Google Ads', 'Purchases', row.google_ads_purchase);

      // Email & SMS
      addChannelMetric('Email & SMS', '* Revenue', row.email_sms_revenue);
      addChannelMetric('Email & SMS', '* Spend', row.email_sms_spend);
      addChannelMetric('Email & SMS', '* Clicks', row.email_sms_clicks);
      addChannelMetric('Email & SMS', '* Conversions', row.email_sms_conversions);
      addChannelMetric('Email & SMS', '* Sessions', row.email_sms_sessions);
      addFunnelMetric('Email & SMS', 'Add to Cart', row.email_sms_add_to_cart);
      addFunnelMetric('Email & SMS', 'Checkout', row.email_sms_checkout);
      addFunnelMetric('Email & SMS', 'Purchases', row.email_sms_purchase);

      // Affiliates
      addChannelMetric('Affiliates', '* Revenue', row.affiliates_revenue);
      addChannelMetric('Affiliates', '* Spend', row.affiliates_spend);
      addChannelMetric('Affiliates', '* Clicks', row.affiliates_clicks);
      addChannelMetric('Affiliates', '* Conversions', row.affiliates_coversions || row.affiliates_conversions);
      addChannelMetric('Affiliates', '* Sessions', row.affiliates_sessions);
      addFunnelMetric('Affiliates', 'Add to Cart', row.affiliates_add_to_cart);
      addFunnelMetric('Affiliates', 'Checkout', row.affiliates_checkout);
      addFunnelMetric('Affiliates', 'Purchases', row.affiliates_purchase);

      // SEO
      addChannelMetric('SEO', '* Revenue', row.seo_revenue);
      addChannelMetric('SEO', '* Spend', row.seo_spend);
      addChannelMetric('SEO', '* Impressions', row.seo_impressions);
      addChannelMetric('SEO', '* Clicks', row.seo_funnel_clicks);
      addChannelMetric('SEO', '* Sessions', row.seo_sessions);
      addChannelMetric('SEO', '* Conversions', row.seo_purchase);
      addFunnelMetric('SEO', 'Add to Cart', row.seo_add_to_cart);
      addFunnelMetric('SEO', 'Checkout', row.seo_checkout);
      addFunnelMetric('SEO', 'Purchases', row.seo_purchase);

      // Social
      addChannelMetric('Social', '* Revenue', row.social_revenue);
      addChannelMetric('Social', '* Spend', row.social_spend);
      addChannelMetric('Social', '* Sessions', row.social_sessions);
      addFunnelMetric('Social', 'Add to Cart', row.social_add_to_cart);
      addFunnelMetric('Social', 'Checkout', row.social_checkout);
      addFunnelMetric('Social', 'Purchases', row.social_purchase);

      // Product Page
      addFunnelMetric('Product Page', '* Add-to-cart rate', row.product_page_add_to_cart_rate);
      addFunnelMetric('Product Page', '* Time on page', row.product_page_time_on_page);
      addFunnelMetric('Product Page', '* Scroll depth', row.product_page_scroll_depth);

      // Cart
      addFunnelMetric('Cart', '* Shipping issues', row.cart_shipping_issues);
      addFunnelMetric('Cart', '* Abandonment rate', row.cart_abandonment_rate);

      // Top Products (support top_product_1_name, top_product_1_units, top_product_1_revenue, etc.)
      for (let i = 1; i <= 5; i++) {
        const name = row[`top_product_${i}_name`] || row[`topProduct${i}Name`];
        const units = row[`top_product_${i}_units`] || row[`topProduct${i}Units`];
        const revenue = row[`top_product_${i}_revenue`] || row[`topProduct${i}Revenue`];
        
        if (name && name.trim() && units && parseValue(units) > 0) {
          data.topProducts.push({
            productName: name.trim(),
            unitsSold: parseInt(units) || 0,
            revenue: parseValue(revenue),
          });
        }
      }

        return data;
      });
    } else {
      // Legacy Category/Subcategory/Metric/Value format
      const data: any = {
        overallMetrics: [],
        marketingChannels: [],
        funnelMetrics: [],
      };

      csvData.forEach((row: any) => {
        const category = row.Category?.trim();
        const subcategory = row.Subcategory?.trim();
        const metric = row.Metric?.trim();
        const value = parseFloat(row.Value);

        if (!category || !metric || isNaN(value)) return;

        if (category === 'Overall') {
          data.overallMetrics.push({ metric: `* ${metric}`, value });
        } else if (category === 'Marketing') {
          data.marketingChannels.push({ channel: subcategory, metric: `* ${metric}`, value });
        } else if (category === 'Funnel') {
          data.funnelMetrics.push({ stage: subcategory, metric, value });
        }
      });

      return data;
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a CSV file' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        transform: (value) => {
          // Remove quotes and trim
          if (typeof value === 'string') {
            return value.trim().replace(/^["']|["']$/g, '');
          }
          return value;
        },
        complete: async (parseResults) => {
          try {
            console.log('CSV parsed, rows:', parseResults.data.length);
            console.log('First row:', parseResults.data[0]);
            
            const parsedData = parseCSVData(parseResults.data);
            console.log('Parsed data:', Array.isArray(parsedData) ? `${parsedData.length} weeks found` : 'Single week format');

            // Check if parsedData is an array (multiple weeks) or single object
            const weeksData = Array.isArray(parsedData) ? parsedData : [parsedData];
            
            if (weeksData.length === 0) {
              throw new Error('No valid week data found in CSV file');
            }

            // Upload each week
            const uploadPromises = weeksData.map(async (weekData: any) => {
              // Use dates from CSV if available, otherwise use form fields
              const finalWeekStartDate = weekData.weekStartDate || weekStartDate;
              const finalWeekEndDate = weekData.weekEndDate || weekEndDate;
              const finalNotes = weekData.notes || notes.trim() || undefined;
              const finalRomansRecommendations = weekData.romansRecommendations || undefined;

              if (!finalWeekStartDate || !finalWeekEndDate) {
                throw new Error(`Week dates are required for week ${finalWeekStartDate || 'unknown'}. Please provide them in the CSV file or use the date fields above.`);
              }

              // Convert arrays to object format expected by API
              const overallMetricsObj: { [key: string]: number } = {};
              if (Array.isArray(weekData.overallMetrics)) {
                weekData.overallMetrics.forEach((m: any) => {
                  overallMetricsObj[m.metric] = m.value;
                });
              }

              const marketingChannelsObj: { [channel: string]: { [metric: string]: number } } = {};
              if (Array.isArray(weekData.marketingChannels)) {
                weekData.marketingChannels.forEach((m: any) => {
                  if (!marketingChannelsObj[m.channel]) {
                    marketingChannelsObj[m.channel] = {};
                  }
                  marketingChannelsObj[m.channel][m.metric] = m.value;
                });
              }

              const funnelMetricsObj: { [stage: string]: { [metric: string]: number } } = {};
              if (Array.isArray(weekData.funnelMetrics)) {
                weekData.funnelMetrics.forEach((m: any) => {
                  if (!funnelMetricsObj[m.stage]) {
                    funnelMetricsObj[m.stage] = {};
                  }
                  funnelMetricsObj[m.stage][m.metric] = m.value;
                });
              }

              const uploadData = {
                weekStartDate: finalWeekStartDate,
                weekEndDate: finalWeekEndDate,
                notes: finalNotes,
                romansRecommendations: finalRomansRecommendations,
                overallMetrics: overallMetricsObj,
                marketingChannels: marketingChannelsObj,
                funnelMetrics: funnelMetricsObj,
                topProducts: weekData.topProducts && Array.isArray(weekData.topProducts) && weekData.topProducts.length > 0 
                  ? weekData.topProducts 
                  : undefined,
              };

              const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(uploadData),
              });

              if (!response.ok) {
                const errorText = await response.text();
                let errorData;
                try {
                  errorData = JSON.parse(errorText);
                } catch {
                  errorData = { error: errorText || `HTTP ${response.status}` };
                }
                throw new Error(`Week ${finalWeekStartDate} to ${finalWeekEndDate}: ${errorData.error || `Upload failed with status ${response.status}`}`);
              }

              return await response.json();
            });

            // Wait for all uploads to complete
            const results = await Promise.all(uploadPromises);
            
            const successCount = results.length;
            setStatus({ 
              type: 'success', 
              message: `Successfully uploaded ${successCount} week${successCount > 1 ? 's' : ''}! Week IDs: ${results.map(r => r.weekId).join(', ')}` 
            });
            
            // Reset form
            setFile(null);
            setWeekStartDate('');
            setWeekEndDate('');
            setNotes('');
            
            // Trigger callback
            if (onUploadSuccess) {
              onUploadSuccess();
            }
          } catch (error: any) {
            console.error('Upload error details:', error);
            setStatus({ 
              type: 'error', 
              message: error.message || 'Failed to upload data. Please check your file format. Check browser console for details.' 
            });
          } finally {
            setIsUploading(false);
          }
        },
        error: (error) => {
          setStatus({ type: 'error', message: `CSV parsing error: ${error.message}` });
          setIsUploading(false);
        },
      });
    } catch (error) {
      setStatus({ type: 'error', message: 'An unexpected error occurred' });
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Weekly Data
        </CardTitle>
        <CardDescription>
          Upload your weekly marketing data in CSV format
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
          <p className="text-sm text-blue-900">
            <strong>💡 CSV Format:</strong> Your CSV can include <code>week_start</code>, <code>week_end</code>, <code>week_note</code>, and <code>roman_recommendations</code> columns. If these are in your CSV, the fields below are optional.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Week Start Date (Optional if in CSV)</Label>
            <Input
              id="start-date"
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">Week End Date (Optional if in CSV)</Label>
            <Input
              id="end-date"
              type="date"
              value={weekEndDate}
              onChange={(e) => setWeekEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="week-notes">Week Context / Notes (Optional if in CSV)</Label>
          <Textarea
            id="week-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., 'Black Friday sale week - expect higher than normal traffic and conversion rates' or 'Website redesign launched on Tuesday'"
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Provide context to help AI generate more accurate insights (e.g., promotions, events, site changes). Can also be included as <code>week_note</code> column in CSV.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="csv-file">CSV File</Label>
          <div className="flex items-center gap-2">
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex-1"
            />
            {file && (
              <div className="flex items-center gap-1 text-sm text-green-600">
                <FileSpreadsheet className="h-4 w-4" />
                {file.name}
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            CSV format: Flat columns (week_start, week_end, total_revenue, google_ads_revenue, etc.) or legacy format (Category, Subcategory, Metric, Value)
          </p>
        </div>

        {status.message && (
          <div
            className={`flex items-center gap-2 p-3 rounded-md ${
              status.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : status.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : ''
            }`}
          >
            {status.type === 'success' && <CheckCircle className="h-4 w-4" />}
            {status.type === 'error' && <AlertCircle className="h-4 w-4" />}
            <span className="text-sm">{status.message}</span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={isUploading || !file}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload Data'}
        </Button>
      </CardContent>
    </Card>
  );
}

