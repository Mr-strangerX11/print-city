'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Star, ShoppingCart, Eye } from 'lucide-react';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  className?: string;
}

const COLOR_MAP: Record<string, string> = {
  white: '#f9fafb',
  black: '#111827',
  red: '#ef4444',
  blue: '#3b82f6',
  navy: '#1e3a5f',
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  pink: '#ec4899',
  purple: '#a855f7',
  gray: '#9ca3af',
  grey: '#9ca3af',
  brown: '#92400e',
  beige: '#d4b896',
  cream: '#fdf8ee',
  teal: '#14b8a6',
  cyan: '#06b6d4',
};

function resolveColor(color: string): string {
  return COLOR_MAP[color.toLowerCase()] ?? color.toLowerCase();
}

function avgRating(reviews: Product['reviews']): number | null {
  if (!reviews || reviews.length === 0) return null;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const { user } = useAuth();
  const { isInWishlist, toggle } = useWishlist();
  const wished = isInWishlist(product.id);

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Sign in to save items to your wishlist'); return; }
    await toggle(product.id);
    toast.success(wished ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const image = product.images?.[0]?.url ?? `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400`;
  const minPrice = product.variants?.length
    ? Math.min(...product.variants.map((v) => Number(v.price)))
    : Number(product.basePrice);
  const colors = [...new Set(product.variants?.map((v) => v.color) ?? [])].slice(0, 5);
  const extraColors = (product.variants?.length ?? 0) > 5 ? (product.variants!.length - 5) : 0;
  const avg = product.reviews ? avgRating(product.reviews) : null;
  const reviewCount = product._count?.reviews ?? 0;

  const isNew = product.createdAt &&
    (new Date().getTime() - new Date(product.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 ${className}`}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Image
          src={image}
          alt={product.title}
          fill
          unoptimized
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {isNew && (
            <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-sm">NEW</span>
          )}
          {product.status !== 'ACTIVE' && (
            <span className="px-2 py-0.5 bg-gray-800/80 text-white text-[10px] font-bold rounded-full">OUT OF STOCK</span>
          )}
        </div>

        {/* Hover actions */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleWishlist}
            className={`w-8 h-8 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 transition-all ${wished ? 'bg-red-50' : 'hover:bg-red-50'}`}
            title={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart className={`w-3.5 h-3.5 transition-colors ${wished ? 'fill-red-500 text-red-500' : 'text-gray-500 hover:text-red-500'}`} />
          </button>
          <button
            onClick={(e) => e.preventDefault()}
            className="w-8 h-8 rounded-full bg-white/95 backdrop-blur flex items-center justify-center shadow-sm hover:scale-110 hover:bg-blue-50 transition-all"
            title="Quick view"
          >
            <Eye className="w-3.5 h-3.5 text-gray-500 hover:text-blue-500 transition-colors" />
          </button>
        </div>

        {/* Quick add overlay */}
        <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center justify-center gap-1.5 m-2">
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-900/90 backdrop-blur text-white text-xs font-semibold rounded-xl hover:bg-gray-900 transition-colors">
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>View Product</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-xs text-gray-400 mb-1 truncate">{product.vendor?.storeName}</p>
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors mb-2">
          {product.title}
        </h3>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {colors.map((color) => (
              <div
                key={color}
                title={color}
                className="w-4 h-4 rounded-full border border-gray-200 shadow-sm"
                style={{ backgroundColor: resolveColor(color) }}
              />
            ))}
            {extraColors > 0 && (
              <span className="text-[11px] text-gray-400 ml-0.5">+{extraColors}</span>
            )}
          </div>
        )}

        {/* Rating */}
        {reviewCount > 0 && (
          <div className="flex items-center gap-1 mb-2">
            {avg !== null ? (
              <>
                <div className="flex">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`w-3 h-3 ${i <= Math.round(avg) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-500 font-medium">{avg.toFixed(1)}</span>
              </>
            ) : (
              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            )}
            <span className="text-xs text-gray-400">({reviewCount})</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <p className="font-black text-gray-900">{formatPrice(minPrice)}</p>
          <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{product.category?.name}</span>
        </div>
      </div>
    </Link>
  );
}
