'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { invoicesApi } from '@/lib/api';
import { Invoice } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ArrowLeft, Download, FileText, Package, MapPin, CreditCard, Printer } from 'lucide-react';
import Cookies from 'js-cookie';

export default function CustomerInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    invoicesApi.get(id)
      .then(({ data }) => setInvoice(data.data))
      .catch(() => router.push('/dashboard/invoices'))
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
      if (!res.ok) throw new Error('Failed to download');
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

  const order = invoice.order;
  const payment = order?.payment;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm font-bold rounded-xl hover:bg-violet-700 transition-colors disabled:opacity-60"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generating…' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Invoice Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Invoice</p>
              <p className="text-white font-black text-2xl mt-1">{invoice.invoiceNumber}</p>
              <p className="text-white/70 text-sm mt-1">Order #{invoice.orderId.slice(-8).toUpperCase()}</p>
            </div>
            <StatusBadge status={invoice.status} type="invoice" className="bg-white/20 text-white border-white/30" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-100">
          {[
            { label: 'Issued', value: formatDate(invoice.issuedAt) },
            { label: 'Total', value: formatPrice(invoice.total) },
            { label: 'Payment', value: order?.paymentStatus ?? '—' },
            { label: 'Items', value: String(invoice.items?.length ?? 0) },
          ].map((item) => (
            <div key={item.label} className="px-5 py-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{item.label}</p>
              <p className="font-black text-gray-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Billing + Shipping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-violet-500" />
            <h3 className="font-bold text-gray-900 text-sm">Bill To</h3>
          </div>
          <p className="font-semibold text-gray-900">{invoice.user?.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{invoice.user?.email}</p>
          {invoice.user?.phone && <p className="text-sm text-gray-500">{invoice.user.phone}</p>}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-gray-900 text-sm">Ship To</h3>
          </div>
          <p className="font-semibold text-gray-900">{order?.shippingName}</p>
          <p className="text-sm text-gray-500 mt-0.5">{order?.shippingPhone}</p>
          <p className="text-sm text-gray-500">{order?.shippingAddress}</p>
          <p className="text-sm text-gray-500">{[order?.shippingCity, order?.shippingState].filter(Boolean).join(', ')}</p>
          <p className="text-sm text-gray-500">{order?.shippingCountry ?? 'Nepal'}</p>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-emerald-500" />
          <h3 className="font-bold text-gray-900 text-sm">Payment Information</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Method', value: payment?.provider ?? '—' },
            { label: 'Status', value: order?.paymentStatus ?? '—' },
            { label: 'Transaction ID', value: payment?.externalId ?? '—' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{item.label}</p>
              <p className="font-semibold text-gray-900 mt-0.5 text-sm">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package className="w-4 h-4 text-gray-500" />
          <h3 className="font-bold text-gray-900 text-sm">Order Items</h3>
        </div>

        <div className="hidden sm:grid grid-cols-[1fr_60px_120px_120px] gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Product</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Unit Price</span>
          <span className="text-right">Total</span>
        </div>

        <div className="divide-y divide-gray-50">
          {invoice.items?.map((item) => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_60px_120px_120px] gap-2 sm:gap-4 items-center px-6 py-4">
              <div className="flex items-center gap-3">
                {item.productImageUrl ? (
                  <img src={item.productImageUrl} alt={item.productName} className="w-12 h-12 rounded-xl object-cover border border-gray-100 flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.variantLabel}</p>
                </div>
              </div>
              <p className="sm:text-center text-sm text-gray-700"><span className="sm:hidden text-gray-400">Qty: </span>{item.qty}</p>
              <p className="sm:text-right text-sm text-gray-700"><span className="sm:hidden text-gray-400">Unit: </span>{formatPrice(item.unitPrice)}</p>
              <p className="sm:text-right font-bold text-gray-900"><span className="sm:hidden text-gray-400">Total: </span>{formatPrice(item.total)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{formatPrice(invoice.subtotal)}</span>
            </div>
            {Number(invoice.discount) > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span>Discount</span><span>−{formatPrice(invoice.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-600">
              <span>Shipping</span><span>{Number(invoice.shipping) === 0 ? 'Free' : formatPrice(invoice.shipping)}</span>
            </div>
            {Number(invoice.tax) > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (13% VAT)</span><span>{formatPrice(invoice.tax)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-gray-900 text-base border-t border-gray-200 pt-2 mt-2">
              <span>Total</span><span className="text-violet-600">{formatPrice(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-xs text-center text-gray-400 pb-4">
        This is a computer-generated invoice. For support, contact support@printcity.com.np
      </p>
    </div>
  );
}
