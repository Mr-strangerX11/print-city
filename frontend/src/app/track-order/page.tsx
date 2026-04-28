'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ordersApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate, ORDER_STATUS_COLORS, ORDER_TIMELINE } from '@/lib/utils';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Loader2, ArrowRight } from 'lucide-react';

const STATUS_ICON: Record<string, React.ReactNode> = {
  PENDING: <Clock className="w-5 h-5 text-yellow-500" />,
  CONFIRMED: <CheckCircle className="w-5 h-5 text-blue-500" />,
  PRINTING: <Package className="w-5 h-5 text-purple-500" />,
  PACKED: <Package className="w-5 h-5 text-indigo-500" />,
  SHIPPED: <Truck className="w-5 h-5 text-cyan-500" />,
  DELIVERED: <CheckCircle className="w-5 h-5 text-green-500" />,
};

export default function TrackOrderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    if (!user) { router.push(`/login?redirect=/track-order`); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const { data } = await ordersApi.get(orderId.trim());
      setOrder(data.data);
    } catch (err: any) {
      setError(err.response?.status === 404 ? 'Order not found. Please check the ID and try again.' : 'Failed to fetch order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? ORDER_TIMELINE.findIndex(s => s.status === order.status) : -1;

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: 'var(--page-bg)' }}>

        {/* Hero */}
        <section className="bg-brand-ink py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 mb-4">
              <Truck className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Track Your Order</h1>
            <p className="text-gray-300 text-sm">Enter your order ID to see the latest status and shipping updates.</p>
          </div>
        </section>

        <div className="max-w-2xl mx-auto px-4 -mt-6 pb-20">
          {/* Search card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 mb-6">
            <form onSubmit={handleTrack} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={orderId}
                  onChange={e => setOrderId(e.target.value)}
                  placeholder="Enter your Order ID (e.g. clx1234...)"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50"
                />
              </div>
              <button type="submit" disabled={loading || !orderId.trim()}
                className="px-5 py-3 bg-brand-gradient text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all text-sm flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Track
              </button>
            </form>

            {!user && (
              <p className="mt-3 text-xs text-gray-400 text-center">
                You need to <Link href="/login?redirect=/track-order" className="text-blue-600 font-medium hover:underline">sign in</Link> to track an order.
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          {/* Order result */}
          {order && (
            <div className="space-y-4 animate-fade-in">
              {/* Status card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-xs text-gray-400 font-medium mb-1">ORDER ID</p>
                    <p className="font-mono text-sm font-bold text-gray-700">{order.id.slice(0, 16)}…</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold ${ORDER_STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {order.status}
                  </span>
                </div>

                {/* Timeline */}
                <div className="space-y-0">
                  {ORDER_TIMELINE.map((step, i) => {
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    return (
                      <div key={step.status} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm border-2 transition-all ${
                            done ? 'bg-gray-900 border-gray-900 text-white' :
                            'bg-white border-gray-200 text-gray-300'
                          } ${active ? 'ring-4 ring-gray-900/20' : ''}`}>
                            {done ? '✓' : i + 1}
                          </div>
                          {i < ORDER_TIMELINE.length - 1 && (
                            <div className={`w-0.5 h-8 mt-1 ${done && i < currentStep ? 'bg-gray-900' : 'bg-gray-100'}`} />
                          )}
                        </div>
                        <div className="pb-4 pt-1 min-w-0">
                          <p className={`text-sm font-semibold ${done ? 'text-gray-900' : 'text-gray-300'}`}>
                            {step.icon} {step.label}
                          </p>
                          {active && (
                            <p className="text-xs text-blue-600 font-medium mt-0.5">Current status</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping info */}
              {order.shippingAddress && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <h3 className="font-bold text-sm text-gray-900">Delivery Address</h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {order.shippingAddress.fullName}<br />
                    {order.shippingAddress.street}, {order.shippingAddress.city}<br />
                    {order.shippingAddress.state} {order.shippingAddress.zip}
                  </p>
                  {order.trackingNumber && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">Tracking Number</p>
                      <p className="font-mono text-sm font-bold text-gray-700">{order.trackingNumber}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Items */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h3 className="font-bold text-sm text-gray-900 mb-3">Items ({order.items?.length ?? 0})</h3>
                <div className="space-y-3">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.product?.title ?? 'Product'}</p>
                        <p className="text-xs text-gray-400">Qty: {item.qty}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 flex-shrink-0">Rs. {Number(item.unitPrice * item.qty).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-black text-gray-900">Rs. {Number(order.totalAmount).toLocaleString()}</span>
                </div>
              </div>

              <Link href="/dashboard/orders"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">
                View All Orders <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Helper */}
          {!order && !loading && !error && (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium mb-1">Find your order ID</p>
              <p className="text-gray-400 text-sm">Your order ID is in the confirmation email or in your <Link href="/dashboard/orders" className="text-blue-600 hover:underline">orders dashboard</Link>.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
