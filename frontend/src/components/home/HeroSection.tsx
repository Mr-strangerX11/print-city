import Link from 'next/link';
import { ArrowRight, Shield, Star, Truck } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative mesh-bg overflow-hidden min-h-[92vh] flex items-center">
      <div className="absolute inset-0 dot-grid pointer-events-none" />

      <div className="absolute top-[-10%] left-[-5%] w-[700px] h-[700px] rounded-full bg-purple-700/20 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-700/15 blur-[100px] pointer-events-none animate-pulse-slow"
        style={{ animationDelay: '2s' }}
      />
      <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] rounded-full bg-cyan-600/10 blur-[80px] pointer-events-none" />

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-24 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-12 lg:gap-8 items-center">
          <div className="reveal-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card text-white text-xs font-semibold mb-7">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-dot" />
              Premium Quality · Fast Nationwide Delivery
              <span className="ml-1 text-white/50">-&gt;</span>
            </div>

            <h1 className="text-[clamp(3rem,8vw,5.5rem)] font-black text-white leading-[0.9] tracking-tight mb-6">
              Design. <span className="shimmer-text">Print.</span>
              <br />
              Deliver.
            </h1>

            <p className="text-base md:text-lg text-gray-300/85 max-w-md leading-relaxed mb-8">
              Shop unique designs from independent creators, or upload your own artwork for premium quality printing on tees, hoodies, mugs, and more.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Link
                href="/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-gradient text-white text-sm font-bold shadow-lg hover:opacity-95 transition"
              >
                Browse Designs
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/design-studio"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/25 text-white text-sm font-bold hover:bg-white/10 transition"
              >
                Start Designing
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl">
              <div className="glass-card rounded-2xl p-3">
                <div className="flex items-center gap-2 text-white text-sm font-semibold mb-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  High Quality
                </div>
                <p className="text-xs text-gray-300">Premium materials</p>
              </div>
              <div className="glass-card rounded-2xl p-3">
                <div className="flex items-center gap-2 text-white text-sm font-semibold mb-1">
                  <Truck className="w-4 h-4 text-cyan-300" />
                  Fast Delivery
                </div>
                <p className="text-xs text-gray-300">3-5 business days</p>
              </div>
              <div className="glass-card rounded-2xl p-3">
                <div className="flex items-center gap-2 text-white text-sm font-semibold mb-1">
                  <Shield className="w-4 h-4 text-green-300" />
                  Secure Payment
                </div>
                <p className="text-xs text-gray-300">100% protected</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:block reveal-up reveal-up-delay-2">
            <div className="relative rounded-3xl ring-1 ring-white/10 bg-white/[0.03] border border-white/10 p-6 md:p-8">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Custom Tee', price: 'Rs. 1,299' },
                  { label: 'Hoodie Print', price: 'Rs. 2,499' },
                  { label: 'Custom Mug', price: 'Rs. 799' },
                  { label: 'Phone Case', price: 'Rs. 1,199' },
                ].map((item, i) => (
                  <div key={item.label} className="rounded-2xl border border-white/15 bg-black/30 p-4">
                    <div className="h-28 rounded-xl bg-gradient-to-br from-white/10 to-white/0 mb-3" />
                    <p className="text-white text-sm font-bold">{item.label}</p>
                    <p className="text-cyan-300 text-xs">{item.price}</p>
                  </div>
                ))}
              </div>

              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass-card rounded-full px-5 py-2 text-sm text-white">
                Delivered in 3-5 days
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
