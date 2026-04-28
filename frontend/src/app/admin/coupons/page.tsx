'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatPrice } from '@/lib/utils';
import { Tag, Plus, ToggleLeft, ToggleRight, RefreshCw, Trash2, Percent, DollarSign } from 'lucide-react';

type Coupon = any;

const COUPON_TYPES = ['PERCENTAGE', 'FIXED', 'FREE_SHIPPING'];

const emptyForm = {
  code: '', type: 'PERCENTAGE', value: '', minOrderAmount: '',
  maxUses: '', maxUsesPerUser: '', expiresAt: '', isActive: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        api.get('/coupons'),
        api.get('/coupons/stats'),
      ]);
      setCoupons(c.data.data?.items ?? c.data.data ?? []);
      setStats(s.data.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id: string, current: boolean) => {
    await api.patch(`/coupons/${id}`, { isActive: !current });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    setDeleting(id);
    try { await api.delete(`/coupons/${id}`); load(); }
    finally { setDeleting(null); }
  };

  const create = async () => {
    setSaving(true);
    try {
      await api.post('/coupons', {
        ...form,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
        maxUses: form.maxUses ? Number(form.maxUses) : undefined,
        maxUsesPerUser: form.maxUsesPerUser ? Number(form.maxUsesPerUser) : undefined,
        expiresAt: form.expiresAt || undefined,
      });
      setShowCreate(false);
      setForm({ ...emptyForm });
      load();
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Coupons & Discounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">{coupons.length} coupons total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-2">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 text-sm font-semibold bg-violet-600 text-white rounded-xl px-4 py-2 hover:bg-violet-700">
            <Plus className="w-4 h-4" /> New Coupon
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Coupons', value: stats.total ?? coupons.length, color: 'bg-violet-50', text: 'text-violet-600' },
            { label: 'Active', value: stats.active ?? coupons.filter((c: any) => c.isActive).length, color: 'bg-green-50', text: 'text-green-600' },
            { label: 'Times Used', value: stats.totalUsages ?? 0, color: 'bg-blue-50', text: 'text-blue-600' },
            { label: 'Total Saved', value: formatPrice(stats.totalDiscount ?? 0), color: 'bg-orange-50', text: 'text-orange-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <Tag className={`w-5 h-5 ${s.text}`} />
              </div>
              <p className="text-2xl font-black text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-gray-50 animate-pulse rounded-xl" />)}</div>
        ) : coupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag className="w-10 h-10 text-gray-300 mb-3" />
            <p className="font-semibold text-gray-600">No coupons yet</p>
            <p className="text-xs text-gray-400 mt-1">Create your first coupon to offer discounts.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {coupons.map((c: any) => (
              <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50">
                <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                  {c.type === 'PERCENTAGE' ? <Percent className="w-4 h-4 text-violet-600" /> : <DollarSign className="w-4 h-4 text-violet-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-900 text-sm tracking-widest">{c.code}</p>
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-800">
                      {c.type === 'PERCENTAGE' ? `${c.value}% off` : c.type === 'FIXED' ? `Rs. ${c.value} off` : 'Free Shipping'}
                    </span>
                    {!c.isActive && <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">Inactive</span>}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {c.minOrderAmount && <p className="text-xs text-gray-400">Min: {formatPrice(c.minOrderAmount)}</p>}
                    {c.maxUses && <p className="text-xs text-gray-400">Limit: {c.usageCount}/{c.maxUses}</p>}
                    {c.expiresAt && <p className="text-xs text-gray-400">Exp: {formatDate(c.expiresAt)}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggle(c.id, c.isActive)} title={c.isActive ? 'Deactivate' : 'Activate'}>
                    {c.isActive
                      ? <ToggleRight className="w-6 h-6 text-green-500" />
                      : <ToggleLeft className="w-6 h-6 text-gray-400" />
                    }
                  </button>
                  <button onClick={() => remove(c.id)} disabled={deleting === c.id} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-900 text-lg">Create Coupon</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Coupon Code *</label>
                <input
                  type="text" placeholder="e.g. SAVE20" value={form.code}
                  onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 font-mono tracking-wider"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Type *</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white">
                  {COUPON_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {form.type === 'PERCENTAGE' ? 'Discount %' : form.type === 'FIXED' ? 'Discount Amount (Rs.)' : 'Value (leave 0)'}
                </label>
                <input
                  type="number" placeholder="0" value={form.value}
                  onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Min Order Amount</label>
                <input
                  type="number" placeholder="Optional" value={form.minOrderAmount}
                  onChange={e => setForm(p => ({ ...p, minOrderAmount: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Max Total Uses</label>
                <input
                  type="number" placeholder="Unlimited" value={form.maxUses}
                  onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Max Uses Per User</label>
                <input
                  type="number" placeholder="Unlimited" value={form.maxUsesPerUser}
                  onChange={e => setForm(p => ({ ...p, maxUsesPerUser: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Expires At</label>
                <input
                  type="date" value={form.expiresAt}
                  onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
              <span className="text-sm text-gray-700">Active immediately</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowCreate(false); setForm({ ...emptyForm }); }} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={create} disabled={saving || !form.code || !form.value} className="flex-1 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 disabled:opacity-50">
                {saving ? 'Creating…' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
