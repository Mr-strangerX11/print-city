'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { invoicesApi } from '@/lib/api';
import { Invoice, InvoiceStatus } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  ArrowLeft, Download, FileText, Package, MapPin, CreditCard,
  Users, TrendingUp, Store, CheckCircle2,
} from 'lucide-react';
import Cookies from 'js-cookie';

const STATUS_OPTIONS: InvoiceStatus[] = ['ISSUED', 'PAID', 'CANCELLED', 'REFUNDED'];

export default function AdminInvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    invoicesApi.get(id)
      .then(({ data }) => setInvoice(data.data))
      .catch(() => router.push('/admin/invoices'))
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

  const handleStatusChange = async (status: InvoiceStatus) => {
    if (!invoice) return;
    setUpdatingStatus(true);
    try {
      await invoicesApi.updateStatus(invoice.id, status);
      setInvoice((prev) => prev ? { ...prev, status } : prev);
    } finally {
      setUpdatingStatus(false);
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

  // Group items by vendor for commission breakdown
  const vendorGroups = (invoice.items ?? []).reduce<Record<string, { storeName: string; items: typeof invoice.items; vendorTotal: number; adminTotal: number }>>((acc, item) => {
    const vid = item.vendorId;
    if (!acc[vid]) acc[vid] = { storeName: item.vendor?.storeName ?? 'Unknown Vendor', items: [], vendorTotal: 0, adminTotal: 0 };
    acc[vid].items.push(item);
    acc[vid].vendorTotal += Number(item.vendorEarning);
    acc[vid].adminTotal += Number(item.adminEarning);
    return acc;
  }, {});

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> All Invoices
        </button>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status changer */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Status:</span>
            <select
              value={invoice.status}
              disabled={updatingStatus}
              onChange={(e) => handleStatusChange(e.target.value as InvoiceStatus)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white text-gray-700 font-semibold"
            >
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {updatingStatus && <span className="text-xs text-gray-400">Saving…</span>}
          </div>
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

      {/* Invoice Header */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Invoice</p>
              <p className="text-white font-black text-2xl mt-1">{invoice.invoiceNumber}</p>
              <p className="text-white/70 text-sm mt-1">Order #{invoice.orderId.slice(-8).toUpperCase()}</p>
            </div>
            <StatusBadge status={invoice.status} type="invoice" className="bg-white/20 text-white" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-y sm:divide-y-0 divide-gray-100">
          {[
            { label: 'Issued', value: formatDate(invoice.issuedAt) },
            { label: 'Total', value: formatPrice(invoice.total) },
            { label: 'Platform', value: formatPrice(invoice.totalAdminEarnings) },
            { label: 'Vendors', value: formatPrice(invoice.totalVendorEarnings) },
            { label: 'Items', value: String(invoice.items?.length ?? 0) },
          ].map((item) => (
            <div key={item.label} className="px-5 py-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{item.label}</p>
              <p className="font-black text-gray-900 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Customer + Shipping */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-violet-500" />
            <h3 className="font-bold text-gray-900 text-sm">Customer</h3>
          </div>
          <p className="font-semibold text-gray-900">{invoice.user?.name}</p>
          <p className="text-sm text-gray-500 mt-0.5">{invoice.user?.email}</p>
          {invoice.user?.phone && <p className="text-sm text-gray-500">{invoice.user.phone}</p>}
          <Link href={`/admin/orders/${invoice.orderId}`} className="text-xs text-violet-600 font-medium hover:underline mt-2 inline-block">
            View Order →
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-blue-500" />
            <h3 className="font-bold text-gray-900 text-sm">Shipping Address</h3>
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
          <h3 className="font-bold text-gray-900 text-sm">Payment</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Method', value: payment?.provider ?? '—' },
            { label: 'Status', value: order?.paymentStatus ?? '—' },
            { label: 'Amount', value: payment ? formatPrice(payment.amount) : '—' },
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
          <h3 className="font-bold text-gray-900 text-sm">Line Items</h3>
        </div>
        <div className="hidden sm:grid grid-cols-[1fr_60px_110px_110px_110px_110px] gap-4 px-6 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Product</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Unit</span>
          <span className="text-right">Total</span>
          <span className="text-right text-emerald-600">Vendor</span>
          <span className="text-right text-violet-600">Platform</span>
        </div>
        <div className="divide-y divide-gray-50">
          {invoice.items?.map((item) => (
            <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_60px_110px_110px_110px_110px] gap-2 sm:gap-4 items-center px-6 py-4">
              <div className="flex items-center gap-3">
                {item.productImageUrl ? (
                  <img src={item.productImageUrl} alt={item.productName} className="w-10 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{item.productName}</p>
                  <p className="text-xs text-gray-400">{item.variantLabel} · {item.vendor?.storeName}</p>
                </div>
              </div>
              <p className="sm:text-center text-sm">{item.qty}</p>
              <p className="sm:text-right text-sm">{formatPrice(item.unitPrice)}</p>
              <p className="sm:text-right font-bold text-gray-900">{formatPrice(item.total)}</p>
              <p className="sm:text-right text-sm font-semibold text-emerald-600">{formatPrice(item.vendorEarning)}</p>
              <p className="sm:text-right text-sm font-semibold text-violet-600">{formatPrice(item.adminEarning)}</p>
            </div>
          ))}
        </div>
        {/* Totals */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm text-gray-600"><span>Subtotal</span><span>{formatPrice(invoice.subtotal)}</span></div>
            {Number(invoice.discount) > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>−{formatPrice(invoice.discount)}</span></div>}
            <div className="flex justify-between text-sm text-gray-600"><span>Shipping</span><span>{Number(invoice.shipping) === 0 ? 'Free' : formatPrice(invoice.shipping)}</span></div>
            {Number(invoice.tax) > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Tax</span><span>{formatPrice(invoice.tax)}</span></div>}
            <div className="flex justify-between font-black text-gray-900 text-base border-t border-gray-200 pt-2 mt-2">
              <span>Total</span><span className="text-violet-600">{formatPrice(invoice.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Commission Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Store className="w-4 h-4 text-gray-500" />
          <h3 className="font-bold text-gray-900 text-sm">Vendor Commission Breakdown</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {Object.entries(vendorGroups).map(([vendorId, group]) => (
            <div key={vendorId} className="px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-gray-400" />
                  <p className="font-semibold text-gray-900 text-sm">{group.storeName}</p>
                  <span className="text-xs text-gray-400">· {group.items.length} item{group.items.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Sales</p>
                  <p className="font-black text-gray-900 mt-0.5">{formatPrice(group.items.reduce((s, i) => s + Number(i.total), 0))}</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3">
                  <p className="text-xs text-emerald-600 uppercase tracking-wider font-medium">Vendor Earns</p>
                  <p className="font-black text-emerald-700 mt-0.5">{formatPrice(group.vendorTotal)}</p>
                </div>
                <div className="bg-violet-50 rounded-xl p-3">
                  <p className="text-xs text-violet-600 uppercase tracking-wider font-medium">Platform Fee</p>
                  <p className="font-black text-violet-700 mt-0.5">{formatPrice(group.adminTotal)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grand commission totals */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Invoice Total</p>
            <p className="font-black text-gray-900 mt-0.5">{formatPrice(invoice.total)}</p>
          </div>
          <div>
            <p className="text-xs text-emerald-600 uppercase tracking-wider font-medium">Total Vendor Pay</p>
            <p className="font-black text-emerald-700 mt-0.5">{formatPrice(invoice.totalVendorEarnings)}</p>
          </div>
          <div>
            <p className="text-xs text-violet-600 uppercase tracking-wider font-medium">Total Platform</p>
            <p className="font-black text-violet-700 mt-0.5">{formatPrice(invoice.totalAdminEarnings)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Margin</p>
            <p className="font-black text-gray-900 mt-0.5">
              {invoice.total > 0
                ? `${((Number(invoice.totalAdminEarnings) / Number(invoice.total)) * 100).toFixed(1)}%`
                : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
