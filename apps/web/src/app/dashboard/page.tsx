'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, Upload, Heart, ShoppingCart } from 'lucide-react';
import { ordersApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Order } from '@/types';

export default function CustomerDashboard() {
  const { user } = useAuth();
  const { cart } = useCart();
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, pending: 0 });

  useEffect(() => {
    ordersApi.list({ limit: 5 }).then(({ data }) => {
      const orders: Order[] = data.data.items;
      setRecentOrders(orders);
      setStats({
        total: data.data.meta.total,
        delivered: orders.filter(o => o.orderStatus === 'DELIVERED').length,
        pending: orders.filter(o => ['PENDING', 'CONFIRMED', 'PRINTING', 'PACKED', 'SHIPPED'].includes(o.orderStatus)).length,
      });
    }).catch(() => {});
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-black text-gray-900">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your account</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total, icon: <Package className="w-5 h-5 text-blue-500" />, href: '/dashboard/orders' },
          { label: 'Active Orders', value: stats.pending, icon: <ShoppingCart className="w-5 h-5 text-yellow-500" />, href: '/dashboard/orders' },
          { label: 'Delivered', value: stats.delivered, icon: <Package className="w-5 h-5 text-green-500" />, href: '/dashboard/orders' },
          { label: 'Cart Items', value: cart?.items.length ?? 0, icon: <ShoppingCart className="w-5 h-5 text-purple-500" />, href: '/cart' },
        ].map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">{s.icon}</div>
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-black text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/products" className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center"><Package className="w-5 h-5 text-white" /></div>
            <div><p className="font-semibold text-blue-900 text-sm">Browse Products</p><p className="text-xs text-blue-600">Shop latest designs</p></div>
          </Link>
          <Link href="/design-studio" className="flex items-center gap-3 p-4 bg-purple-50 rounded-2xl border border-purple-100 hover:bg-purple-100 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center"><Upload className="w-5 h-5 text-white" /></div>
            <div><p className="font-semibold text-purple-900 text-sm">Upload Design</p><p className="text-xs text-purple-600">Custom print order</p></div>
          </Link>
          <Link href="/dashboard/orders" className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100 hover:bg-green-100 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center"><Package className="w-5 h-5 text-white" /></div>
            <div><p className="font-semibold text-green-900 text-sm">Track Orders</p><p className="text-xs text-green-600">View order status</p></div>
          </Link>
        </div>
      </div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900">Recent Orders</h2>
            <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all</Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-50">
              {recentOrders.map((order) => (
                <Link key={order.id} href={`/dashboard/orders/${order.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(order.createdAt)} · {order.items.length} items</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.orderStatus} type="order" />
                    <p className="font-bold text-gray-900 text-sm">{formatPrice(order.totalAmount)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
