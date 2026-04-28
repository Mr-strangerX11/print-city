'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api';
import { Invoice, InvoiceStatus } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { FileText, Download, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Cookies from 'js-cookie';

const STATUSES: InvoiceStatus[] = ['ISSUED', 'PAID', 'CANCELLED', 'REFUNDED'];

function CustomerInvoicesContent() {
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
        limit: 10,
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
    router.push(`/dashboard/invoices?${p.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    router.push(`/dashboard/invoices?${params.toString()}`);
  };

  const handleDownload = (invoiceId: string, invoiceNumber: string) => {
    const token = Cookies.get('accessToken');
    const url = invoicesApi.downloadUrl(invoiceId);
    const a = document.createElement('a');
    a.href = `${url}${token ? `?token=${token}` : ''}`;
    a.download = `${invoiceNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">My Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} invoice{total !== 1 ? 's' : ''} total</p>
        </div>
      </div>

      {/* Search + Filters */}
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
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setStatus('')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${!status ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            All
          </button>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
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
          <div className="space-y-px">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-50 animate-pulse m-3 rounded-xl" />
            ))}
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-600">No invoices yet</p>
            <p className="text-sm text-gray-400 mt-1">Invoices are generated after your orders are confirmed.</p>
            <Link href="/dashboard/orders" className="mt-4 text-sm text-violet-600 font-medium hover:underline">
              View your orders →
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden sm:grid grid-cols-[1fr_120px_140px_100px_80px] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-700 text-gray-500 uppercase tracking-wider">
              <span>Invoice</span>
              <span className="text-center">Status</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Date</span>
              <span />
            </div>
            <div className="divide-y divide-gray-50">
              {invoices.map((inv) => (
                <div key={inv.id} className="grid grid-cols-1 sm:grid-cols-[1fr_120px_140px_100px_80px] gap-2 sm:gap-4 items-center px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{inv.invoiceNumber}</p>
                      <p className="text-xs text-gray-400">Order #{inv.orderId.slice(-8).toUpperCase()}</p>
                    </div>
                  </div>
                  <div className="sm:text-center">
                    <StatusBadge status={inv.status} type="invoice" />
                  </div>
                  <p className="sm:text-right font-black text-gray-900">{formatPrice(inv.total)}</p>
                  <p className="sm:text-right text-sm text-gray-500">{formatDate(inv.issuedAt)}</p>
                  <div className="flex gap-2 sm:justify-end">
                    <Link
                      href={`/dashboard/invoices/${inv.id}`}
                      className="p-2 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                      title="View"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDownload(inv.id, inv.invoiceNumber)}
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
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
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

export default function CustomerInvoicesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <CustomerInvoicesContent />
    </Suspense>
  );
}
