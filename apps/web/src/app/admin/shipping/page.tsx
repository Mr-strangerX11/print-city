'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { Truck, Package, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

const SHIPMENT_STATUSES = ['PENDING','LABEL_CREATED','PICKED_UP','IN_TRANSIT','OUT_FOR_DELIVERY','DELIVERED','RETURNED','FAILED'];

const STATUS_COLORS: Record<string,string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  LABEL_CREATED: 'bg-blue-100 text-blue-800',
  PICKED_UP: 'bg-indigo-100 text-indigo-800',
  IN_TRANSIT: 'bg-cyan-100 text-cyan-800',
  OUT_FOR_DELIVERY: 'bg-violet-100 text-violet-800',
  DELIVERED: 'bg-green-100 text-green-800',
  RETURNED: 'bg-orange-100 text-orange-800',
  FAILED: 'bg-red-100 text-red-800',
};

export default function ShippingPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [creating, setCreating] = useState<string | null>(null); // orderId being assigned
  const [form, setForm] = useState({ provider: '', trackingNumber: '', labelUrl: '', estimatedAt: '' });

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/production/shipments', { params: { status: statusFilter || undefined } });
      setShipments(data.data?.items ?? []);
      setTotal(data.data?.meta?.total ?? 0);
    } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateStatus = async (id: string, status: string) => {
    await api.patch(`/production/shipments/${id}/status`, { status });
    fetch();
  };

  const createShipment = async (orderId: string) => {
    await api.post(`/production/shipments/${orderId}`, form);
    setCreating(null);
    setForm({ provider: '', trackingNumber: '', labelUrl: '', estimatedAt: '' });
    fetch();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Shipping & Delivery</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} shipments total</p>
        </div>
        <button onClick={fetch} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setStatusFilter('')} className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap ${!statusFilter ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>All</button>
        {SHIPMENT_STATUSES.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap ${statusFilter === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>{s.replace(/_/g,' ')}</button>
        ))}
      </div>

      {/* Shipments Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl"/>)}</div>
        ) : shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Truck className="w-10 h-10 text-gray-300 mb-3"/>
            <p className="font-semibold text-gray-600">No shipments yet</p>
            <p className="text-xs text-gray-400 mt-1">Shipments are created when packed orders are dispatched.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {shipments.map(s => (
              <div key={s.id} className="px-6 py-4 hover:bg-gray-50/50">
                <div className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Truck className="w-4 h-4 text-cyan-600"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">Order #{s.order?.id?.slice(-8).toUpperCase()}</p>
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status]??'bg-gray-100 text-gray-700'}`}>{s.status.replace(/_/g,' ')}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{s.order?.user?.name} · {s.order?.user?.email}</p>
                    {s.trackingNumber && (
                      <p className="text-xs text-violet-600 font-medium mt-1">Tracking: {s.trackingNumber}</p>
                    )}
                    {s.provider && <p className="text-xs text-gray-400">via {s.provider}</p>}
                    {s.estimatedAt && <p className="text-xs text-gray-400">ETA: {formatDate(s.estimatedAt)}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <select
                      value={s.status}
                      onChange={e => updateStatus(s.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none bg-white"
                    >
                      {SHIPMENT_STATUSES.map(st=><option key={st} value={st}>{st.replace(/_/g,' ')}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Shipment Modal */}
      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="font-black text-gray-900">Create Shipment</h3>
            {[
              { key: 'provider', label: 'Courier Provider', placeholder: 'e.g. Nepal Post, Pathao' },
              { key: 'trackingNumber', label: 'Tracking Number', placeholder: 'e.g. NP12345678' },
              { key: 'labelUrl', label: 'Label URL', placeholder: 'https://...' },
              { key: 'estimatedAt', label: 'Estimated Delivery', placeholder: '', type: 'date' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">{f.label}</label>
                <input type={f.type??'text'} placeholder={f.placeholder} value={(form as any)[f.key]}
                  onChange={e => setForm(p=>({...p,[f.key]:e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button onClick={() => setCreating(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => createShipment(creating)} className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
