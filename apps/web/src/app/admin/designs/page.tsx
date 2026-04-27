'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

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

interface PageData {
  items: Design[];
  total: number;
  pages: number;
  page: number;
}

const STATUS_STYLES = {
  PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  APPROVED: 'bg-green-500/15 text-green-400 border-green-500/30',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDesignsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchDesigns = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);

    const res = await fetch(`${API}/api/designs?${params}`, { credentials: 'include' });
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [page, statusFilter, search]);

  useEffect(() => { fetchDesigns(); }, [fetchDesigns]);

  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdating(id);
    await fetch(`${API}/api/designs/${id}/status`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    fetchDesigns();
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl px-4 py-8">

        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Design Vault</h1>
            <p className="mt-1 text-sm text-zinc-500">
              All vendor designs — secured, watermarked, never downloadable
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-indigo-500/30
            bg-indigo-500/10 px-4 py-2 text-xs text-indigo-400">
            🔐 Admin view — designs are watermarked
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Search designs or vendor…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm
              text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none
              focus:ring-1 focus:ring-indigo-500 w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm
              text-zinc-300 focus:border-indigo-500 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-left text-xs text-zinc-500 uppercase tracking-wider">
                <th className="px-6 py-4">Design</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">File Info</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-600">
                    Loading designs…
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-600">
                    No designs found
                  </td>
                </tr>
              ) : (
                data?.items.map((d) => (
                  <tr key={d.id} className="hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-zinc-100">{d.title}</div>
                      {d.description && (
                        <div className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                          {d.description}
                        </div>
                      )}
                      {d.tags.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {d.tags.slice(0, 3).map((t) => (
                            <span key={t} className="rounded-full bg-zinc-800 px-2 py-0.5
                              text-[10px] text-zinc-500 border border-zinc-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-zinc-400">{d.vendor.storeName}</td>
                    <td className="px-6 py-4">
                      <div className="text-zinc-400 text-xs space-y-0.5">
                        <div>{d.fileType.split('/')[1]?.toUpperCase()} · {formatBytes(d.fileSize)}</div>
                        {d.width && <div>{d.width}×{d.height}px {d.dpi ? `@ ${d.dpi}dpi` : ''}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-medium
                        ${STATUS_STYLES[d.status]}`}>
                        {d.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/designs/${d.id}`}
                          className="rounded-md bg-zinc-700 px-3 py-1.5 text-xs font-medium
                            text-zinc-200 hover:bg-zinc-600 transition-colors"
                        >
                          👁 View
                        </Link>
                        {d.status !== 'APPROVED' && (
                          <button
                            disabled={updating === d.id}
                            onClick={() => updateStatus(d.id, 'APPROVED')}
                            className="rounded-md bg-green-900/40 px-3 py-1.5 text-xs font-medium
                              text-green-400 border border-green-800/50 hover:bg-green-900/60
                              transition-colors disabled:opacity-50"
                          >
                            ✓ Approve
                          </button>
                        )}
                        {d.status !== 'REJECTED' && (
                          <button
                            disabled={updating === d.id}
                            onClick={() => updateStatus(d.id, 'REJECTED')}
                            className="rounded-md bg-red-900/40 px-3 py-1.5 text-xs font-medium
                              text-red-400 border border-red-800/50 hover:bg-red-900/60
                              transition-colors disabled:opacity-50"
                          >
                            ✗ Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
            <span>{data.total} total designs</span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2
                  hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                ← Prev
              </button>
              <span className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2">
                {page} / {data.pages}
              </span>
              <button
                disabled={page === data.pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2
                  hover:bg-zinc-700 disabled:opacity-40 transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
