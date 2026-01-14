'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { FileText, CheckCircle, AlertCircle, Copy } from 'lucide-react';

interface UploadStatus {
  type: 'success' | 'error' | 'idle';
  message: string;
}

export function GoogleDocsImport({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [weekStartDate, setWeekStartDate] = useState('');
  const [weekEndDate, setWeekEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle', message: '' });

  const parseGoogleDocsText = (text: string): any => {
    const data: any = {
      overallMetrics: {},
      marketingChannels: {},
      funnelMetrics: {},
    };

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let currentSection = '';
    let currentChannel = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Detect main sections
      if (line.match(/overall.*store.*performance/i) || line.match(/key.*metrics/i)) {
        currentSection = 'overall';
        continue;
      }
      
      if (line.match(/marketing.*channel/i)) {
        currentSection = 'marketing';
        continue;
      }
      
      if (line.match(/website.*funnel/i) || line.match(/funnel.*analytics/i)) {
        currentSection = 'funnel';
        continue;
      }

      // Detect marketing channel subsections
      if (currentSection === 'marketing') {
        if (line.match(/meta.*ads/i) || line.match(/facebook.*ads/i)) {
          currentChannel = 'Meta Ads';
          continue;
        }
        if (line.match(/google.*ads/i)) {
          currentChannel = 'Google Ads';
          continue;
        }
        if (line.match(/email.*sms/i) || line.match(/klaviyo/i)) {
          currentChannel = 'Email & SMS';
          continue;
        }
        if (line.match(/affiliate/i) || line.match(/impact/i)) {
          currentChannel = 'Affiliates';
          continue;
        }
        if (line.match(/organic.*social/i)) {
          currentChannel = 'Organic Social';
          continue;
        }
        if (line.match(/seo/i)) {
          currentChannel = 'SEO';
          continue;
        }
      }

      // Parse metric lines (various formats)
      // Format 0: "Metric1 123, Metric2 456" (comma-separated metrics on one line)
      if (line.includes(',') && /[A-Za-z]+\s+[\d,]+/.test(line)) {
        const metricPairs = line.split(',').map(pair => pair.trim());
        for (const pair of metricPairs) {
          const match = pair.match(/^([A-Za-z\s]+?)\s+([\d,]+\.?\d*)$/);
          if (match) {
            const metricName = match[1].trim();
            const value = parseFloat(match[2].replace(/,/g, ''));
            if (!isNaN(value)) {
              if (currentSection === 'overall') {
                data.overallMetrics[metricName] = value;
              } else if (currentSection === 'marketing' && currentChannel) {
                if (!data.marketingChannels[currentChannel]) {
                  data.marketingChannels[currentChannel] = {};
                }
                data.marketingChannels[currentChannel][metricName] = value;
              } else if (currentSection === 'funnel') {
                if (!data.funnelMetrics[currentChannel || 'Unknown Stage']) {
                  data.funnelMetrics[currentChannel || 'Unknown Stage'] = {};
                }
                data.funnelMetrics[currentChannel || 'Unknown Stage'][metricName] = value;
              }
            }
          }
        }
        continue;
      }

      // Format 1: "Metric Name: $1,234" or "Metric Name: 1,234" or "Metric Name: 12.5%"
      const colonMatch = line.match(/^(.+?):\s*\$?([\d,]+\.?\d*)/);
      if (colonMatch) {
        const metricName = colonMatch[1].trim();
        const value = parseFloat(colonMatch[2].replace(/,/g, ''));
        
        if (!isNaN(value)) {
          if (currentSection === 'overall') {
            data.overallMetrics[metricName] = value;
          } else if (currentSection === 'marketing' && currentChannel) {
            if (!data.marketingChannels[currentChannel]) {
              data.marketingChannels[currentChannel] = {};
            }
            data.marketingChannels[currentChannel][metricName] = value;
          } else if (currentSection === 'funnel') {
            // For funnel, the "channel" is actually the stage name
            if (!data.funnelMetrics[currentChannel || 'Unknown Stage']) {
              data.funnelMetrics[currentChannel || 'Unknown Stage'] = {};
            }
            data.funnelMetrics[currentChannel || 'Unknown Stage'][metricName] = value;
          }
        }
        continue;
      }

      // Format 2: "Metric Name    $1,234" (tab or multiple spaces)
      const tabMatch = line.match(/^(.+?)\s{2,}\$?([\d,]+\.?\d*)/);
      if (tabMatch) {
        const metricName = tabMatch[1].trim();
        const value = parseFloat(tabMatch[2].replace(/,/g, ''));
        
        if (!isNaN(value)) {
          if (currentSection === 'overall') {
            data.overallMetrics[metricName] = value;
          } else if (currentSection === 'marketing' && currentChannel) {
            if (!data.marketingChannels[currentChannel]) {
              data.marketingChannels[currentChannel] = {};
            }
            data.marketingChannels[currentChannel][metricName] = value;
          } else if (currentSection === 'funnel') {
            if (!data.funnelMetrics[currentChannel || 'Unknown Stage']) {
              data.funnelMetrics[currentChannel || 'Unknown Stage'] = {};
            }
            data.funnelMetrics[currentChannel || 'Unknown Stage'][metricName] = value;
          }
        }
        continue;
      }

      // Format 3: Detect standalone numbers after a metric name
      if (i > 0) {
        const prevLine = lines[i - 1];
        const numberMatch = line.match(/^\$?([\d,]+\.?\d*)/);
        if (numberMatch && prevLine && !prevLine.match(/\d/)) {
          const metricName = prevLine.trim();
          const value = parseFloat(numberMatch[1].replace(/,/g, ''));
          
          if (!isNaN(value)) {
            if (currentSection === 'overall') {
              data.overallMetrics[metricName] = value;
            } else if (currentSection === 'marketing' && currentChannel) {
              if (!data.marketingChannels[currentChannel]) {
                data.marketingChannels[currentChannel] = {};
              }
              data.marketingChannels[currentChannel][metricName] = value;
            } else if (currentSection === 'funnel') {
              if (!data.funnelMetrics[currentChannel || 'Unknown Stage']) {
                data.funnelMetrics[currentChannel || 'Unknown Stage'] = {};
              }
              data.funnelMetrics[currentChannel || 'Unknown Stage'][metricName] = value;
            }
          }
        }
      }

      // Detect funnel stages
      if (currentSection === 'funnel') {
        if (line.match(/homepage/i)) {
          currentChannel = 'Homepage';
          continue;
        }
        if (line.match(/product.*page/i) || line.match(/pdp/i)) {
          currentChannel = 'Product Page';
          continue;
        }
        if (line.match(/cart/i) && !line.match(/add.*cart/i)) {
          currentChannel = 'Cart';
          continue;
        }
        if (line.match(/checkout/i)) {
          currentChannel = 'Checkout';
          continue;
        }
      }
    }

    return data;
  };

  const handleUpload = async () => {
    if (!weekStartDate || !weekEndDate) {
      setStatus({ type: 'error', message: 'Please select both start and end dates' });
      return;
    }

    if (!pastedText.trim()) {
      setStatus({ type: 'error', message: 'Please paste your Google Docs content or URL' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'idle', message: '' });

    // Check if user pasted a URL - if so, try to fetch it
    const trimmedText = pastedText.trim();
    if (trimmedText.startsWith('http://') || trimmedText.startsWith('https://')) {
      try {
        setStatus({ type: 'idle', message: '🔄 Fetching document from Google Docs...' });
        
        const fetchResponse = await fetch('/api/fetch-google-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmedText }),
        });

        const fetchData = await fetchResponse.json();

        if (!fetchResponse.ok) {
          if (fetchData.needsManualPaste) {
            setStatus({ 
              type: 'error', 
              message: fetchData.error 
            });
            setIsUploading(false);
            return;
          }
          throw new Error(fetchData.error || 'Failed to fetch document');
        }

        // Successfully fetched! Now process the content
        setStatus({ type: 'idle', message: '✅ Document fetched! Processing data...' });
        const parsedData = parseGoogleDocsText(fetchData.content);

        const hasData = 
          Object.keys(parsedData.overallMetrics).length > 0 ||
          Object.keys(parsedData.marketingChannels).length > 0 ||
          Object.keys(parsedData.funnelMetrics).length > 0;

        if (!hasData) {
          setStatus({ 
            type: 'error', 
            message: 'Could not parse any data from the document. Please check the format and try again, or paste the content manually.' 
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
          throw new Error('Upload failed');
        }

        const result = await response.json();
        setStatus({ 
          type: 'success', 
          message: `✅ Document fetched and data uploaded successfully! Week ID: ${result.weekId}. Found ${Object.keys(parsedData.overallMetrics).length} overall metrics, ${Object.keys(parsedData.marketingChannels).length} channels, and ${Object.keys(parsedData.funnelMetrics).length} funnel stages.` 
        });
        
        setPastedText('');
        setWeekStartDate('');
        setWeekEndDate('');
        setNotes('');
        
        if (onUploadSuccess) {
          onUploadSuccess();
        }
        
        setIsUploading(false);
        return;

      } catch (error: any) {
        setStatus({ 
          type: 'error', 
          message: `Failed to fetch from URL: ${error.message}. Please try pasting the document content manually instead.` 
        });
        setIsUploading(false);
        return;
      }
    }

    try {
      const parsedData = parseGoogleDocsText(pastedText);

      // Check if we parsed any data
      const hasData = 
        Object.keys(parsedData.overallMetrics).length > 0 ||
        Object.keys(parsedData.marketingChannels).length > 0 ||
        Object.keys(parsedData.funnelMetrics).length > 0;

      if (!hasData) {
        setStatus({ 
          type: 'error', 
          message: 'Could not parse any data. Please check the format and try again.' 
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
        message: `Data uploaded successfully! Week ID: ${result.weekId}. Found ${Object.keys(parsedData.overallMetrics).length} overall metrics, ${Object.keys(parsedData.marketingChannels).length} channels, and ${Object.keys(parsedData.funnelMetrics).length} funnel stages.` 
      });
      
      // Reset form
      setPastedText('');
      setWeekStartDate('');
      setWeekEndDate('');
      setNotes('');
      
      // Trigger callback
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setStatus({ 
        type: 'error', 
        message: error.message || 'Failed to upload data. Please check your format.' 
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
          Import from Google Docs
        </CardTitle>
        <CardDescription>
          Copy and paste your weekly report directly from Google Docs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-date-docs">Week Start Date</Label>
            <Input
              id="start-date-docs"
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date-docs">Week End Date</Label>
            <Input
              id="end-date-docs"
              type="date"
              value={weekEndDate}
              onChange={(e) => setWeekEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="week-notes-docs">Week Context / Notes (Optional)</Label>
          <Textarea
            id="week-notes-docs"
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
          <Label htmlFor="docs-content">Google Docs Content</Label>
          <Textarea
            id="docs-content"
            placeholder="📋 PASTE EITHER:
1. The Google Docs URL (for public documents)
2. OR the document content (copy from inside the doc)

Example URL:
https://docs.google.com/document/d/YOUR_DOC_ID/edit

Example content:

Overall Store Performance
Revenue: $45,000
Orders: 120
Conversion Rate: 2.5%

Marketing Channels

Meta Ads
Spend: $5,000
Revenue: $15,000

Google Ads
Spend: $3,000
Revenue: $9,000

📝 Instructions:
1. Open your Google Doc
2. Click inside the document
3. Select ALL (Cmd/Ctrl+A)
4. Copy (Cmd/Ctrl+C)
5. Paste here (Cmd/Ctrl+V)"
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            <Copy className="inline h-3 w-3 mr-1" />
            Paste the Google Docs URL OR copy content (Cmd/Ctrl+A, then Cmd/Ctrl+C) and paste here
          </p>
        </div>

        {status.message && (
          <div
            className={`flex items-start gap-2 p-3 rounded-md ${
              status.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : status.type === 'error'
                ? 'bg-red-50 text-red-800 border border-red-200'
                : ''
            }`}
          >
            {status.type === 'success' && <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            {status.type === 'error' && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
            <span className="text-sm">{status.message}</span>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={isUploading || !pastedText || !weekStartDate || !weekEndDate}
          className="w-full"
        >
          {isUploading ? 'Processing...' : 'Import Data'}
        </Button>

        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-semibold text-sm mb-2 text-blue-900">💡 Two Easy Ways to Import:</h4>
          
          <div className="mb-3 p-3 bg-white border border-blue-300 rounded">
            <p className="font-semibold text-sm text-blue-900 mb-1">🔗 Option 1: Paste URL (Easiest!)</p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside ml-2">
              <li>Copy the Google Docs URL from your browser</li>
              <li>Paste it into the text area above</li>
              <li>Click &quot;Import Data&quot;</li>
            </ol>
            <p className="text-xs text-blue-700 mt-1">
              ✅ Works for publicly shared documents
            </p>
          </div>

          <div className="p-3 bg-white border border-blue-300 rounded">
            <p className="font-semibold text-sm text-blue-900 mb-1">📄 Option 2: Copy & Paste Content</p>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside ml-2">
              <li>Open your Google Doc</li>
              <li>Select all (Cmd/Ctrl+A)</li>
              <li>Copy (Cmd/Ctrl+C)</li>
              <li>Paste here (Cmd/Ctrl+V)</li>
              <li>Click &quot;Import Data&quot;</li>
            </ol>
            <p className="text-xs text-blue-700 mt-1">
              ✅ Works for any document (public or private)
            </p>
          </div>

          <p className="text-xs text-blue-700 mt-3">
            💡 The parser automatically detects sections, channels, and metrics - no formatting needed!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

