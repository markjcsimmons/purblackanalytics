'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';

interface UploadStatus {
  type: 'success' | 'error' | 'idle';
  message: string;
}

export function DataUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });

  const parseCSVRow = (row: any): any => {
    const data: any = {
      overallMetrics: {},
      marketingChannels: {},
      funnelMetrics: {},
    };

    // Helper function to parse numeric values
    const parseValue = (val: any): number => {
      if (val === null || val === undefined || val === '') return 0;
      const num = parseFloat(val.toString().replace(/,/g, ''));
      return isNaN(num) ? 0 : num;
    };

    // Extract week information
    const weekStartDate = row.week_start?.trim() || '';
    const weekEndDate = row.week_end?.trim() || '';
    const notes = row.week_note?.trim() || '';
    // Try multiple possible column name variations
    const romansRecommendations = (row.roman_recommendations || row.romans_recommendations || row.romanRecommendations || row.romansRecommendations)?.trim() || '';

    // Store week info (always store, even if empty, to ensure it's saved)
    if (weekStartDate) data.weekStartDate = weekStartDate;
    if (weekEndDate) data.weekEndDate = weekEndDate;
    if (notes) data.notes = notes;
    // Always store romansRecommendations, even if empty, so it can be updated
    data.romansRecommendations = romansRecommendations;

    // Overall Metrics
      if (parseValue(row.total_revenue) > 0) {
        data.overallMetrics['* Revenue'] = parseValue(row.total_revenue);
      }
      if (parseValue(row.total_orders) > 0) {
        data.overallMetrics['* Orders'] = parseValue(row.total_orders);
      }
      if (parseValue(row.avg_order_value) > 0) {
        data.overallMetrics['* AOV'] = parseValue(row.avg_order_value);
      }
      if (parseValue(row.conversion_rate) > 0) {
        data.overallMetrics['* Conversion Rate'] = parseValue(row.conversion_rate);
      }
      if (parseValue(row.total_sessions) > 0) {
        data.overallMetrics['* Total Sessions'] = parseValue(row.total_sessions);
      }

      // Marketing Channels - Google Ads
      if (parseValue(row.google_ads_revenue) > 0 || parseValue(row.google_ads_spend) > 0) {
        if (!data.marketingChannels['Google Ads']) {
          data.marketingChannels['Google Ads'] = {};
        }
        if (parseValue(row.google_ads_revenue) > 0) {
          data.marketingChannels['Google Ads']['* Sales'] = parseValue(row.google_ads_revenue);
        }
        if (parseValue(row.google_ads_spend) > 0) {
          data.marketingChannels['Google Ads']['* Spend'] = parseValue(row.google_ads_spend);
        }
        if (parseValue(row.google_ads_clicks) > 0) {
          data.marketingChannels['Google Ads']['* Clicks'] = parseValue(row.google_ads_clicks);
        }
        if (parseValue(row.google_ads_conversions) > 0) {
          data.marketingChannels['Google Ads']['* Conversions'] = parseValue(row.google_ads_conversions);
        }
        if (parseValue(row.google_ads_sessions) > 0) {
          data.marketingChannels['Google Ads']['* Sessions'] = parseValue(row.google_ads_sessions);
        }
      }

      // Marketing Channels - Email & SMS
      if (parseValue(row.email_sms_revenue) > 0) {
        if (!data.marketingChannels['Email & SMS']) {
          data.marketingChannels['Email & SMS'] = {};
        }
        data.marketingChannels['Email & SMS']['* Revenue'] = parseValue(row.email_sms_revenue);
        if (parseValue(row.email_sms_conversions) > 0) {
          data.marketingChannels['Email & SMS']['* Conversions'] = parseValue(row.email_sms_conversions);
        }
        if (parseValue(row.email_sms_sessions) > 0) {
          data.marketingChannels['Email & SMS']['* Sessions'] = parseValue(row.email_sms_sessions);
        }
      }

      // Marketing Channels - Affiliates
      if (parseValue(row.affiliates_revenue) > 0 || parseValue(row.affiliates_spend) > 0) {
        if (!data.marketingChannels['Affiliates']) {
          data.marketingChannels['Affiliates'] = {};
        }
        if (parseValue(row.affiliates_revenue) > 0) {
          data.marketingChannels['Affiliates']['* Revenue'] = parseValue(row.affiliates_revenue);
        }
        if (parseValue(row.affiliates_spend) > 0) {
          data.marketingChannels['Affiliates']['* Spend'] = parseValue(row.affiliates_spend);
        }
        if (parseValue(row.affiliates_clicks) > 0) {
          data.marketingChannels['Affiliates']['* Clicks'] = parseValue(row.affiliates_clicks);
        }
        if (parseValue(row.affiliates_coversions) > 0) {
          data.marketingChannels['Affiliates']['* Conversions'] = parseValue(row.affiliates_coversions);
        }
      }

      // Marketing Channels - SEO
      if (parseValue(row.seo_impressions) > 0 || parseValue(row.seo_funnel_clicks) > 0) {
        if (!data.marketingChannels['SEO']) {
          data.marketingChannels['SEO'] = {};
        }
        if (parseValue(row.seo_impressions) > 0) {
          data.marketingChannels['SEO']['* Impressions'] = parseValue(row.seo_impressions);
        }
        if (parseValue(row.seo_funnel_clicks) > 0) {
          data.marketingChannels['SEO']['* Clicks'] = parseValue(row.seo_funnel_clicks);
        }
        if (parseValue(row.seo_sessions) > 0) {
          data.marketingChannels['SEO']['* Sessions'] = parseValue(row.seo_sessions);
        }
        // Calculate SEO revenue from orders (if available) and AOV
        const seoOrders = parseValue(row.seo_sessions) * (parseValue(row.conversion_rate) / 100);
        if (seoOrders > 0 && parseValue(row.avg_order_value) > 0) {
          data.marketingChannels['SEO']['* Revenue'] = seoOrders * parseValue(row.avg_order_value);
        }
      }

      // Funnel Metrics - Google Ads
      if (parseValue(row.google_ads_sessions) > 0) {
        if (!data.funnelMetrics['Google Ads']) {
          data.funnelMetrics['Google Ads'] = {};
        }
        data.funnelMetrics['Google Ads']['Sessions'] = parseValue(row.google_ads_sessions);
        // Calculate Add to Cart and Checkout from total if available
        if (parseValue(row.total_add_to_cart) > 0) {
          // Distribute proportionally based on sessions
          const totalSessions = parseValue(row.total_sessions);
          if (totalSessions > 0) {
            const proportion = parseValue(row.google_ads_sessions) / totalSessions;
            data.funnelMetrics['Google Ads']['Add to Cart'] = parseValue(row.total_add_to_cart) * proportion;
          }
        }
        if (parseValue(row.total_checkout) > 0) {
          const totalSessions = parseValue(row.total_sessions);
          if (totalSessions > 0) {
            const proportion = parseValue(row.google_ads_sessions) / totalSessions;
            data.funnelMetrics['Google Ads']['Checkout'] = parseValue(row.total_checkout) * proportion;
          }
        }
        if (parseValue(row.google_ads_conversions) > 0) {
          data.funnelMetrics['Google Ads']['Purchases'] = parseValue(row.google_ads_conversions);
        }
      }

      // Funnel Metrics - Email & SMS
      if (parseValue(row.email_sms_sessions) > 0) {
        if (!data.funnelMetrics['Email & SMS']) {
          data.funnelMetrics['Email & SMS'] = {};
        }
        data.funnelMetrics['Email & SMS']['Sessions'] = parseValue(row.email_sms_sessions);
        if (parseValue(row.total_add_to_cart) > 0) {
          const totalSessions = parseValue(row.total_sessions);
          if (totalSessions > 0) {
            const proportion = parseValue(row.email_sms_sessions) / totalSessions;
            data.funnelMetrics['Email & SMS']['Add to Cart'] = parseValue(row.total_add_to_cart) * proportion;
          }
        }
        if (parseValue(row.total_checkout) > 0) {
          const totalSessions = parseValue(row.total_sessions);
          if (totalSessions > 0) {
            const proportion = parseValue(row.email_sms_sessions) / totalSessions;
            data.funnelMetrics['Email & SMS']['Checkout'] = parseValue(row.total_checkout) * proportion;
          }
        }
        if (parseValue(row.email_sms_conversions) > 0) {
          data.funnelMetrics['Email & SMS']['Purchases'] = parseValue(row.email_sms_conversions);
        }
      }

      // Funnel Metrics - Affiliates
      if (parseValue(row.affiliates_coversions) > 0) {
        if (!data.funnelMetrics['Affiliates']) {
          data.funnelMetrics['Affiliates'] = {};
        }
        // Estimate sessions from conversions and conversion rate
        const conversionRate = parseValue(row.conversion_rate) / 100;
        if (conversionRate > 0) {
          const estimatedSessions = parseValue(row.affiliates_coversions) / conversionRate;
          data.funnelMetrics['Affiliates']['Sessions'] = estimatedSessions;
          data.funnelMetrics['Affiliates']['Add to Cart'] = estimatedSessions * (parseValue(row.product_page_add_to_cart_rate) / 100);
          data.funnelMetrics['Affiliates']['Checkout'] = estimatedSessions * (parseValue(row.product_page_add_to_cart_rate) / 100) * (1 - parseValue(row.cart_abandonment_rate) / 100);
        }
        data.funnelMetrics['Affiliates']['Purchases'] = parseValue(row.affiliates_coversions);
      }

      // Funnel Metrics - SEO
      if (parseValue(row.seo_sessions) > 0) {
        if (!data.funnelMetrics['SEO']) {
          data.funnelMetrics['SEO'] = {};
        }
        data.funnelMetrics['SEO']['Sessions'] = parseValue(row.seo_sessions);
        if (parseValue(row.product_page_add_to_cart_rate) > 0) {
          data.funnelMetrics['SEO']['Add to Cart'] = parseValue(row.seo_sessions) * (parseValue(row.product_page_add_to_cart_rate) / 100);
        }
        if (parseValue(row.cart_abandonment_rate) > 0 && parseValue(row.product_page_add_to_cart_rate) > 0) {
          const atc = parseValue(row.seo_sessions) * (parseValue(row.product_page_add_to_cart_rate) / 100);
          data.funnelMetrics['SEO']['Checkout'] = atc * (1 - parseValue(row.cart_abandonment_rate) / 100);
        }
        // Calculate conversions from sessions and conversion rate
        const conversionRate = parseValue(row.conversion_rate) / 100;
        if (conversionRate > 0) {
          data.funnelMetrics['SEO']['Purchases'] = parseValue(row.seo_sessions) * conversionRate;
        }
      }

      // Funnel Metrics - Product Page
      if (parseValue(row.product_page_add_to_cart_rate) > 0 || parseValue(row.product_page_time_on_page) > 0) {
        if (!data.funnelMetrics['Product Page']) {
          data.funnelMetrics['Product Page'] = {};
        }
        if (parseValue(row.product_page_add_to_cart_rate) > 0) {
          data.funnelMetrics['Product Page']['* Add-to-cart rate'] = parseValue(row.product_page_add_to_cart_rate);
        }
        if (parseValue(row.product_page_time_on_page) > 0) {
          data.funnelMetrics['Product Page']['* Time on page'] = parseValue(row.product_page_time_on_page);
        }
        if (parseValue(row.product_page_scroll_depth) > 0) {
          data.funnelMetrics['Product Page']['* Scroll depth'] = parseValue(row.product_page_scroll_depth);
        }
      }

      // Funnel Metrics - Cart
      if (parseValue(row.cart_abandonment_rate) > 0) {
        if (!data.funnelMetrics['Cart']) {
          data.funnelMetrics['Cart'] = {};
        }
        data.funnelMetrics['Cart']['* Abandonment rate'] = parseValue(row.cart_abandonment_rate);
      }

      // Products - Top 5 products
      for (let i = 1; i <= 5; i++) {
        const productName = row[`top_product_${i}_name`]?.trim();
        const productUnits = parseValue(row[`top_product_${i}_units`]);
        
        if (productName && productUnits > 0) {
          // Store full product name with /products/ prefix for identification
          data.overallMetrics[`/products/${productName}`] = productUnits;
        }
      }

    return data;
  };

  const parseCSV = (csvText: string): any[] => {
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      throw new Error(`CSV parsing error: ${parsed.errors[0].message}`);
    }

    // Process each row and return array of week data
    return parsed.data.map((row: any) => parseCSVRow(row));
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
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a CSV file' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const fileText = await file.text();
      const weeksData = parseCSV(fileText);

      if (weeksData.length === 0) {
        setStatus({ 
          type: 'error', 
          message: 'Could not parse any data from CSV. Please check the format.' 
        });
        setIsUploading(false);
        return;
      }

      // Upload each week separately
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const weekData of weeksData) {
        // Check if we parsed any data for this week
        const hasData = 
          Object.keys(weekData.overallMetrics).length > 0 ||
          Object.keys(weekData.marketingChannels).length > 0 ||
          Object.keys(weekData.funnelMetrics).length > 0;

        if (!hasData) {
          errorCount++;
          errors.push(`Week ${weekData.weekStartDate || 'unknown'}: No data found`);
          continue;
        }

        // Validate that week dates were extracted from CSV
        if (!weekData.weekStartDate || !weekData.weekEndDate) {
          errorCount++;
          errors.push(`Row missing week_start or week_end`);
          continue;
        }

        const uploadData = {
          weekStartDate: weekData.weekStartDate,
          weekEndDate: weekData.weekEndDate,
          notes: weekData.notes || undefined,
          romansRecommendations: weekData.romansRecommendations || undefined,
          overallMetrics: weekData.overallMetrics,
          marketingChannels: weekData.marketingChannels,
          funnelMetrics: weekData.funnelMetrics,
        };

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(uploadData),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(errorData.error || `Upload failed with status ${response.status}`);
          }

          successCount++;
        } catch (error: any) {
          errorCount++;
          errors.push(`Week ${weekData.weekStartDate}: ${error.message}`);
        }
      }

      // Show summary message
      if (successCount > 0 && errorCount === 0) {
        setStatus({ 
          type: 'success', 
          message: `✅ Successfully uploaded ${successCount} week${successCount > 1 ? 's' : ''}!` 
        });
      } else if (successCount > 0 && errorCount > 0) {
        setStatus({ 
          type: 'error', 
          message: `⚠️ Uploaded ${successCount} week${successCount > 1 ? 's' : ''}, but ${errorCount} failed. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}` 
        });
      } else {
        setStatus({ 
          type: 'error', 
          message: `❌ Failed to upload all weeks. Errors: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}` 
        });
      }
      
      // Reset form
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('csv-file') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      if (onUploadSuccess && successCount > 0) {
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
          Upload your weekly data from a CSV file. The CSV should include week_start, week_end, and all metric columns.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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
            CSV should include columns: week_start, week_end, week_note, roman_recommendations, total_revenue, total_orders, avg_order_value, conversion_rate, total_sessions, and other metric columns.
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
          disabled={isUploading || !file}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Upload Data'}
        </Button>
      </CardContent>
    </Card>
  );
}
