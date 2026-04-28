'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Store, Package } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { vendorsApi } from '@/lib/api';

export default function VendorsPage() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorsApi.list({ status: 'ACTIVE' }).then(({ data }) => setVendors(data.data ?? [])).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-gray-900">Our Vendors</h1>
          <p className="text-gray-500 mt-3 max-w-md mx-auto">Discover talented designers and their unique collections</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Store className="w-12 h-12 mx-auto mb-4" />
            <p>No vendors yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {vendors.map((v: any) => (
              <Link key={v.id} href={`/vendors/${v.storeSlug}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all">
                <div className="h-28 bg-brand-gradient-subtle relative overflow-hidden">
                  {v.banner && <Image src={v.banner} alt="" fill unoptimized className="object-cover" sizes="400px" />}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
                </div>
                <div className="px-5 pb-5 -mt-8 relative">
                  <div className="w-14 h-14 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center text-2xl mb-3">
                    {v.logo ? <Image src={v.logo} alt="" width={56} height={56} unoptimized className="rounded-xl object-cover" /> : '🎨'}
                  </div>
                  <h3 className="font-black text-gray-900 group-hover:text-blue-600 transition-colors">{v.storeName}</h3>
                  {v.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{v.description}</p>}
                  <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                    <Package className="w-3.5 h-3.5" />
                    <span>{v._count?.products ?? 0} products</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
