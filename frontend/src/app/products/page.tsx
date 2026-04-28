'use client';

export const dynamic = 'force-dynamic';

import React, { Suspense, useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, X, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/ui/ProductCard';
import { productsApi, categoriesApi } from '@/lib/api';
import { Product, Category } from '@/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

const PAGE_SIZE = 20;

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');

  const search = searchParams.get('search') ?? '';
  const category = searchParams.get('category') ?? '';
  const sort = searchParams.get('sort') ?? 'newest';
  const page = Number(searchParams.get('page') ?? 1);
  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';

  useEffect(() => {
    setPriceMin(minPrice);
    setPriceMax(maxPrice);
  }, [minPrice, maxPrice]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await productsApi.list({
        search, category, sort, page,
        limit: PAGE_SIZE,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
      });
      setProducts(data.data.items);
      setTotal(data.data.meta.total);
    } catch { setProducts([]); }
    finally { setLoading(false); }
  }, [search, category, sort, page, minPrice, maxPrice]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    categoriesApi.list().then(({ data }) => setCategories(data.data ?? []));
  }, []);

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (priceMin) params.set('minPrice', priceMin); else params.delete('minPrice');
    if (priceMax) params.set('maxPrice', priceMax); else params.delete('maxPrice');
    params.delete('page');
    router.push(`/products?${params.toString()}`);
  };

  const clearAllFilters = () => {
    setPriceMin('');
    setPriceMax('');
    router.push('/products');
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasActiveFilters = !!(category || search || minPrice || maxPrice);

  // Active filter chips
  const activeChips: { label: string; key: string; value: string }[] = [];
  if (category) activeChips.push({ label: category.replace(/-/g, ' '), key: 'category', value: '' });
  if (search) activeChips.push({ label: `"${search}"`, key: 'search', value: '' });
  if (minPrice) activeChips.push({ label: `Min Rs. ${minPrice}`, key: 'minPrice', value: '' });
  if (maxPrice) activeChips.push({ label: `Max Rs. ${maxPrice}`, key: 'maxPrice', value: '' });

  return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900">
              {search ? `Results for "${search}"` : category ? `${category.replace(/-/g, ' ')}` : 'All Products'}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {loading ? 'Loading...' : `${total.toLocaleString()} products found`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors sm:hidden"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-blue-500" />}
            </button>
            <select
              value={sort}
              onChange={(e) => updateParam('sort', e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Active filter chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs text-gray-500 font-medium">Active filters:</span>
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => updateParam(chip.key, chip.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full hover:bg-blue-100 transition-colors border border-blue-100"
              >
                {chip.label}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-full transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className={`${filtersOpen ? 'block' : 'hidden'} sm:block sm:w-56 flex-shrink-0`}>
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">Filters</h3>
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-600 font-medium">
                    Clear all
                  </button>
                )}
              </div>

              {/* Categories */}
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Category</p>
                <div className="space-y-0.5">
                  <button
                    onClick={() => updateParam('category', '')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${!category ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => updateParam('category', cat.slug)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between ${category === cat.slug ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>{cat.name}</span>
                      {cat._count && (
                        <span className="text-xs text-gray-400 tabular-nums">{cat._count.products}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Price Range</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Min (Rs.)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={priceMin}
                        onChange={(e) => setPriceMin(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">Max (Rs.)</label>
                      <input
                        type="number"
                        placeholder="∞"
                        value={priceMax}
                        onChange={(e) => setPriceMax(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                    </div>
                  </div>
                  <button
                    onClick={applyPriceFilter}
                    className="w-full py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>

                {/* Quick price presets */}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {[['0', '500'], ['500', '1000'], ['1000', '2000'], ['2000', '']].map(([min, max]) => (
                    <button
                      key={`${min}-${max}`}
                      onClick={() => {
                        const params = new URLSearchParams(searchParams.toString());
                        if (min) params.set('minPrice', min); else params.delete('minPrice');
                        if (max) params.set('maxPrice', max); else params.delete('maxPrice');
                        params.delete('page');
                        router.push(`/products?${params.toString()}`);
                      }}
                      className="px-2 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {max ? `Rs.${min}–${max}` : `Rs.${min}+`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-2xl aspect-[3/4] animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center text-4xl mb-5">🔍</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">No products found</h3>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your search or filters</p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-colors text-sm"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {products.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <button
                      onClick={() => updateParam('page', String(page - 1))}
                      disabled={page <= 1}
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      let p2: number;
                      if (totalPages <= 7) p2 = i + 1;
                      else if (page <= 4) p2 = i + 1;
                      else if (page >= totalPages - 3) p2 = totalPages - 6 + i;
                      else p2 = page - 3 + i;
                      return p2;
                    }).map((p2) => (
                      <button
                        key={p2}
                        onClick={() => updateParam('page', String(p2))}
                        className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${page === p2 ? 'bg-gray-900 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                      >
                        {p2}
                      </button>
                    ))}

                    <button
                      onClick={() => updateParam('page', String(page + 1))}
                      disabled={page >= totalPages}
                      className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ProductsContent />
    </Suspense>
  );
}
