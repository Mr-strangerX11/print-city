'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, Check, X, Move, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { uploadsApi, customDesignApi } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatPrice, getErrorMsg } from '@/lib/utils';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';


const PRODUCT_TYPES = [
  { id: 't-shirt',    label: 'T-Shirt',    emoji: '👕', basePrice: 799,  mockupBg: '#f3f4f6', printArea: { x: 25, y: 20, w: 50, h: 45 } },
  { id: 'hoodie',     label: 'Hoodie',     emoji: '🧥', basePrice: 1499, mockupBg: '#e5e7eb', printArea: { x: 22, y: 18, w: 56, h: 40 } },
  { id: 'mug',        label: 'Mug',        emoji: '☕', basePrice: 599,  mockupBg: '#f9fafb', printArea: { x: 25, y: 22, w: 50, h: 38 } },
  { id: 'poster',     label: 'Poster',     emoji: '🖼️', basePrice: 399,  mockupBg: '#ffffff', printArea: { x: 10, y: 10, w: 80, h: 80 } },
  { id: 'phone-case', label: 'Phone Case', emoji: '📱', basePrice: 499,  mockupBg: '#f8fafc', printArea: { x: 30, y: 20, w: 40, h: 60 } },
];

const COLORS = ['White', 'Black', 'Navy', 'Gray', 'Red', 'Forest Green'];
const SIZES  = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const STEPS  = ['upload', 'customize', 'review'] as const;

// ── Drag-and-resize preview (pure CSS/pointer events — no Konva) ───────────────
function DesignPreview({ src, product }: { src: string; product: typeof PRODUCT_TYPES[0] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 25, y: 25, w: 50, h: 50 });
  const drag   = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resize = useRef<{ sx: number; sy: number; ow: number; oh: number } | null>(null);

  const startDrag = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
  };
  const moveDrag = (e: React.PointerEvent) => {
    if (!drag.current || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.sx) / width)  * 100;
    const dy = ((e.clientY - drag.current.sy) / height) * 100;
    setPos(p => ({
      ...p,
      x: Math.max(0, Math.min(100 - p.w, drag.current!.ox + dx)),
      y: Math.max(0, Math.min(100 - p.h, drag.current!.oy + dy)),
    }));
  };

  const startResize = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    resize.current = { sx: e.clientX, sy: e.clientY, ow: pos.w, oh: pos.h };
  };
  const moveResize = (e: React.PointerEvent) => {
    if (!resize.current || !containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const dw = ((e.clientX - resize.current.sx) / width)  * 100;
    const dh = ((e.clientY - resize.current.sy) / height) * 100;
    setPos(p => ({
      ...p,
      w: Math.max(10, Math.min(100 - p.x, resize.current!.ow + dw)),
      h: Math.max(10, Math.min(100 - p.y, resize.current!.oh + dh)),
    }));
  };

  const pa = product.printArea;

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl overflow-hidden select-none"
      style={{ aspectRatio: '1/1', background: product.mockupBg, border: '1px solid #e5e7eb' }}
    >
      <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full pointer-events-none">
        {product.emoji} {product.label}
      </div>

      {/* Print-area guide */}
      <div className="absolute border-2 border-dashed border-blue-400/50 rounded pointer-events-none z-10"
        style={{ left: `${pa.x}%`, top: `${pa.y}%`, width: `${pa.w}%`, height: `${pa.h}%` }} />

      {/* Draggable image */}
      <div
        onPointerDown={startDrag}
        onPointerMove={e => { moveDrag(e); moveResize(e); }}
        onPointerUp={() => { drag.current = null; resize.current = null; }}
        className="absolute z-20 cursor-move group"
        style={{ left: `${pos.x}%`, top: `${pos.y}%`, width: `${pos.w}%`, height: `${pos.h}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Design" className="w-full h-full object-contain" draggable={false} />

        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-black/40 rounded-lg p-1.5">
            <Move className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Resize handle */}
        <div
          onPointerDown={startResize}
          className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-30 flex items-center justify-center"
        >
          <div className="w-3.5 h-3.5 bg-white border-2 border-blue-500 rounded-sm shadow" />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function DesignStudioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // All hooks before any conditional return
  const [step, setStep]           = useState<typeof STEPS[number]>('upload');
  const [designUrl, setDesignUrl] = useState<string | null>(null);
  const [publicId, setPublicId]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [product, setProduct]     = useState(PRODUCT_TYPES[0]);
  const [color, setColor]         = useState(COLORS[0]);
  const [size, setSize]           = useState(SIZES[2]);
  const [qty, setQty]             = useState(1);
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/design-studio');
    }
  }, [user, loading, router]);

  const onDrop = useCallback(async (accepted: File[]) => {
    const file = accepted[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large — maximum 10 MB');
      return;
    }
    setUploading(true);
    try {
      const { data } = await uploadsApi.upload(file);
      const res = data?.data;
      if (!res?.secure_url) throw new Error('Server did not return an image URL');
      setDesignUrl(res.secure_url);
      setPublicId(res.public_id ?? '');
      setStep('customize');
      toast.success('Design uploaded!');
    } catch (err: any) {
      toast.error(getErrorMsg(err, 'Upload failed — please try again'));
    } finally {
      setUploading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.webp'] },
    maxFiles: 1,
    disabled: uploading,
  });

  const total = product.basePrice * qty;

  const handleSubmit = async () => {
    if (!designUrl) return;
    setSubmitting(true);
    try {
      await customDesignApi.create({
        productType: product.id,
        designUrl,
        publicId,
        notes,
        size,
        color,
        qty,
      });
      toast.success("Order submitted! We'll review your design shortly.");
      // Redirect based on role
      const dest =
        user?.role === 'ADMIN'  ? '/admin/custom-orders' :
        user?.role === 'VENDOR' ? '/vendor/dashboard'    :
                                   '/dashboard/orders';
      router.push(dest);
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  // Auth gate (after all hooks)
  if (loading || !user) return null;

  const stepIdx = STEPS.indexOf(step);

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: 'var(--page-bg)' }}>

        {/* Hero bar */}
        <div className="bg-brand-ink border-b border-white/5">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex items-center gap-4">
            <Link href="/products"
              className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Back
            </Link>
            <div className="h-4 w-px bg-white/10" />
            <div>
              <h1 className="text-white font-black text-lg leading-none">Custom Design Studio</h1>
              <p className="text-gray-400 text-xs mt-0.5">Upload your artwork · we print &amp; deliver</p>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <React.Fragment key={s}>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  step === s    ? 'bg-gray-900 text-white shadow-sm' :
                  stepIdx > i   ? 'bg-green-100 text-green-700' :
                                  'bg-white border border-gray-200 text-gray-400'
                }`}>
                  {stepIdx > i
                    ? <Check className="w-4 h-4" />
                    : <span className="w-5 h-5 rounded-full border-2 border-current flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  }
                  <span className="capitalize hidden sm:block">{s}</span>
                </div>
                {i < 2 && (
                  <div className={`flex-1 h-0.5 rounded-full ${stepIdx > i ? 'bg-gray-900' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── STEP 1: Upload ── */}
          {step === 'upload' && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-8 sm:p-14 text-center cursor-pointer transition-all ${
                  uploading    ? 'border-blue-300 bg-blue-50 cursor-not-allowed' :
                  isDragActive ? 'border-blue-500 bg-blue-50 scale-[1.01]' :
                                 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <Loader2 className="w-14 h-14 text-blue-500 animate-spin" />
                    </div>
                    <div>
                      <p className="text-gray-700 font-bold">Uploading your design…</p>
                      <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-5">
                    <div className="w-20 h-20 rounded-3xl bg-blue-50 flex items-center justify-center">
                      <Upload className="w-10 h-10 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-gray-900">
                        {isDragActive ? 'Drop it here!' : 'Drag & drop your design'}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        or <span className="text-blue-600 font-semibold underline underline-offset-2">click to browse</span>
                      </p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                      {['PNG', 'JPG', 'SVG', 'WebP'].map(f => (
                        <span key={f} className="px-2.5 py-1 bg-gray-100 rounded-lg font-medium">{f}</span>
                      ))}
                      <span className="px-2.5 py-1 bg-gray-100 rounded-lg font-medium">Max 10 MB</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: '🎯', title: 'High Resolution', desc: '300 DPI or higher for sharp prints' },
                  { icon: '✨', title: 'Transparent Background', desc: 'PNG with alpha works best on garments' },
                  { icon: '🎨', title: 'CMYK Colors', desc: 'Convert RGB→CMYK for accurate color output' },
                ].map(tip => (
                  <div key={tip.title} className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                    <span className="text-xl flex-shrink-0">{tip.icon}</span>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{tip.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Customize ── */}
          {step === 'customize' && designUrl && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
                <div>
                  <h2 className="font-black text-gray-900 text-lg">Live Preview</h2>
                  <p className="text-xs text-gray-400">Drag to move · corner handle to resize</p>
                </div>
                <DesignPreview src={designUrl} product={product} />
                <button
                  onClick={() => { setDesignUrl(null); setPublicId(null); setStep('upload'); }}
                  className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Remove & re-upload
                </button>
              </div>

              {/* Options */}
              <div className="space-y-4">
                {/* Product type */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Product Type</h3>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PRODUCT_TYPES.map(p => (
                      <button key={p.id} onClick={() => setProduct(p)}
                        className={`flex flex-col items-center gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-xl border-2 transition-all ${
                          product.id === p.id
                            ? 'border-gray-900 bg-gray-50 shadow-sm'
                            : 'border-gray-100 hover:border-gray-300'
                        }`}>
                        <span className="text-2xl">{p.emoji}</span>
                        <span className="font-semibold text-xs text-gray-800">{p.label}</span>
                        <span className="text-[11px] text-gray-400">Rs.{p.basePrice}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-3">
                    Color: <span className="font-normal text-gray-500">{color}</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map(c => (
                      <button key={c} onClick={() => setColor(c)}
                        className={`px-3 py-1.5 rounded-lg text-sm border-2 font-medium transition-all ${
                          color === c
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Size</h3>
                  <div className="flex flex-wrap gap-2">
                    {SIZES.map(s => (
                      <button key={s} onClick={() => setSize(s)}
                        className={`w-14 h-10 rounded-xl text-sm border-2 font-semibold transition-all ${
                          size === s
                            ? 'border-gray-900 bg-gray-900 text-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-3">Quantity</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1">
                      <button onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 font-bold text-gray-700 text-lg transition-colors">
                        −
                      </button>
                      <span className="w-10 text-center font-black text-gray-900">{qty}</span>
                      <button onClick={() => setQty(q => q + 1)}
                        className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 font-bold text-gray-700 text-lg transition-colors">
                        +
                      </button>
                    </div>
                    <div>
                      <span className="text-2xl font-black text-gray-900">{formatPrice(total)}</span>
                      {qty > 1 && (
                        <span className="ml-2 text-sm text-gray-400">({formatPrice(product.basePrice)} each)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h3 className="font-bold text-gray-900 mb-3">
                    Special Notes <span className="font-normal text-gray-400 text-sm">(optional)</span>
                  </h3>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Placement instructions, color preferences, or anything else our team should know…"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <button
                  onClick={() => setStep('review')}
                  className="w-full py-4 bg-brand-gradient text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all shadow-md shadow-blue-500/20">
                  Continue to Review →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Review ── */}
          {step === 'review' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h2 className="font-black text-gray-900 text-lg">Order Review</h2>

                {designUrl && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={designUrl} alt="Design"
                      className="w-16 h-16 rounded-xl object-contain bg-white border border-gray-100 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900">Your Design</p>
                      <p className="text-sm text-gray-400">Will be reviewed within 24 hours</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Product',  value: `${product.emoji} ${product.label}` },
                    { label: 'Color',    value: color },
                    { label: 'Size',     value: size },
                    { label: 'Quantity', value: `${qty} unit${qty !== 1 ? 's' : ''}` },
                  ].map(row => (
                    <div key={row.label} className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-400 mb-0.5">{row.label}</p>
                      <p className="font-semibold text-gray-900 text-sm">{row.value}</p>
                    </div>
                  ))}
                </div>

                {notes && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-600 font-bold mb-1">Special Notes</p>
                    <p className="text-sm text-gray-700">{notes}</p>
                  </div>
                )}

                <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Unit price</span><span>{formatPrice(product.basePrice)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>Quantity</span><span>× {qty}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between font-black text-gray-900">
                    <span>Estimated Total</span><span>{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
                  📋 Our team reviews your design and confirms the final price within 24 hours before any charge.
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep('customize')}
                    className="flex-1 py-3 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
                    ← Edit
                  </button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Submitting…' : 'Submit Order'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-black text-gray-900 mb-5">What Happens Next?</h3>
                <div className="space-y-5">
                  {[
                    { icon: '🔍', title: 'Design Review',      desc: 'Our print team checks quality & printability within 24 hours.' },
                    { icon: '💰', title: 'Price Confirmation',  desc: "We confirm the final price and send you a secure payment link." },
                    { icon: '🖨️', title: 'Production',          desc: 'Once paid, we print your order using premium inks on quality materials.' },
                    { icon: '📦', title: 'Delivery',             desc: 'Packaged and shipped to your door in 3–7 business days.' },
                  ].map(item => (
                    <div key={item.title} className="flex gap-3">
                      <span className="text-xl flex-shrink-0 mt-0.5">{item.icon}</span>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
