'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Package, Star, Store, Calendar } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/ui/ProductCard';
import { vendorsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function VendorStorePage() {
  const { slug } = useParams<{ slug: string }>();
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vendorsApi.get(slug).then(({ data }) => setVendor(data.data)).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-52 bg-gray-100 rounded-3xl animate-pulse mb-8" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map(i => <div key={i} className="aspect-[3/4] bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    </>
  );

  if (!vendor) return (
    <>
      <Navbar />
      <div className="text-center py-20 text-gray-400">Vendor not found</div>
      <Footer />
    </>
  );

  const products = vendor.products ?? [];
  const productCount = vendor._count?.products ?? products.length;

  // Compute average rating from products' reviews
  let totalRating = 0;
  let ratingCount = 0;
  for (const p of products) {
    if (p.reviews?.length) {
      for (const r of p.reviews) { totalRating += r.rating; ratingCount++; }
    }
  }
  const avgRating = ratingCount > 0 ? totalRating / ratingCount : null;

  return (
    <>
      <Navbar />

      {/* Store Header */}
      <div className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden border-2 border-white/20">
              {vendor.logo ? (
                <Image src={vendor.logo} alt={vendor.storeName} width={80} height={80} className="object-cover w-full h-full" unoptimized />
              ) : (
                <span className="text-4xl">🎨</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-black text-white">{vendor.storeName}</h1>
                {vendor.status === 'ACTIVE' && (
                  <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                    Verified Seller
                  </span>
                )}
              </div>
              {vendor.description && (
                <p className="text-gray-300 mt-2 max-w-2xl text-sm leading-relaxed">{vendor.description}</p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-4 flex-wrap">
                <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                  <Package className="w-4 h-4 text-gray-500" />
                  <span><strong className="text-white">{productCount}</strong> products</span>
                </div>
                {avgRating !== null && (
                  <div className="flex items-center gap-1.5 text-gray-400 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span><strong className="text-white">{avgRating.toFixed(1)}</strong> avg rating</span>
                    <span className="text-gray-600">({ratingCount} {ratingCount === 1 ? 'review' : 'reviews'})</span>
                  </div>
                )}
                {vendor.createdAt && (
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {formatDate(vendor.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-gray-900">All Designs</h2>
          <div className="flex items-center gap-1.5 text-gray-500 text-sm">
            <Store className="w-4 h-4" />
            <span>{productCount} items</span>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-1">No products yet</h3>
            <p className="text-gray-400 text-sm">This vendor hasn't listed any products.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
