'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, FileText, X } from 'lucide-react';

interface UploadResult {
  file: string;
  type: string;
  matched: number;
  skipped: number;
}

interface Status {
  type: 'idle' | 'success' | 'error';
  message: string;
  results?: UploadResult[];
}

const TYPE_LABELS: Record<string, string> = {
  'store-metrics': 'Weekly Store Metrics',
  'discount-categories': 'Discounts by Category',
  'unknown': 'Unrecognised',
};

export function ShopifyReportsUpload({ onUploadSuccess }: { onUploadSuccess?: () => void }) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<Status>({ type: 'idle', message: '' });
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const csvFiles = Array.from(incoming).filter((f) => f.name.endsWith('.csv'));
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...csvFiles.filter((f) => !names.has(f.name))];
    });
    setStatus({ type: 'idle', message: '' });
  };

  const removeFile = (name: string) => setFiles((prev) => prev.filter((f) => f.name !== name));

  const handleUpload = async () => {
    if (!files.length) return;
    setIsUploading(true);
    setStatus({ type: 'idle', message: '' });

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));

      const res = await fetch('/api/upload-shopify-reports', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);

      const results: UploadResult[] = data.results || [];
      const totalMatched = results.reduce((s: number, r: UploadResult) => s + r.matched, 0);
      const totalSkipped = results.reduce((s: number, r: UploadResult) => s + r.skipped, 0);

      setStatus({
        type: 'success',
        message: `Updated ${totalMatched} week${totalMatched !== 1 ? 's' : ''}${totalSkipped ? ` (${totalSkipped} rows had no matching week)` : ''}.`,
        results,
      });
      setFiles([]);
      onUploadSuccess?.();
    } catch (e: any) {
      setStatus({ type: 'error', message: e.message || 'Upload failed.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Shopify Reports</CardTitle>
        <CardDescription>
          Upload <strong>Weekly Store Metrics</strong> and/or <strong>Discounts by Category</strong> exports from Shopify.
          Rows are matched to existing weeks by start date — upload your main weekly CSV first.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/30 transition-colors"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-slate-400" />
          <p className="text-sm text-slate-600 font-medium">Drop Shopify CSV files here or click to browse</p>
          <p className="text-xs text-slate-400 mt-1">Accepts both report types at once</p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f) => (
              <li key={f.name} className="flex items-center gap-2 text-sm bg-slate-50 rounded-md px-3 py-2">
                <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                <span className="flex-1 truncate text-slate-700">{f.name}</span>
                <button onClick={() => removeFile(f.name)} className="text-slate-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!files.length || isUploading}
          className="w-full py-2 px-4 rounded-md text-sm font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading…' : `Upload ${files.length ? `${files.length} file${files.length > 1 ? 's' : ''}` : 'files'}`}
        </button>

        {/* Status */}
        {status.type !== 'idle' && (
          <div className={`rounded-md p-3 text-sm ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
            <div className="flex items-center gap-2 font-medium mb-1">
              {status.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {status.type === 'success' ? 'Success' : 'Error'}
            </div>
            <p>{status.message}</p>
            {status.results && status.results.length > 0 && (
              <ul className="mt-2 space-y-1 text-xs text-emerald-700">
                {status.results.map((r) => (
                  <li key={r.file}>
                    <span className="font-medium">{r.file}</span>
                    {' — '}
                    {TYPE_LABELS[r.type] ?? r.type}
                    {': '}
                    {r.matched} week{r.matched !== 1 ? 's' : ''} updated
                    {r.skipped > 0 ? `, ${r.skipped} skipped (no matching week)` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
