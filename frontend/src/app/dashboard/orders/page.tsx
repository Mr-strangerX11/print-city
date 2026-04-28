'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { Order } from '@/types';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi.list({ limit: 50 }).then(({ data }) => setOrders(data.data.items)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-black text-gray-900">My Orders</h1>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-gray-100">
          <Package className="w-12 h-12 text-gray-200 mb-4" />
          <h3 className="font-bold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-sm text-gray-500 mb-4">Start shopping to see your orders here</p>
          <Link href="/products" className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors">Browse Products</Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {orders.map((order) => (
              <Link key={order.id} href={`/dashboard/orders/${order.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50 transition-colors gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.createdAt)} · {order.items.length} items</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:ml-auto">
                  <StatusBadge status={order.paymentStatus} type="payment" />
                  <StatusBadge status={order.orderStatus} type="order" />
                  <p className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
