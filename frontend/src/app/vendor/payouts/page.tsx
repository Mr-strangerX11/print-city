'use client';

import React, { useEffect, useState } from 'react';
import { payoutsApi } from '@/lib/api';
import { Payout } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function VendorPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    payoutsApi.list().then(({ data }) => setPayouts(data.data.items ?? [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900">Payout History</h1>
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {['Period', 'Amount', 'Status', 'Paid At'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={4} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              )) : payouts.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-16 text-gray-400">No payouts yet</td></tr>
              ) : payouts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-700">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</td>
                  <td className="px-4 py-3 font-black text-gray-900">{formatPrice(p.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} type="payment" /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
