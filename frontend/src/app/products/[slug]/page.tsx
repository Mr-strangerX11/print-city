'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Heart, Star, ChevronLeft, Minus, Plus, Check, Share2, Truck, Shield, RefreshCw, ZoomIn } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/ui/ProductCard';
import { productsApi } from '@/lib/api';
import { getErrorMsg } from '@/lib/utils';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { Product, ProductVariant } from '@/types';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

function StarRating({ value, count }: { value: number; count: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-4 h-4 ${i <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`} />
        ))}
      </div>
      <span className="text-sm font-bold text-gray-700">{value.toFixed(1)}</span>
      <span className="text-sm text-gray-400">({count} {count === 1 ? 'review' : 'reviews'})</span>
    </div>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { isInWishlist, toggle: toggleWishlist, pending: wishlistPending } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    productsApi.get(slug).then(({ data }) => {
      const p = data.data as Product;
      setProduct(p);
      const variant = p?.variants?.[0];
      if (variant) {
        setSelectedColor(variant.color);
        setSelectedSize(variant.size);
      }
      // Fetch related products in same category
      if (p?.category?.slug) {
        productsApi.list({ category: p.category.slug, limit: 4, status: 'ACTIVE' })
          .then(({ data: r }) => {
            const items: Product[] = r.data.items ?? [];
            setRelated(items.filter(item => item.id !== p.id).slice(0, 4));
          })
          .catch(() => {});
      }
    }).catch(() => setProduct(null))
    .finally(() => setLoading(false));
  }, [slug]);

  const avgRating = product?.reviews?.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : null;

  if (loading) return (
    <>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-3">
            <div className="aspect-square bg-gray-100 rounded-3xl animate-pulse" />
            <div className="flex gap-2">
              {[1,2,3].map(i => <div key={i} className="w-20 h-20 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          </div>
          <div className="space-y-4 pt-4">
            {[200, 140, 60, 100, 80, 160].map((w, i) => (
              <div key={i} className="h-6 bg-gray-100 rounded-xl animate-pulse" style={{ width: `${w}px` }} />
            ))}
          </div>
        </div>
      </div>
    </>
  );

  if (!product) return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-64 text-center py-20">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Product not found</h2>
        <button onClick={() => router.push('/products')} className="mt-4 text-blue-600 hover:text-blue-700 font-medium">
          Browse Products →
        </button>
      </div>
    </>
  );

  const colors = [...new Set(product.variants?.map(v => v.color) ?? [])];
  const sizesForColor = product.variants?.filter(v => v.color === selectedColor).map(v => v.size) ?? [];
  const selectedVariant = product.variants?.find(v => v.color === selectedColor && v.size === selectedSize);

  const handleAddToCart = async () => {
    if (!user) { router.push('/login'); return; }
    if (!selectedVariant) { toast.error('Please select size and color'); return; }
    if (selectedVariant.stock < qty) { toast.error(`Only ${selectedVariant.stock} available`); return; }
    setAddingToCart(true);
    try {
      await addItem(selectedVariant.id, qty);
      toast.success('Added to cart!');
    } catch (err: any) {
      toast.error(getErrorMsg(err, 'Failed to add to cart'));
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.title, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    }
  };

  const currentImage = product.images?.[selectedImage]?.url
    ?? 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800';

  return (
    <>
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 pt-5 pb-0">
        <nav className="flex items-center gap-1.5 text-sm text-gray-400">
          <Link href="/" className="hover:text-gray-600 transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-gray-600 transition-colors">Products</Link>
          {product.category && <>
            <span>/</span>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-gray-600 transition-colors capitalize">
              {product.category.name}
            </Link>
          </>}
          <span>/</span>
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{product.title}</span>
        </nav>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Image Gallery ───────────────────────────────────── */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gray-50 group cursor-zoom-in"
              onClick={() => setZoomOpen(true)}>
              <Image
                src={currentImage}
                alt={product.title}
                fill unoptimized className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-9 h-9 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center shadow-sm">
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              {product.images && product.images.length > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/40 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {selectedImage + 1} / {product.images.length}
                </div>
              )}
            </div>
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button key={img.id} onClick={() => setSelectedImage(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all hover:opacity-100 ${i === selectedImage ? 'border-gray-900 shadow-md' : 'border-transparent opacity-70 hover:border-gray-300'}`}>
                    <Image src={img.url} alt="" fill unoptimized className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Details ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-2">
              <div className="min-w-0">
                <p className="text-sm text-gray-400 mb-1">
                  <Link href={`/vendors/${product.vendor?.storeSlug}`} className="hover:text-blue-600 transition-colors font-medium">
                    {product.vendor?.storeName}
                  </Link>
                  {product.category && <> · <span className="capitalize">{product.category.name}</span></>}
                </p>
                <h1 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">{product.title}</h1>
              </div>
              <button onClick={handleShare}
                className="flex-shrink-0 w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                <Share2 className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Rating */}
            {avgRating !== null && product._count && product._count.reviews > 0 && (
              <div className="mb-4">
                <StarRating value={avgRating} count={product._count.reviews} />
              </div>
            )}

            <p className="text-3xl font-black text-gray-900 mb-5">
              {formatPrice(selectedVariant?.price ?? product.basePrice)}
            </p>

            {product.description && (
              <p className="text-gray-500 text-sm leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {product.tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Color Picker */}
            {colors.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-bold text-gray-800 mb-2.5">
                  Color: <span className="text-gray-500 font-normal">{selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button key={color} onClick={() => { setSelectedColor(color); setSelectedSize(''); }}
                      className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${selectedColor === color ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Picker */}
            {sizesForColor.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-bold text-gray-800 mb-2.5">
                  Size: <span className="text-gray-500 font-normal">{selectedSize || 'Select a size'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {sizesForColor.map((size) => {
                    const v = product.variants?.find(v => v.color === selectedColor && v.size === size);
                    const outOfStock = v ? v.stock === 0 : true;
                    return (
                      <button key={size} onClick={() => !outOfStock && setSelectedSize(size)} disabled={outOfStock}
                        className={`relative w-14 h-12 rounded-xl text-sm font-semibold border-2 transition-all ${selectedSize === size ? 'border-gray-900 bg-gray-900 text-white' : outOfStock ? 'border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50' : 'border-gray-200 text-gray-700 hover:border-gray-500'}`}>
                        {size}
                        {outOfStock && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="w-full h-px bg-gray-300 rotate-45 absolute" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedVariant && (
                  <p className="text-xs text-gray-400 mt-2">
                    {selectedVariant.stock > 5
                      ? `${selectedVariant.stock} in stock`
                      : selectedVariant.stock > 0
                      ? <span className="text-orange-500 font-medium">Only {selectedVariant.stock} left!</span>
                      : <span className="text-red-500 font-medium">Out of stock</span>
                    }
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div className="flex items-center gap-4 mb-6">
              <p className="text-sm font-bold text-gray-800">Quantity:</p>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setQty(Math.max(1, qty - 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center text-sm font-black">{qty}</span>
                <button onClick={() => setQty(Math.min(selectedVariant?.stock ?? 99, qty + 1))}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition-colors">
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {selectedVariant && qty > 1 && (
                <span className="text-sm text-gray-500">
                  Total: <span className="font-bold text-gray-900">{formatPrice(Number(selectedVariant.price) * qty)}</span>
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <button onClick={handleAddToCart} disabled={addingToCart || !selectedVariant || !selectedSize}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] shadow-sm">
                {addingToCart
                  ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <ShoppingCart className="w-5 h-5" />
                }
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
              <button
                onClick={async () => {
                  if (!user) { toast.error('Sign in to save to wishlist'); return; }
                  await toggleWishlist(product.id);
                }}
                disabled={wishlistPending.includes(product.id)}
                className="w-14 h-14 flex items-center justify-center border-2 border-gray-200 rounded-2xl hover:bg-red-50 hover:border-red-200 transition-colors group disabled:opacity-50"
              >
                <Heart className={`w-5 h-5 transition-colors ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'}`} />
              </button>
            </div>

            {/* Guarantee / Trust */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { icon: <Truck className="w-4 h-4 text-blue-500" />, text: 'Free shipping over Rs. 2,000' },
                { icon: <RefreshCw className="w-4 h-4 text-green-500" />, text: '30-day easy returns' },
                { icon: <Shield className="w-4 h-4 text-purple-500" />, text: 'Quality guaranteed' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                  {item.icon}
                  <span className="text-xs text-gray-600 font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Product Details Accordion ─────────────────────────── */}
        <div className="mt-14 mb-12 border-t border-gray-100 pt-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-black text-gray-900 text-lg mb-4">Product Details</h3>
              <dl className="space-y-2.5">
                {[
                  { label: 'Category', value: product.category?.name ?? '—' },
                  { label: 'Available Colors', value: colors.join(', ') || '—' },
                  { label: 'Available Sizes', value: [...new Set(product.variants?.map(v => v.size) ?? [])].join(', ') || '—' },
                  { label: 'Vendor', value: product.vendor?.storeName ?? '—' },
                  { label: 'SKU', value: selectedVariant?.sku ?? product.id.slice(-8).toUpperCase() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex gap-4 py-2 border-b border-gray-50">
                    <dt className="text-sm text-gray-500 w-36 flex-shrink-0">{label}</dt>
                    <dd className="text-sm text-gray-900 font-medium capitalize">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg mb-4">Printing & Materials</h3>
              <div className="space-y-3 text-sm text-gray-600">
                {[
                  { icon: '🎨', text: 'High-resolution DTG (Direct-to-Garment) printing' },
                  { icon: '👕', text: 'Premium 100% ringspun cotton base material' },
                  { icon: '🌈', text: 'Vibrant, wash-resistant colors that last for years' },
                  { icon: '📏', text: 'Pre-shrunk and true-to-size sizing' },
                  { icon: '🌿', text: 'Eco-friendly inks, safe for all skin types' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="text-lg leading-none mt-0.5">{icon}</span>
                    <p>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews ──────────────────────────────────────────── */}
        {product.reviews && product.reviews.length > 0 && (
          <div className="mb-14 border-t border-gray-100 pt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">Customer Reviews</h2>
              {avgRating !== null && (
                <div className="text-right">
                  <p className="text-4xl font-black text-gray-900">{avgRating.toFixed(1)}</p>
                  <StarRating value={avgRating} count={product._count?.reviews ?? 0} />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.reviews.map((r) => (
                <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-black">
                        {r.user.name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{r.user.name}</p>
                        <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-100 text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 leading-relaxed">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Related Products ──────────────────────────────────── */}
        {related.length > 0 && (
          <div className="border-t border-gray-100 pt-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-gray-900">You Might Also Like</h2>
              {product.category && (
                <Link href={`/products?category=${product.category.slug}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                  More {product.category.name} →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      {/* Zoom Modal */}
      {zoomOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setZoomOpen(false)}>
          <div className="relative max-w-3xl w-full aspect-square" onClick={(e) => e.stopPropagation()}>
            <Image src={currentImage} alt={product.title} fill unoptimized className="object-contain" />
          </div>
          <button onClick={() => setZoomOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
            ✕
          </button>
        </div>
      )}

      <Footer />
    </>
  );
}
