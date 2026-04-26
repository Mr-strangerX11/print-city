'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { productsApi } from '@/lib/api';
import { Product } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { toast } from 'sonner';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  const load = () => {
    setLoading(true);
    productsApi.list({ status: status || undefined, limit: 50 }).then(({ data }) => setProducts(data.data.items ?? [])).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [status]);

  const approve = async (id: string) => {
    try {
      await productsApi.update(id, { status: 'ACTIVE' });
      toast.success('Product approved');
      load();
    } catch { toast.error('Failed'); }
  };

  const reject = async (id: string) => {
    try {
      await productsApi.update(id, { status: 'REJECTED' });
      toast.success('Product rejected');
      load();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">Products</h1>
        <span className="text-sm text-gray-500">{products.length} shown</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['', 'PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'DRAFT', 'ARCHIVED'].map(s => (
          <button key={s} onClick={() => setStatus(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${status === s ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {s ? s.replace(/_/g, ' ') : 'All'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Product</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Vendor</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-4"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td></tr>
              )) : products.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-16 text-gray-400">No products found</td></tr>
              ) : products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {p.images?.[0] && <Image src={p.images[0].url} alt="" fill unoptimized className="object-cover" sizes="40px" />}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm line-clamp-2 max-w-[180px]">{p.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{p.vendor?.storeName ?? '—'}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 text-sm hidden sm:table-cell">{formatPrice(p.basePrice)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} type="custom" /></td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.status === 'PENDING_APPROVAL' && <>
                        <button onClick={() => approve(p.id)} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg hover:bg-green-100">Approve</button>
                        <button onClick={() => reject(p.id)} className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100">Reject</button>
                      </>}
                      {p.status === 'ACTIVE' && (
                        <button onClick={() => reject(p.id)} className="px-3 py-1.5 bg-gray-50 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-100">Archive</button>
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
