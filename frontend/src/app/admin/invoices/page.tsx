'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api';
import { Invoice, InvoiceStatus, InvoiceStats } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  FileText, Download, Search, ChevronLeft, ChevronRight,
  TrendingUp, DollarSign, Receipt, Calendar,
} from 'lucide-react';
import Cookies from 'js-cookie';

const STATUSES: InvoiceStatus[] = ['ISSUED', 'PAID', 'CANCELLED', 'REFUNDED'];

function AdminInvoicesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');

  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, statsRes] = await Promise.all([
        invoicesApi.list({ status: status || undefined, page, limit: 20, search: search || undefined }),
        invoicesApi.stats(),
      ]);
      setInvoices(listRes.data.data.items ?? []);
      setTotal(listRes.data.data.meta?.total ?? 0);
      setTotalPages(listRes.data.data.meta?.totalPages ?? 1);
      setStats(statsRes.data.data);
    } finally {
      setLoading(false);
    }
  }, [status, page, search]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const pushParams = (updates: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    p.delete('page');
    router.push(`/admin/invoices?${p.toString()}`);
  };

  const handleDownload = async (inv: Invoice) => {
    const token = Cookies.get('accessToken');
    const res = await fetch(`/api/invoices/${inv.id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inv.invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleStatusChange = async (inv: Invoice, newStatus: InvoiceStatus) => {
    await invoicesApi.updateStatus(inv.id, newStatus);
    fetchAll();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Invoices</h1>
        <span className="text-sm text-gray-500">{total} total</span>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Revenue',
              value: formatPrice(stats.totalRevenue),
              sub: `${stats.total} invoices`,
              icon: <DollarSign className="w-5 h-5 text-violet-500" />,
              bg: 'bg-violet-50',
            },
            {
              label: 'Platform Earnings',
              value: formatPrice(stats.totalAdminEarnings),
              sub: 'Commission collected',
              icon: <TrendingUp className="w-5 h-5 text-emerald-500" />,
              bg: 'bg-emerald-50',
            },
            {
              label: 'This Month',
              value: formatPrice(stats.monthlyRevenue),
              sub: `${stats.monthlyCount} invoices`,
              icon: <Calendar className="w-5 h-5 text-blue-500" />,
              bg: 'bg-blue-50',
            },
            {
              label: 'Vendor Payouts',
              value: formatPrice(stats.totalVendorEarnings),
              sub: 'Owed to vendors',
              icon: <Receipt className="w-5 h-5 text-orange-500" />,
              bg: 'bg-orange-50',
            },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
              <p className="text-xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search + Status Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoice, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && pushParams({ search })}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => pushParams({ status: '' })}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${!status ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => pushParams({ status: s })}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${status === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="space-y-px p-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-600">No invoices found</p>
            <p className="text-sm text-gray-400 mt-1">Invoices are auto-generated when orders are confirmed.</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:grid grid-cols-[1fr_160px_140px_120px_120px_100px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Invoice / Customer</span>
              <span>Status</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Platform</span>
              <span className="text-right">Date</span>
              <span />
            </div>
            <div className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="grid grid-cols-1 lg:grid-cols-[1fr_160px_140px_120px_120px_100px] gap-2 lg:gap-4 items-center px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Invoice / Customer */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-400">{inv.user?.name} · {inv.user?.email}</p>
                    </div>
                  </div>

                  {/* Status with inline change */}
                  <div>
                    <select
                      value={inv.status}
                      onChange={(e) => handleStatusChange(inv, e.target.value as InvoiceStatus)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-400 bg-white text-gray-700 font-medium"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  {/* Amount */}
                  <p className="lg:text-right font-black text-gray-900">
                    <span className="lg:hidden text-xs text-gray-400 mr-1">Total:</span>
                    {formatPrice(inv.total)}
                  </p>

                  {/* Platform earnings */}
                  <p className="lg:text-right text-sm font-semibold text-emerald-600">
                    <span className="lg:hidden text-xs text-gray-400 mr-1">Platform:</span>
                    {formatPrice(inv.totalAdminEarnings)}
                  </p>

                  {/* Date */}
                  <p className="lg:text-right text-sm text-gray-500">{formatDate(inv.issuedAt)}</p>

                  {/* Actions */}
                  <div className="flex gap-1 lg:justify-end">
                    <Link
                      href={`/admin/invoices/${inv.id}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                      title="View invoice"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDownload(inv)}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages} · {total} invoices</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', String(page - 1)); router.push(`/admin/invoices?${p}`); }}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', String(page + 1)); router.push(`/admin/invoices?${p}`); }}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminInvoicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminInvoicesContent />
    </Suspense>
  );
}
