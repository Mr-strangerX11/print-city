'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Load SecureCanvas only on client (canvas APIs)
const SecureCanvas = dynamic(
  () => import('@/components/secure-viewer/SecureCanvas'),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-zinc-800" /> },
);

const PrintTrigger = dynamic(
  () => import('@/components/secure-viewer/PrintTrigger'),
  { ssr: false },
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
  dpi?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  vendor: { id: string; storeName: string };
}

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

function formatBytes(b: number) {
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AdminDesignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [design, setDesign] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/api/designs?limit=1`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        // Fetch individual design from the list (or add a GET /designs/:id endpoint)
        fetch(`${API}/api/designs?limit=100`, { credentials: 'include' })
          .then(r => r.json())
          .then(all => {
            const found = all.items?.find((d: Design) => d.id === id);
            setDesign(found ?? null);
            setLoading(false);
          });
      });
  }, [id]);

  const updateStatus = async (status: 'APPROVED' | 'REJECTED') => {
    setUpdating(true);
    await fetch(`${API}/api/designs/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setDesign((d) => d ? { ...d, status } : d);
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!design) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        Design not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* Back + Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back to Designs
            </button>
            <h1 className="text-xl font-bold text-zinc-100">{design.title}</h1>
            <p className="text-sm text-zinc-500">
              by {design.vendor.storeName} ·{' '}
              {new Date(design.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </p>
          </div>

          {/* Status badge */}
          <div className="flex flex-col items-end gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold
              ${design.status === 'APPROVED' ? 'bg-green-500/15 text-green-400 border-green-500/30' :
                design.status === 'REJECTED' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                'bg-amber-500/15 text-amber-400 border-amber-500/30'}`}>
              {design.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Secure Canvas Viewer */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-1 overflow-hidden">
              <SecureCanvas
                designId={design.id}
                className="min-h-[400px]"
                onError={setViewerError}
              />
            </div>

            {viewerError && (
              <p className="text-xs text-red-400 px-1">Viewer error: {viewerError}</p>
            )}

            {/* Security notice */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3
              flex items-start gap-3">
              <span className="text-lg shrink-0">🔒</span>
              <div className="text-xs text-zinc-500 space-y-0.5">
                <p className="text-zinc-400 font-medium">Security Notice</p>
                <p>Preview is watermarked with your admin ID and timestamp.</p>
                <p>Original file is stored privately and never exposed to any frontend.</p>
                <p>Right-click, save, and drag are disabled on the canvas.</p>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="space-y-4">

            {/* Design Info */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-4">
              <h2 className="text-sm font-semibold text-zinc-300">Design Information</h2>

              <dl className="space-y-3 text-sm">
                {[
                  { label: 'File Type', value: design.fileType },
                  { label: 'File Size', value: formatBytes(design.fileSize) },
                  design.width ? { label: 'Dimensions', value: `${design.width}×${design.height}px` } : null,
                  design.dpi ? { label: 'Source DPI', value: `${design.dpi} DPI` } : null,
                ].filter(Boolean).map((item: any) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <dt className="text-zinc-500">{item.label}</dt>
                    <dd className="text-zinc-300 font-medium">{item.value}</dd>
                  </div>
                ))}
              </dl>

              {design.description && (
                <p className="text-xs text-zinc-500 border-t border-zinc-800 pt-3">
                  {design.description}
                </p>
              )}

              {design.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-t border-zinc-800 pt-3">
                  {design.tags.map((t) => (
                    <span key={t} className="rounded-full bg-zinc-800 border border-zinc-700
                      px-2.5 py-0.5 text-[11px] text-zinc-400">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status Actions */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
              <h2 className="text-sm font-semibold text-zinc-300">Review</h2>
              <div className="flex gap-2">
                <button
                  disabled={updating || design.status === 'APPROVED'}
                  onClick={() => updateStatus('APPROVED')}
                  className="flex-1 rounded-lg border border-green-800/50 bg-green-900/30
                    py-2 text-sm text-green-400 font-medium hover:bg-green-900/50
                    transition-colors disabled:opacity-40"
                >
                  ✓ Approve
                </button>
                <button
                  disabled={updating || design.status === 'REJECTED'}
                  onClick={() => updateStatus('REJECTED')}
                  className="flex-1 rounded-lg border border-red-800/50 bg-red-900/30
                    py-2 text-sm text-red-400 font-medium hover:bg-red-900/50
                    transition-colors disabled:opacity-40"
                >
                  ✗ Reject
                </button>
              </div>
            </div>

            {/* Print Panel */}
            {design.status === 'APPROVED' && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 space-y-3">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-300">Secure Print</h2>
                  <p className="text-xs text-zinc-600 mt-1">
                    Backend processes at 300 DPI. File is never downloaded.
                  </p>
                </div>
                <PrintTrigger designId={design.id} designTitle={design.title} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
