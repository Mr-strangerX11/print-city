'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Star, XCircle, Loader2 } from 'lucide-react';
import { ordersApi, reviewsApi } from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, formatDate, getErrorMsg } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderTimeline } from '@/components/ui/OrderTimeline';
import { toast } from 'sonner';

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(i)}
          className="p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              i <= (hovered || value)
                ? 'fill-yellow-400 text-yellow-400'
                : 'fill-gray-100 text-gray-200'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

interface ReviewState {
  productId: string;
  rating: number;
  comment: string;
  submitting: boolean;
  done: boolean;
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [reviews, setReviews] = useState<Record<string, ReviewState>>({});

  useEffect(() => {
    ordersApi.get(id).then(({ data }) => setOrder(data.data)).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await ordersApi.cancel(id);
      setOrder(prev => prev ? { ...prev, orderStatus: 'CANCELLED' as any } : prev);
      toast.success('Order cancelled');
    } catch (err) {
      toast.error(getErrorMsg(err, 'Failed to cancel order'));
    } finally {
      setCancelling(false);
    }
  };

  const initReview = (productId: string) => {
    if (reviews[productId]) return;
    setReviews(prev => ({ ...prev, [productId]: { productId, rating: 5, comment: '', submitting: false, done: false } }));
  };

  const updateReview = (productId: string, patch: Partial<ReviewState>) => {
    setReviews(prev => ({ ...prev, [productId]: { ...prev[productId], ...patch } }));
  };

  const submitReview = async (productId: string) => {
    const r = reviews[productId];
    if (!r || r.rating === 0) { toast.error('Please select a star rating'); return; }
    updateReview(productId, { submitting: true });
    try {
      await reviewsApi.create({ productId, rating: r.rating, comment: r.comment || undefined });
      updateReview(productId, { submitting: false, done: true });
      toast.success('Review submitted!');
    } catch (err) {
      updateReview(productId, { submitting: false });
      toast.error(getErrorMsg(err, 'Failed to submit review'));
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}
    </div>
  );

  if (!order) return <div className="text-center py-20"><p>Order not found</p></div>;

  const canCancel = order.orderStatus === 'PENDING' || order.orderStatus === 'CONFIRMED';
  const isDelivered = order.orderStatus === 'DELIVERED';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-gray-500 text-sm mt-0.5">Placed on {formatDate(order.createdAt)}</p>
        </div>
        {canCancel && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 disabled:opacity-50 transition-colors"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Cancel Order
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline + Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-gray-900 mb-5">Order Tracking</h2>
            <OrderTimeline currentStatus={order.orderStatus} />
            {order.trackingNumber && (
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">Tracking: <strong>{order.trackingNumber}</strong></p>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((item) => {
                const rv = reviews[item.product.id];
                return (
                  <div key={item.id}>
                    <div className="flex gap-4">
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                        <Image
                          src={item.product.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200'}
                          alt={item.product.title} fill unoptimized className="object-cover" sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm line-clamp-1">{item.product.title}</p>
                        <p className="text-xs text-gray-500">{item.variant.size} / {item.variant.color} × {item.qty}</p>
                        {item.vendor && <p className="text-xs text-gray-400 mt-0.5">{item.vendor.storeName}</p>}
                      </div>
                      <p className="font-bold text-gray-900 text-sm">{formatPrice(item.price)}</p>
                    </div>

                    {/* Review section — only on delivered orders */}
                    {isDelivered && (
                      <div className="mt-3 ml-20">
                        {!rv ? (
                          <button
                            onClick={() => initReview(item.product.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-2"
                          >
                            Write a review
                          </button>
                        ) : rv.done ? (
                          <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-green-500 text-green-500" /> Review submitted
                          </p>
                        ) : (
                          <div className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                            <p className="text-xs font-bold text-gray-700">Rate this product</p>
                            <StarPicker value={rv.rating} onChange={(v) => updateReview(item.product.id, { rating: v })} />
                            <textarea
                              value={rv.comment}
                              onChange={(e) => updateReview(item.product.id, { comment: e.target.value })}
                              placeholder="Share your experience... (optional)"
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => submitReview(item.product.id)}
                                disabled={rv.submitting}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors"
                              >
                                {rv.submitting && <Loader2 className="w-3 h-3 animate-spin" />}
                                Submit Review
                              </button>
                              <button
                                onClick={() => setReviews(prev => { const n = { ...prev }; delete n[item.product.id]; return n; })}
                                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{formatPrice(order.totalAmount)}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span className="text-green-600">Free</span></div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-gray-900">
                <span>Total</span><span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-gray-900 mb-4">Payment</h3>
            <StatusBadge status={order.paymentStatus} type="payment" />
            {order.payment && <p className="text-sm text-gray-500 mt-2 capitalize">{order.payment.provider}</p>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-gray-900 mb-3">Shipping To</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p className="font-semibold text-gray-900">{order.shippingName}</p>
              <p>{order.shippingAddress}</p>
              <p>{order.shippingCity}, {order.shippingState}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
