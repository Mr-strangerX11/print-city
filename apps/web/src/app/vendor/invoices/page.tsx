'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api';
import { Invoice, InvoiceStatus } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FileText, Download, Search, ChevronLeft, ChevronRight, TrendingUp, DollarSign, Package } from 'lucide-react';
import Cookies from 'js-cookie';

const STATUSES: InvoiceStatus[] = ['ISSUED', 'PAID', 'CANCELLED', 'REFUNDED'];

export default function VendorInvoicesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const status = searchParams.get('status') ?? '';
  const page = Number(searchParams.get('page') ?? 1);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await invoicesApi.list({
        status: status || undefined,
        page,
        limit: 15,
        search: search || undefined,
      });
      setInvoices(data.data.items ?? []);
      setTotal(data.data.meta?.total ?? 0);
      setTotalPages(data.data.meta?.totalPages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [status, page, search]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const setStatus = (s: string) => {
    const p = new URLSearchParams();
    if (s) p.set('status', s);
    router.push(`/vendor/invoices?${p.toString()}`);
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

  // Calculate vendor-specific totals from visible invoices
  const totalEarnings = invoices.reduce((s, inv) => s + Number(inv.totalVendorEarnings ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Orders that include your products</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Invoices', value: String(total), icon: <FileText className="w-5 h-5 text-violet-500" />, bg: 'bg-violet-50' },
          { label: 'Your Earnings (page)', value: formatPrice(totalEarnings), icon: <DollarSign className="w-5 h-5 text-emerald-500" />, bg: 'bg-emerald-50' },
          { label: 'Products Sold', value: String(invoices.reduce((s, inv) => s + (inv.items?.length ?? 0), 0)), icon: <Package className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoice number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setStatus('')} className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${!status ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>All</button>
          {STATUSES.map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${status === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{s}</button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="space-y-px p-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-gray-50 animate-pulse rounded-xl" />)}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-600">No invoices yet</p>
            <p className="text-sm text-gray-400 mt-1">Invoices appear here when orders with your products are confirmed.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-900 text-sm">{inv.invoiceNumber}</p>
                    <StatusBadge status={inv.status} type="invoice" />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(inv.issuedAt)} · Order #{inv.orderId.slice(-8).toUpperCase()}
                  </p>
                </div>

                {/* Your earnings on this invoice */}
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Your Earnings</p>
                  <p className="font-black text-emerald-600">{formatPrice(inv.totalVendorEarnings)}</p>
                </div>

                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Invoice Total</p>
                  <p className="font-bold text-gray-900">{formatPrice(inv.total)}</p>
                </div>

                <div className="flex gap-1 flex-shrink-0">
                  <Link
                    href={`/vendor/invoices/${inv.id}`}
                    className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                    title="View"
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', String(page - 1)); router.push(`/vendor/invoices?${p}`); }} className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= totalPages} onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', String(page + 1)); router.push(`/vendor/invoices?${p}`); }} className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400">
        Your earnings are calculated per item: Sale Price × (100% − Commission Rate). Invoices show after orders are confirmed.
      </p>
    </div>
  );
}
