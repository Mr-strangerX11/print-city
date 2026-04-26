'use client';

import React, { useEffect, useState } from 'react';
import { payoutsApi } from '@/lib/api';
import { Payout } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().split('T')[0]);

  const load = () => {
    setLoading(true);
    payoutsApi.list().then(({ data }) => setPayouts(data.data.items ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const runPayouts = async () => {
    setRunning(true);
    try {
      const { data } = await payoutsApi.run({ periodStart, periodEnd });
      toast.success(`${data.data.created} payout(s) created`);
      load();
    } catch { toast.error('Failed to run payouts'); }
    finally { setRunning(false); }
  };

  const markPaid = async (id: string) => {
    try {
      await payoutsApi.markPaid(id);
      toast.success('Payout marked as paid');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900">Vendor Payouts</h1>

      {/* Run Payouts */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-black text-gray-900 mb-4">Run Payouts for Period</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Period Start</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Period End</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
          </div>
          <button onClick={runPayouts} disabled={running}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors">
            {running && <Loader2 className="w-4 h-4 animate-spin" />}
            {running ? 'Running...' : 'Calculate & Create Payouts'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">This groups all delivered+paid order commissions for each vendor in the period and creates payout records.</p>
      </div>

      {/* Payout Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {['Vendor', 'Period', 'Amount', 'Status', 'Paid At', 'Action'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              )) : payouts.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">No payouts yet. Run payout calculation above.</td></tr>
              ) : payouts.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-gray-900 text-sm">{p.vendor?.storeName ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDate(p.periodStart)} – {formatDate(p.periodEnd)}</td>
                  <td className="px-4 py-3 font-black text-gray-900 text-sm">{formatPrice(p.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} type="payment" /></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{p.paidAt ? formatDate(p.paidAt) : '—'}</td>
                  <td className="px-4 py-3">
                    {p.status !== 'PAID' && (
                      <button onClick={() => markPaid(p.id)} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors">
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
