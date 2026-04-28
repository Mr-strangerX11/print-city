'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { vendorsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { toast } from 'sonner';

function AdminVendorsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCommission, setEditingCommission] = useState<{ id: string; rate: number } | null>(null);
  const status = searchParams.get('status') ?? '';

  const load = () => {
    vendorsApi.list({ status: status || undefined }).then(({ data }) => setVendors(data.data ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [status]);

  const approve = async (id: string) => {
    try {
      await vendorsApi.updateStatus(id, 'ACTIVE');
      toast.success('Vendor approved!');
      load();
    } catch { toast.error('Failed'); }
  };

  const suspend = async (id: string) => {
    try {
      await vendorsApi.updateStatus(id, 'SUSPENDED');
      toast.success('Vendor suspended');
      load();
    } catch { toast.error('Failed'); }
  };

  const updateCommission = async (id: string, rate: number) => {
    try {
      await vendorsApi.updateCommission(id, rate / 100);
      toast.success('Commission updated');
      setEditingCommission(null);
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Vendors</h1>
        <span className="text-sm text-gray-500">{vendors.length} total</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'PENDING', 'ACTIVE', 'SUSPENDED'].map(s => (
          <button key={s} onClick={() => router.push(`/admin/vendors${s ? `?status=${s}` : ''}`)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${status === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Store</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Products</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Commission</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
                ))
              ) : vendors.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">No vendors found</td></tr>
              ) : vendors.map((v: any) => (
                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 text-sm">{v.storeName}</p>
                    <p className="text-xs text-gray-400">{v.storeSlug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{v.user?.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">{v._count?.products ?? 0}</td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {editingCommission?.id === v.id ? (
                      <div className="flex items-center gap-1">
                        <input type="number" min="1" max="50" value={editingCommission.rate}
                          onChange={e => setEditingCommission({ id: v.id, rate: Number(e.target.value) })}
                          className="w-16 px-2 py-1 border border-gray-200 rounded-lg text-sm" />
                        <span className="text-xs text-gray-500">%</span>
                        <button onClick={() => updateCommission(v.id, editingCommission.rate)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingCommission(null)} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditingCommission({ id: v.id, rate: (v.commissionRate * 100) })}
                        className="flex items-center gap-1 text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors">
                        <DollarSign className="w-3.5 h-3.5" />
                        {(v.commissionRate * 100).toFixed(0)}%
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={v.status} type="vendor" /></td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(v.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {v.status === 'PENDING' && (
                        <button onClick={() => approve(v.id)}
                          className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100 transition-colors">
                          Approve
                        </button>
                      )}
                      {v.status === 'ACTIVE' && (
                        <button onClick={() => suspend(v.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition-colors">
                          Suspend
                        </button>
                      )}
                      {v.status === 'SUSPENDED' && (
                        <button onClick={() => approve(v.id)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors">
                          Reinstate
                        </button>
                      )}
                    </div>
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

export default function AdminVendorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminVendorsContent />
    </Suspense>
  );
}
