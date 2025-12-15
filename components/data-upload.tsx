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
    // Expected CSV format: Category, Subcategory, Metric, Value
    // Example:
    // Overall,Revenue,Total Revenue,50000
    // Overall,Orders,Total Orders,120
    // Marketing,Meta Ads,Spend,5000
    // Marketing,Meta Ads,Revenue,15000
    // Funnel,Homepage,Visitors,10000

    const data: any = {
      overallMetrics: {},
      marketingChannels: {},
      funnelMetrics: {},
    };

    csvData.forEach((row: any) => {
      const category = row.Category?.trim();
      const subcategory = row.Subcategory?.trim();
      const metric = row.Metric?.trim();
      const value = parseFloat(row.Value);

      if (!category || !metric || isNaN(value)) return;

      if (category === 'Overall') {
        data.overallMetrics[metric] = value;
      } else if (category === 'Marketing') {
        if (!data.marketingChannels[subcategory]) {
          data.marketingChannels[subcategory] = {};
        }
        data.marketingChannels[subcategory][metric] = value;
      } else if (category === 'Funnel') {
        if (!data.funnelMetrics[subcategory]) {
          data.funnelMetrics[subcategory] = {};
        }
        data.funnelMetrics[subcategory][metric] = value;
      }
    });

    return data;
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
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        complete: async (results) => {
          try {
            const parsedData = parseCSVData(results.data);

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
              throw new Error('Upload failed');
            }

            const result = await response.json();
            setStatus({ 
              type: 'success', 
              message: `Data uploaded successfully! Week ID: ${result.weekId}` 
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
          } catch (error) {
            setStatus({ 
              type: 'error', 
              message: 'Failed to upload data. Please check your file format.' 
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date">Week Start Date</Label>
            <Input
              id="start-date"
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date">Week End Date</Label>
            <Input
              id="end-date"
              type="date"
              value={weekEndDate}
              onChange={(e) => setWeekEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="week-notes">Week Context / Notes (Optional)</Label>
          <Textarea
            id="week-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., 'Black Friday sale week - expect higher than normal traffic and conversion rates' or 'Website redesign launched on Tuesday'"
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Provide context to help AI generate more accurate insights (e.g., promotions, events, site changes)
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
            CSV should have columns: Category, Subcategory, Metric, Value
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
          disabled={isUploading || !file || !weekStartDate || !weekEndDate}
          className="w-full"
        >
          {isUploading ? 'Uploading...' : 'Upload Data'}
        </Button>
      </CardContent>
    </Card>
  );
}

