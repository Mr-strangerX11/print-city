'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';

const SecureCanvas = dynamic(
  () => import('@/components/secure-viewer/SecureCanvas'),
  { ssr: false, loading: () => <div className="h-40 animate-pulse rounded-lg bg-zinc-800" /> },
);

interface Design {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  fileType: string;
  fileSize: number;
  width?: number;
  height?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const STATUS_INFO = {
  PENDING: { label: 'Under Review', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  APPROVED: { label: 'Approved', color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  REJECTED: { label: 'Rejected', color: 'text-red-400 bg-red-500/10 border-red-500/30' },
};

const API = process.env.NEXT_PUBLIC_API_URL ?? '';
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/tiff', 'application/pdf'];
const MAX_MB = 50;

function formatBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export default function VendorDesignsPage() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: '', description: '', tags: '' });

  const loadDesigns = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`${API}/api/designs/my`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setDesigns(data.items ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadDesigns(); }, [loadDesigns]);

  const handleUpload = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(false);
    if (!ALLOWED.includes(file.type)) return setUploadError('Unsupported file type.');
    if (file.size > MAX_MB * 1024 * 1024) return setUploadError(`Max ${MAX_MB}MB.`);
    if (!form.title.trim()) return setUploadError('Please enter a title.');

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', form.title.trim());
    if (form.description.trim()) fd.append('description', form.description.trim());
    form.tags.split(',').map(t => t.trim()).filter(Boolean).forEach(t => fd.append('tags[]', t));

    const res = await fetch(`${API}/api/designs/upload`, { method: 'POST', credentials: 'include', body: fd });
    setUploading(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return setUploadError(err.message ?? 'Upload failed');
    }

    setUploadSuccess(true);
    setForm({ title: '', description: '', tags: '' });
    if (fileRef.current) fileRef.current.value = '';
    loadDesigns();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">

        <div>
          <h1 className="text-2xl font-bold">My Design Vault</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload design files securely. Files are encrypted at rest and never publicly accessible.
          </p>
        </div>

        {/* Upload */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-5">
          <h2 className="text-base font-semibold text-zinc-200">Upload New Design</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              { key: 'title', label: 'Title *', placeholder: 'e.g. Summer Logo v2', type: 'text' },
              { key: 'tags', label: 'Tags (comma-separated)', placeholder: 'logo, summer', type: 'text' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-xs text-zinc-400 mb-1.5">{label}</label>
                <input
                  value={form[key as keyof typeof form]}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5
                    text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500
                    focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional description…"
                rows={2}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5
                  text-sm text-zinc-100 placeholder-zinc-600 focus:border-indigo-500
                  focus:outline-none resize-none"
              />
            </div>
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleUpload(f); }}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed px-8 py-12 text-center transition-all
              ${dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50'}`}
          >
            <input ref={fileRef} type="file" accept={ALLOWED.join(',')} onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} className="hidden" />
            {uploading ? (
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                <p className="text-sm text-zinc-400">Uploading to private vault…</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="text-3xl">🔐</div>
                <p className="text-sm font-medium text-zinc-300">Drop file or <span className="text-indigo-400">browse</span></p>
                <p className="text-xs text-zinc-600">JPG · PNG · WebP · TIFF · PDF · Max {MAX_MB}MB</p>
              </div>
            )}
          </div>

          {uploadError && <p className="rounded-lg border border-red-800/40 bg-red-900/20 px-4 py-3 text-sm text-red-400">{uploadError}</p>}
          {uploadSuccess && <p className="rounded-lg border border-green-800/40 bg-green-900/20 px-4 py-3 text-sm text-green-400">✓ Upload successful — pending admin review.</p>}
        </div>

        {/* Designs */}
        <div>
          <h2 className="mb-4 text-base font-semibold text-zinc-200">
            Your Designs {!loading && <span className="text-sm text-zinc-500 ml-2">({designs.length})</span>}
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1,2,3].map(i => <div key={i} className="h-52 animate-pulse rounded-xl bg-zinc-800" />)}
            </div>
          ) : designs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-800 py-16 text-center text-zinc-600">
              No designs yet. Upload your first one above.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {designs.map(d => {
                const si = STATUS_INFO[d.status];
                return (
                  <div key={d.id} className="group rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden hover:border-zinc-700 transition-colors">
                    <div className="relative bg-zinc-800">
                      {previewId === d.id ? (
                        <SecureCanvas designId={d.id} className="w-full" onError={() => setPreviewId(null)} />
                      ) : (
                        <div className="flex h-40 cursor-pointer items-center justify-center hover:bg-zinc-700/50 transition-colors" onClick={() => setPreviewId(d.id)}>
                          <div className="text-center">
                            <div className="text-2xl mb-1">{d.fileType === 'application/pdf' ? '📄' : '🖼'}</div>
                            <p className="text-xs text-zinc-500 group-hover:text-zinc-400">Click to preview</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-zinc-100 line-clamp-1">{d.title}</h3>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${si.color}`}>{si.label}</span>
                      </div>
                      <div className="text-xs text-zinc-600">
                        {d.fileType.split('/')[1]?.toUpperCase()} · {formatBytes(d.fileSize)}
                        {d.width ? ` · ${d.width}×${d.height}px` : ''}
                      </div>
                      {/* NOTE: No delete button — designs cannot be deleted */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 px-5 py-4 flex items-start gap-3 text-xs text-zinc-500">
          <span className="text-base shrink-0">🔒</span>
          <p>Your files are stored in a private vault with zero public URLs. Once uploaded, designs cannot be deleted — this protects your IP and ensures production traceability. Only admins can view (watermarked) and print your designs.</p>
        </div>
      </div>
    </div>
  );
}
