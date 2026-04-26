'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { Order, OrderStatus } from '@/types';
import { formatPrice, formatDate, ORDER_TIMELINE } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { OrderTimeline } from '@/components/ui/OrderTimeline';
import { toast } from 'sonner';

const NEXT_STATUS: Record<string, OrderStatus> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PRINTING',
  PRINTING: 'PACKED',
  PACKED: 'SHIPPED',
  SHIPPED: 'DELIVERED',
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const load = () => ordersApi.get(id).then(({ data }) => setOrder(data.data)).finally(() => setLoading(false));
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status: OrderStatus) => {
    setUpdating(true);
    try {
      await ordersApi.updateStatus(id, status);
      toast.success(`Order status updated to ${status}`);
      load();
    } catch (err: any) {
      const raw = err?.response?.data?.message;
      const msg = (typeof raw === 'string' ? raw : raw?.message ?? raw?.error)
        ?? err?.response?.data?.error
        ?? err?.message
        ?? 'Failed to update status';
      toast.error(String(msg));
    }
    finally { setUpdating(false); }
  };

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;
  if (!order) return <div className="py-20 text-center text-gray-400">Order not found</div>;

  const nextStatus = NEXT_STATUS[order.orderStatus];
  const canCancel = !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.orderStatus);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</h1>
          <p className="text-sm text-gray-500">{formatDate(order.createdAt)} · {order.user?.name} · {order.user?.email}</p>
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {nextStatus && (
            <button onClick={() => updateStatus(nextStatus)} disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors">
              {updating && <Loader2 className="w-4 h-4 animate-spin" />}
              Mark as {nextStatus.replace(/_/g, ' ')}
            </button>
          )}
          {canCancel && (
            <button onClick={() => updateStatus('CANCELLED')} disabled={updating}
              className="px-4 py-2 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 disabled:opacity-60 transition-colors">
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-gray-900 mb-5">Order Timeline</h2>
            <OrderTimeline currentStatus={order.orderStatus} />
          </div>

          {/* Items */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map(item => (
                <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <Image src={item.product.images?.[0]?.url ?? 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100'} alt="" fill unoptimized className="object-cover" sizes="56px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{item.product.title}</p>
                    <p className="text-xs text-gray-500">{item.variant.size} / {item.variant.color} × {item.qty}</p>
                    {item.vendor && <p className="text-xs text-gray-400">{item.vendor.storeName}</p>}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 text-sm">{formatPrice(item.price)}</p>
                    <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                      <p>Vendor: {formatPrice(item.vendorCommission)}</p>
                      <p>Platform: {formatPrice(item.adminAmount)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-gray-900 mb-4">Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatPrice(order.totalAmount)}</span></div>
              <div className="flex justify-between font-black text-gray-900 border-t border-gray-100 pt-2"><span>Total</span><span>{formatPrice(order.totalAmount)}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-gray-900 mb-3">Payment</h3>
            <StatusBadge status={order.paymentStatus} type="payment" className="mb-2" />
            {order.payment && <p className="text-sm text-gray-500 capitalize mt-1">{order.payment.provider} · {order.payment.externalId?.slice(0, 20)}</p>}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-gray-900 mb-3">Shipping</h3>
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
