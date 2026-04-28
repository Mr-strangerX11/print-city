'use client';

import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { payoutsApi } from '@/lib/api';
import { Payout } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<any>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      payoutsApi.earnings(),
      payoutsApi.list(),
    ]).then(([earn, pay]) => {
      setEarnings(earn.data.data);
      setPayouts(pay.data.data.items ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900">Earnings & Payouts</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Earnings', value: formatPrice(earnings?.totalEarnings ?? 0), icon: <DollarSign className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
          { label: 'Pending Payout', value: formatPrice(earnings?.pendingEarnings ?? 0), icon: <Clock className="w-5 h-5 text-yellow-500" />, bg: 'bg-yellow-50' },
          { label: 'Paid Out', value: formatPrice(earnings?.paidOut ?? 0), icon: <CheckCircle className="w-5 h-5 text-blue-500" />, bg: 'bg-blue-50' },
          { label: 'Pending Orders', value: earnings?.pendingItemCount ?? 0, icon: <TrendingUp className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`bg-white rounded-2xl border border-gray-100 p-5`}>
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>{s.icon}</div>
            <p className="text-xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Commission Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-4">How Your Earnings Are Calculated</h2>
        <div className="p-4 bg-gray-50 rounded-xl font-mono text-sm space-y-2">
          <div className="flex justify-between text-gray-700"><span>Sale Price (e.g.)</span><span className="font-bold">Rs. 799</span></div>
          <div className="flex justify-between text-green-700"><span>Your Commission (10%)</span><span className="font-bold">Rs. 79.90</span></div>
          <div className="flex justify-between text-gray-400 border-t border-gray-200 pt-2"><span>Platform Revenue</span><span>Rs. 719.10</span></div>
        </div>
        <p className="text-xs text-gray-400 mt-3">Commissions accrue only after orders are delivered and payment is confirmed.</p>
      </div>

      {/* Payout History */}
      <div>
        <h2 className="font-black text-gray-900 mb-4">Payout History</h2>
        {payouts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-gray-400">No payouts yet. Keep selling!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {payouts.map(p => (
                <div key={p.id} className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</p>
                    {p.paidAt && <p className="text-xs text-gray-400 mt-0.5">Paid {formatDate(p.paidAt)}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={p.status} type="payment" />
                    <p className="font-black text-gray-900">{formatPrice(p.amount)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
