'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Package } from 'lucide-react';
import { productsApi } from '@/lib/api';
import { Product } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function VendorDesignsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.list({ limit: 50 }).then(({ data }) => setProducts(data.data.items ?? [])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">My Designs</h1>
        <Link href="/vendor/designs/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
          <Plus className="w-4 h-4" /> New Design
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
          <Package className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">No designs yet</h3>
          <p className="text-sm text-gray-500 mb-6">Start uploading your designs to earn commissions</p>
          <Link href="/vendor/designs/new" className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl">Upload Design</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
              <div className="relative aspect-square bg-gray-50">
                <Image
                  src={p.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'}
                  alt={p.title} fill unoptimized className="object-cover" sizes="25vw"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{p.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <StatusBadge status={p.status} type="custom" />
                  <p className="font-bold text-gray-900 text-sm">{formatPrice(p.basePrice)}</p>
                </div>
                <p className="text-xs text-gray-400 mt-1">{formatDate(p.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
