'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, XCircle, FileText, Loader2, Download } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { toast } from 'sonner';
import { getErrorMsg } from '@/lib/utils';

const CSV_TEMPLATE = `title,description,basePrice,category,imageUrl,tags
Minimal Wave Tee,A clean wave design on premium cotton,799,T-Shirts,https://example.com/image.jpg,minimal|wave|tee
Bold Typography Hoodie,Bold statement hoodie,1499,Hoodies,,typography|bold
`;

export default function AdminImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);

  const onDrop = useCallback((files: File[]) => {
    setFile(files[0]);
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv'] },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const { data } = await productsApi.importCsv(file);
      setResult(data.data);
      if (data.data.created > 0) toast.success(`${data.data.created} products imported`);
      if (data.data.errors?.length > 0) toast.warning(`${data.data.errors.length} rows had errors`);
    } catch (err: any) {
      toast.error(getErrorMsg(err, 'Import failed'));
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ap_products_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-black text-gray-900">CSV Product Import</h1>
        <p className="text-gray-500 mt-1">Bulk import products from a CSV file</p>
      </div>

      {/* Template Download */}
      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-blue-500" />
          <div>
            <p className="font-semibold text-blue-900 text-sm">CSV Template</p>
            <p className="text-xs text-blue-600">Required columns: title, basePrice</p>
          </div>
        </div>
        <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" /> Template
        </button>
      </div>

      {/* Column Reference */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-black text-gray-900 mb-3">Column Reference</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { col: 'title', req: true, desc: 'Product title' },
            { col: 'basePrice', req: true, desc: 'Numeric price' },
            { col: 'description', req: false, desc: 'Product description' },
            { col: 'category', req: false, desc: 'Category name (must exist)' },
            { col: 'imageUrl', req: false, desc: 'Primary image URL' },
            { col: 'tags', req: false, desc: 'Pipe-separated (tag1|tag2)' },
          ].map(row => (
            <div key={row.col} className="flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
              <code className="text-xs bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-mono">{row.col}</code>
              {row.req && <span className="text-xs text-red-500 font-bold">*</span>}
              <span className="text-xs text-gray-500">{row.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        {file ? (
          <div>
            <p className="font-semibold text-gray-900">{file.name}</p>
            <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to replace</p>
          </div>
        ) : (
          <div>
            <p className="font-semibold text-gray-700">{isDragActive ? 'Drop your CSV here' : 'Drag & drop CSV file'}</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {file && (
        <button onClick={handleImport} disabled={importing}
          className="w-full flex items-center justify-center gap-2 py-4 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 disabled:opacity-60 transition-colors">
          {importing && <Loader2 className="w-5 h-5 animate-spin" />}
          {importing ? 'Importing...' : `Import from ${file.name}`}
        </button>
      )}

      {/* Results */}
      {result && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h3 className="font-black text-gray-900">Import Results</h3>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="font-semibold text-green-800">{result.created} products created successfully</span>
          </div>
          {result.errors.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-semibold text-red-700">{result.errors.length} rows failed:</span>
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl bg-red-50 p-3 space-y-1">
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600 font-mono">{err}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
