'use client';

import React, { useEffect, useState } from 'react';
import { customDesignApi } from '@/lib/api';
import { CustomDesignOrder } from '@/types';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { toast } from 'sonner';

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomDesignOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<CustomDesignOrder | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [price, setPrice] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = () => {
    customDesignApi.list().then(({ data }) => setOrders(data.data.items ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const update = async (id: string, status: string) => {
    setUpdating(true);
    try {
      await customDesignApi.update(id, { status, adminNotes, price: price ? Number(price) : undefined });
      toast.success('Custom order updated');
      setSelected(null);
      load();
    } catch { toast.error('Failed'); }
    finally { setUpdating(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900">Custom Design Orders</h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4"><div className="h-12 bg-gray-100 rounded animate-pulse" /></div>
            )) : orders.length === 0 ? (
              <div className="py-16 text-center text-gray-400">No custom orders yet</div>
            ) : orders.map(order => (
              <button key={order.id} onClick={() => { setSelected(order); setAdminNotes(order.notes ?? ''); setPrice(order.price?.toString() ?? ''); }}
                className={`w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors ${selected?.id === order.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''}`}>
                <img src={order.designUrl} alt="Design" className="w-12 h-12 rounded-lg object-contain bg-gray-50 border border-gray-100" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 text-sm capitalize">{order.productType.replace(/-/g, ' ')}</p>
                    <StatusBadge status={order.status} type="custom" />
                  </div>
                  <p className="text-xs text-gray-500">{order.user?.name} · {order.size} / {order.color} × {order.qty}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selected ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
            <h2 className="font-black text-gray-900">Review Order</h2>
            <div className="flex justify-center">
              <img src={selected.designUrl} alt="Design" className="max-h-48 rounded-xl object-contain bg-gray-50 border border-gray-100 p-3" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { l: 'Product', v: selected.productType },
                { l: 'Customer', v: selected.user?.name },
                { l: 'Size', v: selected.size },
                { l: 'Color', v: selected.color },
                { l: 'Quantity', v: selected.qty },
              ].map(row => (
                <div key={row.l} className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400">{row.l}</p>
                  <p className="font-semibold text-gray-900 mt-0.5">{row.v ?? '—'}</p>
                </div>
              ))}
            </div>
            {selected.notes && (
              <div className="p-3 bg-blue-50 rounded-xl"><p className="text-xs text-blue-600 font-semibold">Customer Notes</p><p className="text-sm text-gray-700 mt-1">{selected.notes}</p></div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Set Price (Rs.)</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 999"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Notes</label>
              <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => update(selected.id, 'APPROVED')} disabled={updating}
                className="flex-1 py-2.5 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 disabled:opacity-60 transition-colors">
                Approve & Send Quote
              </button>
              <button onClick={() => update(selected.id, 'REJECTED')} disabled={updating}
                className="flex-1 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 disabled:opacity-60 transition-colors">
                Reject
              </button>
            </div>
            <div className="flex gap-2">
              {['PRINTING', 'SHIPPED', 'DELIVERED'].map(s => (
                <button key={s} onClick={() => update(selected.id, s)} disabled={updating}
                  className="flex-1 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-2xl border border-dashed border-gray-200 p-12 text-center flex items-center justify-center">
            <p className="text-gray-400 text-sm">Select an order to review</p>
          </div>
        )}
      </div>
    </div>
  );
}
