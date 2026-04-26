'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { invoicesApi } from '@/lib/api';
import { Invoice } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/context/AuthContext';
import {
  ArrowLeft, Download, FileText, Package, Store, TrendingUp, DollarSign,
} from 'lucide-react';
import Cookies from 'js-cookie';

export default function VendorInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    invoicesApi.get(id)
      .then(({ data }) => setInvoice(data.data))
      .catch(() => router.push('/vendor/invoices'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleDownload = async () => {
    if (!invoice || downloading) return;
    setDownloading(true);
    try {
      const token = Cookies.get('accessToken');
      const res = await fetch(`/api/invoices/${invoice.id}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-48" />
        <div className="h-40 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!invoice) return null;

  // Filter only this vendor's items
  const myItems = (invoice.items ?? []).filter(
    (item) => item.vendor?.storeName || item.vendorId,
  );

  const myEarnings = myItems.reduce((s, i) => s + Number(i.vendorEarning), 0);
  const mySales = myItems.reduce((s, i) => s + Number(i.total), 0);
  const myCommission = mySales - myEarnings;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating…' : 'Download PDF'}
        </button>
      </div>

      {/* Invoice Header */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Invoice</p>
              <p className="text-white font-black text-2xl mt-1">{invoice.invoiceNumber}</p>
              <p className="text-white/70 text-sm mt-1">{formatDate(invoice.issuedAt)}</p>
            </div>
            <StatusBadge status={invoice.status} type="invoice" className="bg-white/20 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
          {[
            { label: 'Invoice Total', value: formatPrice(invoice.total) },
            { label: 'Your Sales', value: formatPrice(mySales) },
            { label: 'Your Earnings', value: formatPrice(myEarnings) },
            { label: 'Commission', value: formatPrice(myCommission) },
          ].map((item) => (
            <div key={item.label} className="px-5 py-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{item.label}</p>
              <p className="font-black text-gray-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Earnings Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">You Earn</p>
          </div>
          <p className="text-2xl font-black text-emerald-700">{formatPrice(myEarnings)}</p>
          <p className="text-xs text-emerald-600 mt-1">After platform commission</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Store className="w-4 h-4 text-gray-500" />
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Sales</p>
          </div>
          <p className="text-2xl font-black text-gray-900">{formatPrice(mySales)}</p>
          <p className="text-xs text-gray-400 mt-1">Gross product sales</p>
        </div>
        <div className="bg-violet-50 rounded-2xl border border-violet-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            <p className="text-xs font-bold text-violet-600 uppercase tracking-wider">Platform Fee</p>
          </div>
          <p className="text-2xl font-black text-violet-700">{formatPrice(myCommission)}</p>
          <p className="text-xs text-violet-600 mt-1">Commission deducted</p>
        </div>
      </div>

      {/* Your Items on this Invoice */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          <h3 className="font-bold text-gray-900 text-sm">Your Products on This Invoice</h3>
          <span className="ml-auto text-xs text-gray-400">{myItems.length} item{myItems.length !== 1 ? 's' : ''}</span>
        </div>

        <div className="hidden sm:grid grid-cols-[1fr_60px_110px_110px_110px] gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Product</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Unit</span>
          <span className="text-right">Sale Total</span>
          <span className="text-right text-emerald-600">You Earn</span>
        </div>

        <div className="divide-y divide-gray-50">
          {myItems.map((item) => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_60px_110px_110px_110px] gap-2 sm:gap-4 items-center px-6 py-4">
              <div className="flex items-center gap-3">
                {item.productImageUrl ? (
                  <img src={item.productImageUrl} alt={item.productName} className="w-11 h-11 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                ) : (
                  <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.variantLabel}</p>
                </div>
              </div>
              <p className="sm:text-center text-sm">{item.qty}</p>
              <p className="sm:text-right text-sm">{formatPrice(item.unitPrice)}</p>
              <p className="sm:text-right font-bold text-gray-900">{formatPrice(item.total)}</p>
              <p className="sm:text-right font-black text-emerald-600">{formatPrice(item.vendorEarning)}</p>
            </div>
          ))}
        </div>

        {/* Item Totals */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Gross Sales</span><span>{formatPrice(mySales)}</span>
            </div>
            <div className="flex justify-between text-sm text-violet-600">
              <span>Platform Commission</span><span>−{formatPrice(myCommission)}</span>
            </div>
            <div className="flex justify-between font-black text-emerald-700 text-base border-t border-gray-200 pt-2 mt-2">
              <span>Your Earnings</span><span>{formatPrice(myEarnings)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-sm text-amber-800 font-medium">
          Earnings are credited to your payout balance after the order is delivered and payment is confirmed.
        </p>
      </div>
    </div>
  );
}
