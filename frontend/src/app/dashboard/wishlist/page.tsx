'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { wishlistApi, cartApi } from '@/lib/api';
import { useWishlist } from '@/context/WishlistContext';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    title: string;
    slug: string;
    basePrice: string | number;
    images: { url: string }[];
    variants: { price: string | number; color: string; size: string }[];
    vendor: { storeName: string; storeSlug: string } | null;
    category: { name: string } | null;
  };
}

export default function WishlistPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { toggle, refresh: refreshWishlist } = useWishlist();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await wishlistApi.get();
      setItems(data.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (productId: string) => {
    await toggle(productId);
    setItems(prev => prev.filter(i => i.productId !== productId));
    toast.success('Removed from wishlist');
  };

  const handleAddToCart = async (item: WishlistItem) => {
    const firstVariant = item.product.variants?.[0];
    if (!firstVariant) {
      toast.error('No variants available');
      return;
    }
    setAddingToCart(item.productId);
    try {
      // We need a variantId — fetch from products for now
      toast.info('Visit the product page to select size & color');
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-100 rounded-xl w-40 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-5">
          <Heart className="w-9 h-9 text-red-300" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-6">
          Save products you love by clicking the heart icon. They'll appear here for easy access.
        </p>
        <Link href="/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">
          Browse Products <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Wishlist</h1>
          <p className="text-gray-500 mt-0.5 text-sm">{items.length} saved {items.length === 1 ? 'item' : 'items'}</p>
        </div>
        <Link href="/products" className="text-sm text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
          Continue shopping <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map(item => {
          const image = item.product.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400';
          const minPrice = item.product.variants?.length
            ? Math.min(...item.product.variants.map(v => Number(v.price)))
            : Number(item.product.basePrice);
          const colors = [...new Set(item.product.variants?.map(v => v.color) ?? [])];

          return (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all group">
              <div className="flex gap-0">
                {/* Image */}
                <Link href={`/products/${item.product.slug}`} className="relative w-36 flex-shrink-0">
                  <Image
                    src={image}
                    alt={item.product.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="144px"
                  />
                </Link>

                {/* Info */}
                <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400 truncate">{item.product.vendor?.storeName}</p>
                    <Link href={`/products/${item.product.slug}`}>
                      <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 hover:text-blue-600 transition-colors mt-0.5">
                        {item.product.title}
                      </h3>
                    </Link>
                    {item.product.category && (
                      <span className="inline-block mt-1.5 text-[11px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                        {item.product.category.name}
                      </span>
                    )}
                    {colors.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1.5">
                        {colors.slice(0, 3).join(', ')}{colors.length > 3 ? ` +${colors.length - 3}` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <p className="font-black text-gray-900">{formatPrice(minPrice)}</p>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        Add to Cart
                      </Link>
                      <button
                        onClick={() => handleRemove(item.productId)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
