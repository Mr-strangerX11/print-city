import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight, Shield, Truck, Star, ChevronRight,
  Palette, Upload, ShoppingBag, Sparkles, Package, Users,
  Check, TrendingUp, Zap, Award, Globe, BarChart3,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

async function getHomeData() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
  try {
    const [productsRes, categoriesRes, vendorsRes] = await Promise.all([
      fetch(`${baseUrl}/products?limit=8&status=ACTIVE`, { next: { revalidate: 60 } }),
      fetch(`${baseUrl}/categories`, { next: { revalidate: 300 } }),
      fetch(`${baseUrl}/vendors?status=ACTIVE&limit=6`, { next: { revalidate: 120 } }),
    ]);
    const [products, categories, vendors] = await Promise.all([
      productsRes.ok ? productsRes.json() : null,
      categoriesRes.ok ? categoriesRes.json() : null,
      vendorsRes.ok ? vendorsRes.json() : null,
    ]);
    return {
      products: products?.data?.items ?? [],
      categories: categories?.data ?? [],
      vendors: Array.isArray(vendors?.data) ? vendors.data : (vendors?.data?.items ?? []),
    };
  } catch {
    return { products: [], categories: [], vendors: [] };
  }
}

/* ── Static data ──────────────────────────────────────────────── */

const STATIC_CATEGORIES = [
  { slug: 't-shirts',    name: 'T-Shirts',    icon: '👕', img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&h=900&fit=crop&q=85' },
  { slug: 'hoodies',     name: 'Hoodies',     icon: '🧥', img: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500&h=500&fit=crop&q=85' },
  { slug: 'mugs',        name: 'Mugs',        icon: '☕', img: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&h=500&fit=crop&q=85' },
  { slug: 'posters',     name: 'Posters',     icon: '🖼️', img: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&h=500&fit=crop&q=85' },
  { slug: 'phone-cases', name: 'Phone Cases', icon: '📱', img: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500&h=500&fit=crop&q=85' },
  { slug: 'caps',        name: 'Caps',        icon: '🧢', img: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=700&h=500&fit=crop&q=85' },
];

const CATEGORY_IMGS: Record<string, string> = {
  't-shirts':    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=700&h=900&fit=crop&q=85',
  hoodies:       'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=500&h=500&fit=crop&q=85',
  mugs:          'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&h=500&fit=crop&q=85',
  posters:       'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&h=500&fit=crop&q=85',
  'phone-cases': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500&h=500&fit=crop&q=85',
  caps:          'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=700&h=500&fit=crop&q=85',
};

const CATEGORY_ICONS: Record<string, string> = {
  't-shirts': '👕', hoodies: '🧥', mugs: '☕', posters: '🖼️',
  'phone-cases': '📱', bags: '👜', caps: '🧢', default: '🎨',
};

const TESTIMONIALS = [
  {
    name: 'Priya Sharma', role: 'Graphic Designer', location: 'Kathmandu',
    avatar: 'PS', rating: 5, color: 'from-violet-500 to-blue-500',
    text: 'Print quality is absolutely incredible. I uploaded my design and the final product exceeded every expectation. My clients keep coming back for more.',
    order: 'Custom Tee × 12', verified: true,
  },
  {
    name: 'Rahul Thapa', role: 'Business Owner', location: 'Lalitpur',
    avatar: 'RT', rating: 5, color: 'from-blue-500 to-cyan-500',
    text: 'Ordered 50 custom hoodies for my team. Delivered in 5 days, perfectly printed every single one. The vendor dashboard is a game-changer for my business.',
    order: 'Custom Hoodie × 50', verified: true,
  },
  {
    name: 'Anita Maharjan', role: 'Event Organizer', location: 'Bhaktapur',
    avatar: 'AM', rating: 5, color: 'from-cyan-500 to-teal-500',
    text: 'Used AP for all our event merchandise. The custom design studio is so intuitive — I created professional-looking prints without any design background at all.',
    order: 'Event Merch × 200', verified: true,
  },
];

const MARQUEE_ITEMS = [
  '🚀 Premium DTG Printing', '⚡ 3–5 Day Delivery', '🎨 1000+ Templates',
  '🔒 Secure Payments', '💰 Weekly Vendor Payouts', '♻️ Eco-Friendly Inks',
  '📦 Live Order Tracking', '⭐ 4.9 Customer Rating', '🌍 Print on Demand',
  '✅ Quality Guaranteed', '🎁 Custom Gifts', '📐 Perfect Sizing',
];

const VENDOR_GRADIENTS = [
  'from-violet-500 to-blue-600', 'from-blue-500 to-cyan-500', 'from-cyan-500 to-teal-500',
  'from-pink-500 to-purple-600', 'from-orange-400 to-pink-500', 'from-emerald-400 to-cyan-500',
];

const STEPS: { step: string; glow: string; bg: string; Icon: React.ElementType; title: string; cta: string; href: string; desc: string }[] = [
  {
    step: '01', glow: 'rgba(124,58,237,0.45)',
    bg: '#7C3AED,#6D28D9', Icon: Palette,
    title: 'Browse or Design', cta: 'Explore products', href: '/products',
    desc: 'Browse thousands of designs from independent creators, or bring your own artwork to life in our live design studio.',
  },
  {
    step: '02', glow: 'rgba(37,99,235,0.45)',
    bg: '#2563EB,#4338CA', Icon: Upload,
    title: 'Customize & Order', cta: 'Start designing', href: '/design-studio',
    desc: 'Pick your size, color, and quantity. Preview your design live on the product before checkout — what you see is what you get.',
  },
  {
    step: '03', glow: 'rgba(6,182,212,0.45)',
    bg: '#0891B2,#1D4ED8', Icon: Truck,
    title: 'We Print & Deliver', cta: 'See pricing', href: '/products',
    desc: 'Our expert print team takes over. Premium DTG quality, tracked nationwide delivery — right to your doorstep in 3–5 days.',
  },
];

const WHY_AP: { Icon: React.ElementType; color: string; bg: string; title: string; desc: string; stat: string }[] = [
  {
    Icon: Award, color: 'text-violet-500 dark:text-violet-400',
    bg: 'bg-violet-500/10 border-violet-500/20',
    title: 'Premium Print Quality',
    desc: 'State-of-the-art DTG printing with vibrant, long-lasting colors on every single product.',
    stat: '99.8% quality pass rate',
  },
  {
    Icon: Zap, color: 'text-yellow-500 dark:text-yellow-400',
    bg: 'bg-yellow-500/10 border-yellow-500/20',
    title: 'Lightning Fast Delivery',
    desc: '3–5 business day delivery with real-time tracking. Express options for urgent orders.',
    stat: 'Avg. 4.2 day delivery',
  },
  {
    Icon: Globe, color: 'text-blue-500 dark:text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    title: 'Nationwide Coverage',
    desc: 'We ship to every corner of Nepal. No minimums — single piece to bulk, all handled.',
    stat: '75+ delivery zones',
  },
  {
    Icon: BarChart3, color: 'text-emerald-500 dark:text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    title: 'Earn as a Vendor',
    desc: 'Upload designs, set your margin, earn weekly payouts. Zero upfront cost, zero inventory.',
    stat: 'Avg. Rs. 15,000/month',
  },
];

/* ── Page ─────────────────────────────────────────────────────── */

export default async function HomePage() {
  const { products, categories, vendors } = await getHomeData();

  const displayCategories = categories.length > 0
    ? categories.slice(0, 6).map((c: any) => ({
        ...c,
        img: CATEGORY_IMGS[c.slug] ?? CATEGORY_IMGS['t-shirts'],
        icon: CATEGORY_ICONS[c.slug] ?? CATEGORY_ICONS.default,
      }))
    : STATIC_CATEGORIES;

  return (
    <>
      <Navbar />

      <main className="min-h-screen" style={{ background: 'var(--page-bg)' }}>

        {/* ── Announcement bar ───────────────────────────────── */}
        <div className="relative overflow-hidden" style={{ background: 'linear-gradient(90deg, #7C3AED 0%, #2563EB 55%, #06B6D4 100%)' }}>
          <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-white animate-pulse-dot flex-shrink-0" />
            <p className="text-white text-xs sm:text-sm font-semibold text-center">
              🎉 <span className="font-black">Free Shipping</span> on all orders over Rs. 2,000
              <span className="mx-2 opacity-50">·</span>
              <Link href="/products" className="underline underline-offset-2 font-black hover:opacity-90 transition-opacity">Shop Now →</Link>
            </p>
          </div>
        </div>

        {/* ━━━━ 1. HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section
          className="relative overflow-hidden min-h-screen flex items-center"
          style={{
            background: 'var(--page-bg)',
            backgroundImage: `
              radial-gradient(ellipse 100% 80% at 10% 10%, var(--orb-purple) 0%, transparent 55%),
              radial-gradient(ellipse 70% 60% at 92% 85%, var(--orb-blue) 0%, transparent 55%),
              radial-gradient(ellipse 40% 40% at 55% 48%, var(--orb-cyan) 0%, transparent 60%)
            `,
          }}>

          <div className="absolute inset-0 dot-grid pointer-events-none opacity-50" />
          <div className="absolute top-[-8%] left-[-6%] w-[650px] h-[650px] rounded-full bg-purple-500/10 dark:bg-purple-700/15 blur-[180px] pointer-events-none animate-pulse-slow" />
          <div className="absolute bottom-[-6%] right-[-4%] w-[550px] h-[550px] rounded-full bg-blue-500/8 dark:bg-blue-700/12 blur-[150px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '3s' }} />

          <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-24 lg:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.08fr] gap-12 lg:gap-6 items-center">

              {/* ── Left — Copy ───────────────────────────────── */}
              <div className="reveal-up">

                {/* Live eyebrow */}
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold mb-7 backdrop-blur-sm"
                  style={{ background: 'var(--hover-bg)', border: '1px solid var(--border-color)', color: 'var(--text-body)' }}>
                  <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse-dot" />
                  Nepal&apos;s #1 Custom Print Marketplace
                  <span className="h-3.5 w-px" style={{ background: 'var(--border-color)' }} />
                  <span className="text-green-500 dark:text-green-400 font-bold">Orders shipping now</span>
                </div>

                {/* H1 */}
                <h1
                  className="font-black leading-[0.88] tracking-[-0.03em] mb-5"
                  style={{ fontSize: 'clamp(3.4rem,8.5vw,7.2rem)', color: 'var(--text-heading)' }}>
                  Design.<br />
                  <span className="shimmer-text">Print.</span><br />
                  Deliver.
                </h1>

                {/* Value prop */}
                <p
                  className="max-w-[420px] leading-relaxed mb-9"
                  style={{ fontSize: 'clamp(0.95rem,1.6vw,1.1rem)', color: 'var(--text-muted)' }}>
                  Shop unique designs from 500+ independent creators — or upload your own artwork for premium DTG printing on tees, hoodies, mugs &amp; more. Delivered nationwide in 3–5 days.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3 mb-10">
                  <Link
                    href="/design-studio"
                    className="btn-glow group inline-flex items-center gap-2.5 px-8 py-4 bg-brand-gradient text-white font-black rounded-2xl text-sm hover:opacity-95 active:scale-[0.97] transition-all">
                    <Sparkles className="w-4 h-4" />
                    Start Designing
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                  <Link
                    href="/products"
                    className="shine-hover inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-semibold text-sm transition-all"
                    style={{ border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'var(--text-body)' }}>
                    Browse Designs
                  </Link>
                </div>

                {/* Social proof row */}
                <div className="flex flex-col xs:flex-row flex-wrap gap-5 pt-7" style={{ borderTop: '1px solid var(--border-color)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400 -ml-0.5 first:ml-0" />
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-black" style={{ color: 'var(--text-heading)' }}>4.9 out of 5</p>
                      <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>2,400+ reviews</p>
                    </div>
                  </div>
                  <div className="w-px hidden xs:block" style={{ background: 'var(--border-color)' }} />
                  {[
                    { icon: <Shield className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />, label: 'Secure checkout' },
                    { icon: <Truck className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />,        label: '3–5 day delivery' },
                    { icon: <Check className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />,    label: 'Quality guaranteed' },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
                      {icon} {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Right — Hero image ────────────────────────── */}
              <div className="reveal-up reveal-up-delay-2 flex items-center justify-center lg:justify-end">
                <div className="relative w-full max-w-[600px] lg:max-w-none lg:w-[108%] lg:-mr-4 xl:-mr-10">
                  <Image
                    src="/kashi.png"
                    alt="Custom printed products — hoodies, t-shirts, mugs & phone cases"
                    width={1334}
                    height={750}
                    priority
                    className="w-full h-auto select-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━ 2. TRUST PILLARS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section style={{ background: 'var(--surface-alt)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderRight: 'none' }}>
              {[
                { icon: <Award className="w-4 h-4 text-violet-500 dark:text-violet-400" />,               label: 'Premium Quality',  sub: 'DTG printing only' },
                { icon: <Zap className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />,                  label: '3–5 Day Delivery', sub: 'Tracked nationwide' },
                { icon: <Shield className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,             label: 'Secure Payments',  sub: '100% protected' },
                { icon: <Star className="w-4 h-4 fill-amber-400 text-amber-400" />,                        label: '4.9 Rating',       sub: '2,400+ reviews' },
              ].map(({ icon, label, sub }, i) => (
                <div key={label} className="flex items-center gap-3 px-4 sm:px-8 py-5 sm:py-6"
                  style={{ borderRight: i < 3 ? '1px solid var(--border-color)' : undefined }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--hover-bg)', border: '1px solid var(--border-color)' }}>
                    {icon}
                  </div>
                  <div>
                    <p className="text-xs font-black" style={{ color: 'var(--text-heading)' }}>{label}</p>
                    <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━ 3. MARQUEE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-4 overflow-hidden marquee-fade" style={{ background: 'var(--page-bg)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex whitespace-nowrap animate-marquee">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
              <span key={i} className="inline-flex items-center gap-2.5 mx-8 text-[11px] font-semibold uppercase tracking-[0.18em]"
                style={{ color: 'var(--text-faint)' }}>
                {item}
                <span className="w-1 h-1 rounded-full mx-3 flex-shrink-0" style={{ background: 'var(--border-color)' }} />
              </span>
            ))}
          </div>
        </section>

        {/* ━━━━ 4. HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 sm:py-20 relative overflow-hidden" style={{ background: 'var(--page-bg)' }}>
          <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[400px] rounded-full blur-[130px] pointer-events-none"
            style={{ background: 'var(--orb-purple)' }} />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div className="max-w-xl mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-2 text-[11px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-[0.28em] mb-4 px-3.5 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
                <Zap className="w-3 h-3" /> How it Works
              </span>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[0.9] tracking-tight mb-4"
                style={{ color: 'var(--text-heading)' }}>
                From idea to<br />
                <span className="shimmer-text">your doorstep.</span>
              </h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Three steps. Zero complexity. Just great prints.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 relative">
              {STEPS.map((s) => (
                <div key={s.step} className="relative group">
                  <div
                    className="absolute -top-6 -left-2 text-[110px] font-black leading-none select-none pointer-events-none"
                    style={{ color: 'var(--border-subtle)' }}>{s.step}</div>

                  <div
                    className="relative w-16 h-16 rounded-[20px] flex items-center justify-center mb-7 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundImage: `linear-gradient(135deg, ${s.bg})`, boxShadow: `0 8px 36px ${s.glow}` }}>
                    <s.Icon className="w-6 h-6 text-white" />
                    <div
                      className="absolute inset-0 rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ boxShadow: `0 0 0 6px ${s.glow.replace('0.45', '0.12')}` }} />
                  </div>

                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2.5" style={{ color: 'var(--text-faint)' }}>Step {s.step}</p>
                  <h3 className="text-xl sm:text-2xl font-black mb-3 leading-tight" style={{ color: 'var(--text-heading)' }}>{s.title}</h3>
                  <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-muted)' }}>{s.desc}</p>
                  <Link href={s.href}
                    className="inline-flex items-center gap-2 text-xs font-bold transition-colors duration-200 group/l hover:text-purple-500 dark:hover:text-white"
                    style={{ color: 'var(--text-faint)' }}>
                    {s.cta} <ArrowRight className="w-3.5 h-3.5 group-hover/l:translate-x-1 transition-transform" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━ 5. CATEGORIES ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 sm:py-20" style={{ background: 'var(--surface-alt)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10 sm:mb-12">
              <div>
                <span className="inline-block text-[11px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-[0.28em] mb-3 px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">Collections</span>
                <h2 className="text-3xl sm:text-5xl font-black leading-tight" style={{ color: 'var(--text-heading)' }}>
                  Shop by<br className="sm:hidden" /> Category
                </h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Every canvas for your creativity</p>
              </div>
              <Link href="/products"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold transition-colors px-4 py-2 rounded-xl hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Desktop bento */}
            <div className="hidden md:grid grid-cols-4 gap-3" style={{ gridTemplateRows: '350px 215px' }}>
              <Link href={`/products?category=${displayCategories[0]?.slug ?? 't-shirts'}`}
                className="col-span-2 row-span-2 group relative rounded-3xl overflow-hidden shine-hover">
                <Image
                  src={displayCategories[0]?.img ?? CATEGORY_IMGS['t-shirts']}
                  alt={displayCategories[0]?.name ?? 'T-Shirts'}
                  fill className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out" unoptimized />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                <div className="absolute inset-0 bg-violet-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black rounded-full uppercase tracking-[0.15em]">
                    ⭐ Most Popular
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <h3 className="text-white text-4xl font-black mb-1.5">{displayCategories[0]?.name ?? 'T-Shirts'}</h3>
                  <p className="text-white/50 text-sm flex items-center gap-3">
                    Starting from Rs. 799
                    <span className="inline-flex items-center gap-1 text-white/80 font-bold bg-white/10 px-2.5 py-0.5 rounded-full text-xs group-hover:bg-white/20 transition-colors">
                      Shop now <ArrowRight className="w-3 h-3" />
                    </span>
                  </p>
                </div>
              </Link>

              {displayCategories.slice(1, 5).map((cat: any) => (
                <Link key={cat.id ?? cat.slug} href={`/products?category=${cat.slug}`}
                  className="group relative rounded-2xl overflow-hidden shine-hover">
                  <Image
                    src={cat.img ?? CATEGORY_IMGS['t-shirts']} alt={cat.name}
                    fill className="object-cover group-hover:scale-[1.06] transition-transform duration-700 ease-out" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: 'linear-gradient(to top, rgba(124,58,237,0.28), transparent)' }} />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-xl block mb-0.5">{cat.icon}</span>
                    <h3 className="text-white text-sm font-black">{cat.name}</h3>
                  </div>
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/15 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <ArrowRight className="w-3 h-3 text-white" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Mobile scroll */}
            <div className="flex md:hidden gap-3 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory scrollbar-hide">
              {displayCategories.map((cat: any) => (
                <Link key={cat.id ?? cat.slug} href={`/products?category=${cat.slug}`}
                  className="flex-shrink-0 w-[145px] snap-start relative rounded-2xl overflow-hidden"
                  style={{ border: '1px solid var(--border-color)' }}>
                  <div className="relative aspect-[3/4]">
                    <Image src={cat.img ?? CATEGORY_IMGS['t-shirts']} alt={cat.name} fill className="object-cover" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3">
                      <p className="text-lg">{cat.icon}</p>
                      <p className="text-white font-black text-sm">{cat.name}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━ 6. FEATURED PRODUCTS ━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 sm:py-20" style={{ background: 'var(--page-bg)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="inline-block text-[11px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-[0.28em] mb-3 px-3.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">Hand-picked</span>
                <h2 className="text-3xl sm:text-5xl font-black leading-tight" style={{ color: 'var(--text-heading)' }}>Featured Designs</h2>
                <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Curated picks from our best creators</p>
              </div>
              <Link href="/products"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold transition-colors px-4 py-2 rounded-xl hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 text-purple-500 dark:text-purple-400">
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {products.map((product: any, idx: number) => {
                  const isNew = product.createdAt &&
                    (Date.now() - new Date(product.createdAt).getTime()) < 7 * 86400000;
                  return (
                    <Link key={product.id} href={`/products/${product.slug}`}
                      className="card-glow group rounded-2xl overflow-hidden"
                      style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                      <div className="relative aspect-square overflow-hidden">
                        <Image
                          src={product.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'}
                          alt={product.title} fill
                          className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" unoptimized />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {(idx === 0 || isNew) && (
                          <div className="absolute top-2.5 left-2.5 z-10">
                            {idx === 0
                              ? <span className="px-2.5 py-1 bg-violet-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-violet-500/30">FEATURED</span>
                              : <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-black rounded-full">NEW</span>}
                          </div>
                        )}

                        <div className="absolute bottom-0 inset-x-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                          <div className="m-2.5">
                            <div className="flex items-center justify-center gap-2 py-3 bg-white/[0.96] backdrop-blur rounded-xl text-gray-900 text-xs font-black shadow-lg">
                              <ShoppingBag className="w-3.5 h-3.5" /> Quick View
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4">
                        <p className="text-[11px] mb-1 truncate font-medium" style={{ color: 'var(--text-faint)' }}>{product.vendor?.storeName}</p>
                        <h3 className="font-bold text-sm line-clamp-1 group-hover:text-violet-500 dark:group-hover:text-violet-300 transition-colors mb-2.5"
                          style={{ color: 'var(--text-heading)' }}>{product.title}</h3>
                        <div className="flex items-center justify-between">
                          <p className="font-black" style={{ color: 'var(--text-heading)' }}>Rs. {Number(product.basePrice).toLocaleString()}</p>
                          {product._count?.reviews > 0 && (
                            <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/15 px-1.5 py-0.5 rounded-lg">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-[11px] text-yellow-500 dark:text-yellow-400 font-bold">{product._count.reviews}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-24 rounded-3xl border-2 border-dashed" style={{ borderColor: 'var(--border-color)' }}>
                <div className="w-20 h-20 bg-violet-500/10 rounded-3xl flex items-center justify-center mx-auto mb-5">
                  <Package className="w-10 h-10 text-violet-500 dark:text-violet-400" />
                </div>
                <h3 className="text-xl font-black mb-2" style={{ color: 'var(--text-heading)' }}>Products coming soon</h3>
                <p className="text-sm mb-8 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>Our vendors are setting up their stores. Be the first to list!</p>
                <Link href="/register?role=VENDOR"
                  className="btn-glow inline-flex items-center gap-2 px-7 py-3.5 bg-brand-gradient text-white font-bold rounded-2xl text-sm">
                  Become a Vendor <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            <div className="text-center mt-10 sm:hidden">
              <Link href="/products"
                className="inline-flex items-center gap-2 px-6 py-3.5 font-semibold rounded-2xl text-sm transition-colors hover:bg-[var(--hover-bg)]"
                style={{ border: '1px solid var(--border-color)', color: 'var(--text-body)' }}>
                View all products <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ━━━━ 7. DESIGN STUDIO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 sm:py-20 relative overflow-hidden" style={{ background: 'var(--surface-alt)' }}>
          <div className="absolute inset-0 dot-grid opacity-25 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

              {/* Studio mockup */}
              <div className="order-2 lg:order-1">
                <div className="rounded-3xl overflow-hidden shadow-2xl"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
                  {/* Browser chrome */}
                  <div className="flex items-center gap-1.5 px-4 py-3" style={{ background: 'var(--hover-bg)', borderBottom: '1px solid var(--border-color)' }}>
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FF5F57' }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFBD2E' }} />
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28C840' }} />
                    <div className="ml-3 flex-1 h-5 rounded-md text-[11px] flex items-center px-3 font-mono"
                      style={{ background: 'var(--input-bg)', color: 'var(--text-faint)' }}>ap.design/studio</div>
                  </div>
                  <div className="p-4 flex gap-3">
                    <div className="w-[72px] flex-shrink-0 space-y-1.5">
                      {['Text', 'Image', 'Shapes', 'Colors', 'Layers'].map((tool, i) => (
                        <div key={tool}
                          className={`px-2 py-2.5 rounded-xl text-[11px] font-semibold text-center transition-all ${i === 1 ? 'bg-brand-gradient text-white shadow-lg shadow-violet-500/30' : 'hover:bg-[var(--hover-bg)]'}`}
                          style={i !== 1 ? { background: 'var(--input-bg)', color: 'var(--text-muted)' } : {}}>
                          {tool}
                        </div>
                      ))}
                    </div>
                    <div className="flex-1 rounded-2xl aspect-square relative overflow-hidden"
                      style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)' }}>
                      <Image src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop"
                        alt="Design canvas" fill className="object-cover opacity-20 dark:opacity-30" unoptimized />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="backdrop-blur rounded-xl px-4 py-2.5 border text-xs font-bold"
                          style={{ background: 'var(--glass-bg)', borderColor: 'var(--border-color)', color: 'var(--text-heading)' }}>
                          ✨ Your Design Here
                        </div>
                      </div>
                      {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos, i) => (
                        <div key={i} className={`absolute ${pos} w-2.5 h-2.5 bg-blue-400 rounded-full`}
                          style={{ boxShadow: '0 0 8px rgba(59,130,246,0.8)' }} />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--hover-bg)' }}>
                    <div className="flex items-center gap-1.5">
                      {['#1F2937', '#F9FAFB', '#7C3AED', '#EC4899', '#10B981'].map((c) => (
                        <div key={c} className="w-5 h-5 rounded-full cursor-pointer hover:scale-110 transition-transform"
                          style={{ background: c, border: '1px solid var(--border-color)' }} />
                      ))}
                    </div>
                    <div className="px-3.5 py-1.5 bg-brand-gradient text-white text-[11px] font-black rounded-xl">Add to Cart →</div>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div className="order-1 lg:order-2">
                <span className="inline-block text-[11px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-[0.28em] mb-5 px-3.5 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">Design Studio</span>
                <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[0.9] tracking-tight mb-6"
                  style={{ color: 'var(--text-heading)' }}>
                  Make it{' '}
                  <span className="shimmer-text">uniquely</span>{' '}
                  yours.
                </h2>
                <p className="leading-relaxed mb-8 max-w-md" style={{ fontSize: 'clamp(0.875rem,1.4vw,1rem)', color: 'var(--text-muted)' }}>
                  Upload your artwork, logo, or photo. Position it exactly where you want. Get a live preview before ordering. No design skills required.
                </p>
                <ul className="space-y-3.5 mb-10">
                  {[
                    { text: 'Upload PNG, JPG, SVG or PDF files',   color: 'bg-green-500/15 border-green-500/25 text-green-500 dark:text-green-400' },
                    { text: 'Live preview on 50+ product types',   color: 'bg-blue-500/15 border-blue-500/25 text-blue-500 dark:text-blue-400' },
                    { text: 'Adjust size, position & placement',   color: 'bg-violet-500/15 border-violet-500/25 text-violet-500 dark:text-violet-400' },
                    { text: 'Bulk orders for teams and events',    color: 'bg-cyan-500/15 border-cyan-500/25 text-cyan-500 dark:text-cyan-400' },
                    { text: 'Print-ready processing in 24 hours',  color: 'bg-amber-500/15 border-amber-500/25 text-amber-500 dark:text-amber-400' },
                  ].map(({ text, color }) => (
                    <li key={text} className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-body)' }}>
                      <div className={`w-5 h-5 rounded-full ${color} border flex items-center justify-center flex-shrink-0`}>
                        <Check className="w-3 h-3" />
                      </div>
                      {text}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/design-studio"
                    className="btn-glow inline-flex items-center justify-center gap-2 px-7 py-4 font-black rounded-2xl hover:opacity-95 transition-all text-sm shadow-xl"
                    style={{ background: 'var(--text-heading)', color: 'var(--page-bg)' }}>
                    <Sparkles className="w-4 h-4 text-violet-500" /> Open Design Studio
                  </Link>
                  <Link href="/products"
                    className="shine-hover inline-flex items-center justify-center gap-2 px-7 py-4 font-semibold rounded-2xl transition-all text-sm"
                    style={{ border: '1px solid var(--border-color)', background: 'var(--hover-bg)', color: 'var(--text-body)' }}>
                    Browse Products
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ━━━━ 8. WHY CHOOSE AP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 sm:py-20" style={{ background: 'var(--page-bg)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10">
              <span className="inline-block text-[11px] font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-[0.28em] mb-4 px-3.5 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full">Why AP?</span>
              <h2 className="text-3xl sm:text-5xl font-black leading-tight mb-3" style={{ color: 'var(--text-heading)' }}>
                Built for creators.<br />
                <span className="shimmer-text">Trusted by thousands.</span>
              </h2>
              <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-muted)' }}>Everything you need to design, sell, and deliver — in one platform.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {WHY_AP.map((item) => (
                <div key={item.title} className="card-glow rounded-2xl p-6 group"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                  <div className={`w-12 h-12 rounded-2xl ${item.bg} border flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <item.Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="font-black text-base mb-2" style={{ color: 'var(--text-heading)' }}>{item.title}</h3>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                  <div className="pt-4" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <p className="text-xs font-black" style={{ color: 'var(--text-body)' }}>{item.stat}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━ 9. STATS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 sm:py-20 relative overflow-hidden" style={{ background: 'var(--surface-alt)' }}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full pointer-events-none blur-[60px]"
            style={{ background: 'var(--orb-purple)' }} />
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(124,58,237,0.25) 40%, rgba(37,99,235,0.25) 60%, transparent 95%)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(124,58,237,0.15) 40%, rgba(37,99,235,0.15) 60%, transparent 95%)' }} />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12">
              <span className="inline-flex items-center gap-2 text-[11px] font-black text-violet-500 dark:text-violet-400 uppercase tracking-[0.28em] mb-5 px-3.5 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-500 dark:bg-violet-400 animate-pulse-dot" />
                By the numbers
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-[3.25rem] font-black leading-tight tracking-tight"
                style={{ color: 'var(--text-heading)' }}>
                Built for <span className="shimmer-text">creators</span> who mean business.
              </h2>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {[
                { value: '10,000+', label: 'Products Listed',  sub: 'and growing daily',       gradient: 'from-violet-600 to-violet-800', glow: 'rgba(124,58,237,0.4)', lightGlow: 'rgba(124,58,237,0.08)', icon: <Package className="w-5 h-5 text-violet-300" /> },
                { value: '500+',    label: 'Active Vendors',   sub: 'earning weekly payouts',   gradient: 'from-blue-600 to-blue-800',   glow: 'rgba(37,99,235,0.4)',  lightGlow: 'rgba(37,99,235,0.08)',  icon: <Users className="w-5 h-5 text-blue-300" /> },
                { value: '25,000+', label: 'Orders Delivered', sub: 'shipped nationwide',       gradient: 'from-cyan-600 to-cyan-800',   glow: 'rgba(6,182,212,0.4)',  lightGlow: 'rgba(6,182,212,0.08)',  icon: <Truck className="w-5 h-5 text-cyan-300" /> },
                { value: '98%',     label: 'Satisfaction Rate', sub: 'from verified buyers',   gradient: 'from-emerald-600 to-emerald-800', glow: 'rgba(16,185,129,0.4)', lightGlow: 'rgba(16,185,129,0.08)', icon: <Star className="w-5 h-5 text-emerald-300" /> },
              ].map(({ value, label, sub, gradient, glow, lightGlow, icon }) => (
                <div key={label}
                  className="group relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                  style={{
                    background: `radial-gradient(ellipse 120% 80% at 10% 10%, ${lightGlow} 0%, var(--card-bg) 60%)`,
                    border: '1px solid var(--border-color)',
                  }}>

                  <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)`, filter: 'blur(20px)' }} />

                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br ${gradient} mb-5 sm:mb-6`}
                    style={{ boxShadow: `0 8px 24px ${glow}` }}>
                    {icon}
                  </div>

                  <p className="font-black leading-none mb-2 tracking-tight"
                    style={{ fontSize: 'clamp(2rem,4.5vw,3.5rem)', color: 'var(--text-heading)' }}>
                    {value}
                  </p>
                  <p className="text-sm sm:text-base font-bold mb-1" style={{ color: 'var(--text-body)' }}>{label}</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-faint)' }}>{sub}</p>

                  <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient} opacity-40 group-hover:opacity-80 transition-opacity duration-300`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━ 10. TOP VENDORS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        {vendors.length > 0 && (
          <section className="py-16 sm:py-20" style={{ background: 'var(--page-bg)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="inline-block text-[11px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-[0.28em] mb-3 px-3.5 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">Our Creators</span>
                  <h2 className="text-3xl sm:text-5xl font-black leading-tight" style={{ color: 'var(--text-heading)' }}>Top Vendors</h2>
                  <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>Independent creators and brands you&apos;ll love</p>
                </div>
                <Link href="/vendors"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm font-bold transition-colors px-4 py-2 rounded-xl hover:bg-purple-500/10 border border-transparent hover:border-purple-500/20 text-purple-500 dark:text-purple-400">
                  View all <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {vendors.slice(0, 6).map((v: any, i: number) => (
                  <Link key={v.id} href={`/vendors/${v.storeSlug}`}
                    className="card-glow group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl text-center"
                    style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)' }}>
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${VENDOR_GRADIENTS[i % VENDOR_GRADIENTS.length]} flex items-center justify-center text-white font-black text-lg sm:text-xl group-hover:scale-110 transition-transform duration-300`}
                      style={{ boxShadow: '0 8px 24px rgba(124,58,237,0.25)' }}>
                      {v.logo
                        ? <Image src={v.logo} alt={v.storeName} width={56} height={56} className="w-full h-full object-cover rounded-2xl" unoptimized />
                        : v.storeName?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-black text-sm line-clamp-1 group-hover:text-violet-500 dark:group-hover:text-violet-300 transition-colors"
                        style={{ color: 'var(--text-heading)' }}>{v.storeName}</p>
                      {v._count?.products > 0 && <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>{v._count.products} products</p>}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ━━━━ 11. TESTIMONIALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="py-16 sm:py-20" style={{ background: 'var(--surface-alt)' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-14 sm:mb-16">
              <span className="inline-block text-[11px] font-black text-amber-500 uppercase tracking-[0.28em] mb-4 px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full">Customer Love</span>
              <h2 className="text-3xl sm:text-5xl font-black mb-4 leading-tight" style={{ color: 'var(--text-heading)' }}>
                Loved by thousands<br className="hidden sm:block" /> of creators.
              </h2>
              <div className="flex items-center justify-center gap-1.5 mb-2">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
                <span className="ml-2 text-base font-black" style={{ color: 'var(--text-heading)' }}>4.9</span>
                <span className="text-sm" style={{ color: 'var(--text-faint)' }}>out of 5</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>Based on 2,400+ verified reviews</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {TESTIMONIALS.map((t) => (
                <div key={t.name}
                  className="relative rounded-3xl p-6 sm:p-8 hover:-translate-y-1.5 transition-all duration-300 overflow-hidden"
                  style={{ background: 'var(--card-bg)', border: '1px solid var(--border-color)', boxShadow: 'inset 0 1px 0 var(--border-subtle)' }}>
                  <div className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${t.color} opacity-80`} />
                  <div className="absolute -top-3 -right-2 text-[100px] leading-none select-none pointer-events-none"
                    style={{ color: 'var(--border-subtle)', fontFamily: 'Georgia, serif' }}>&ldquo;</div>
                  <div className="flex gap-0.5 mb-5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="leading-relaxed mb-6 font-medium"
                    style={{ fontSize: 'clamp(0.875rem,1.2vw,0.9375rem)', color: 'var(--text-body)' }}>
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-5" style={{ borderTop: '1px solid var(--border-color)' }}>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-black flex-shrink-0`}>
                      {t.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm" style={{ color: 'var(--text-heading)' }}>{t.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{t.role} · {t.location}</p>
                    </div>
                    {t.verified && (
                      <div className="flex items-center gap-1 text-[10px] text-blue-500 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full font-bold flex-shrink-0">
                        <Check className="w-2.5 h-2.5" /> Verified
                      </div>
                    )}
                  </div>
                  {t.order && (
                    <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl" style={{ border: '1px solid var(--border-color)', background: 'var(--hover-bg)' }}>
                      <Package className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--text-faint)' }} />
                      <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
                        Ordered: <span className="font-bold" style={{ color: 'var(--text-muted)' }}>{t.order}</span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ━━━━ 12. FINAL CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
        <section className="relative overflow-hidden" style={{ background: 'var(--page-bg)' }}>
          <div className="absolute inset-0"
            style={{ backgroundImage: `radial-gradient(ellipse 80% 60% at 20% 20%, var(--orb-purple) 0%, transparent 55%), radial-gradient(ellipse 70% 60% at 80% 80%, var(--orb-blue) 0%, transparent 55%)` }} />
          <div className="absolute inset-0 dot-grid opacity-30 pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6">

            {/* Trust guarantees */}
            <div className="py-12 sm:py-14" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-10">
                {[
                  { icon: <Shield className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />, bg: 'bg-emerald-400/10 border-emerald-400/20', title: 'Secure Payments',    desc: 'SSL encryption + Stripe & eSewa. Every transaction is 100% safe.' },
                  { icon: <Truck className="w-5 h-5 text-blue-500 dark:text-blue-400" />,         bg: 'bg-blue-400/10 border-blue-400/20',     title: 'Nationwide Delivery', desc: '3–7 business days with real-time tracking on every order.' },
                  { icon: <Star className="w-5 h-5 text-amber-400" />,                            bg: 'bg-amber-400/10 border-amber-400/20',    title: 'Quality Guaranteed',  desc: "Not satisfied? We'll reprint or give you a full refund." },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4 group">
                    <div className={`w-11 h-11 rounded-2xl ${item.bg} border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="font-black mb-1" style={{ color: 'var(--text-heading)' }}>{item.title}</h4>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA headline */}
            <div className="pt-16 pb-8 text-center">
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black leading-[0.9] tracking-tight mb-4"
                style={{ color: 'var(--text-heading)' }}>
                Ready to create<br />something <span className="shimmer-text">amazing?</span>
              </h2>
              <p className="text-base max-w-md mx-auto mb-14" style={{ color: 'var(--text-muted)' }}>
                Join thousands of designers and businesses who trust AP Marketplace for premium custom printing.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 max-w-4xl mx-auto text-left">

                {/* Buyer card */}
                <div className="glass-card rounded-3xl p-7 sm:p-10 flex flex-col justify-between min-h-[260px] group hover:shadow-lg transition-all duration-300 relative overflow-hidden shine-hover">
                  <div className="absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: 'linear-gradient(90deg, rgba(124,58,237,0.6), rgba(37,99,235,0.6))' }} />
                  <div>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200"
                      style={{ background: 'var(--hover-bg)' }}>
                      <ShoppingBag className="w-5 h-5" style={{ color: 'var(--text-body)' }} />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-heading)' }}>Start Shopping</h3>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>Thousands of unique designs. Premium quality. Fast delivery.</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {['Free returns', 'Secure checkout', 'Track your order'].map(p => (
                        <span key={p} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                          style={{ color: 'var(--text-muted)', background: 'var(--hover-bg)', border: '1px solid var(--border-color)' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />{p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link href="/products"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 font-black rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all text-sm shadow-md"
                    style={{ background: 'var(--text-heading)', color: 'var(--page-bg)' }}>
                    Browse All Designs <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Vendor card */}
                <div className="glass-card rounded-3xl p-7 sm:p-10 flex flex-col justify-between min-h-[260px] group hover:shadow-lg transition-all duration-300 relative overflow-hidden shine-hover">
                  <div className="absolute inset-x-0 top-0 h-[2px]"
                    style={{ background: 'linear-gradient(90deg, rgba(37,99,235,0.6), rgba(6,182,212,0.6))' }} />
                  <div>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200"
                      style={{ background: 'var(--hover-bg)' }}>
                      <TrendingUp className="w-5 h-5" style={{ color: 'var(--text-body)' }} />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: 'var(--text-heading)' }}>
                      Become a <span className="shimmer-text">Vendor</span>
                    </h3>
                    <p className="text-sm leading-relaxed mb-5" style={{ color: 'var(--text-muted)' }}>Turn designs into income. Zero upfront cost. Weekly payouts.</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {['Zero upfront cost', 'Weekly payouts', 'We print & ship'].map(p => (
                        <span key={p} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5"
                          style={{ color: 'var(--text-muted)', background: 'var(--hover-bg)', border: '1px solid var(--border-color)' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />{p}
                        </span>
                      ))}
                    </div>
                  </div>
                  <Link href="/register?role=VENDOR"
                    className="btn-glow inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-gradient text-white font-black rounded-2xl hover:opacity-95 active:scale-[0.98] transition-all text-sm">
                    <Users className="w-4 h-4" /> Start Selling Free
                  </Link>
                </div>
              </div>

              <p className="text-sm mt-10 pb-16" style={{ color: 'var(--text-faint)' }}>
                Have questions?{' '}
                <Link href="/contact" className="font-semibold hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
                  style={{ color: 'var(--text-muted)' }}>
                  Talk to our team →
                </Link>
              </p>
            </div>
          </div>
        </section>

      </main>

      <Footer />
      <MobileBottomNav />
    </>
  );
}
