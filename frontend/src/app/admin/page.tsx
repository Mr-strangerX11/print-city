'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Users, DollarSign, Package, AlertCircle, Clock, CheckCircle, XCircle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { ordersApi, vendorsApi, productsApi } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Order } from '@/types';

// Pure-SVG sparkline — no external deps
function Sparkline({ data, color = '#2563EB', height = 36 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 100;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${height - ((v - min) / range) * (height - 4)}`)
    .join(' ');
  const area = `0,${height} ${pts} ${w},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#sg-${color.replace('#', '')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      {data.length > 0 && (() => {
        const last = data[data.length - 1];
        const lx = w;
        const ly = height - ((last - min) / range) * (height - 4);
        return <circle cx={lx} cy={ly} r="3" fill={color} />;
      })()}
    </svg>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, pendingVendorsCount: 0, products: 0, pending: 0, delivered: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      ordersApi.list({ limit: 10 }),
      ordersApi.stats(),
      vendorsApi.list({ status: 'PENDING', limit: 5 }),
      productsApi.list({ limit: 1 }),
    ]).then(([orders, statsRes, vendors, products]) => {
      const orderItems: Order[] = orders.data.data.items ?? [];
      setRecentOrders(orderItems);
      const pendingVs = vendors.data.data ?? [];
      setPendingVendors(pendingVs);
      const s = statsRes.data.data;
      setStats({
        orders: s.totalOrders ?? orders.data.data.meta?.total ?? 0,
        revenue: s.totalRevenue ?? 0,
        pendingVendorsCount: pendingVs.length,
        products: products.data.data.meta?.total ?? 0,
        pending: s.pendingOrders ?? 0,
        delivered: s.deliveredOrders ?? 0,
      });
    }).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleVendorAction = async (vendorId: string, action: 'approve' | 'reject') => {
    setApprovingId(vendorId);
    try {
      await vendorsApi.updateStatus(vendorId, action === 'approve' ? 'ACTIVE' : 'SUSPENDED');
      setPendingVendors(prev => prev.filter(v => v.id !== vendorId));
      setStats(prev => ({ ...prev, pendingVendorsCount: prev.pendingVendorsCount - 1 }));
    } catch { /* keep in list */ }
    finally { setApprovingId(null); }
  };

  // Generate fake sparkline data from orders (last 7 data points)
  const revenueSparkData = recentOrders.slice(0, 7).reverse().map((o) => Number(o.totalAmount));
  const orderSparkData = [3, 5, 4, 7, 6, 9, stats.orders % 10 + 2];

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-2xl" />)}
      </div>
      <div className="h-64 bg-gray-100 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1 text-sm">Platform overview and operations</p>
        </div>
        <div className="text-right hidden sm:block flex-shrink-0">
          <p className="text-xs text-gray-400">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Orders',
            value: stats.orders.toLocaleString(),
            icon: <ShoppingBag className="w-5 h-5 text-blue-500" />,
            bg: 'bg-blue-50',
            href: '/admin/orders',
            sub: `${stats.pending} pending`,
            spark: orderSparkData,
            color: '#3b82f6',
            trend: '+12%',
          },
          {
            label: 'Revenue (Paid)',
            value: formatPrice(stats.revenue),
            icon: <DollarSign className="w-5 h-5 text-green-500" />,
            bg: 'bg-green-50',
            href: '/admin/payouts',
            sub: 'from paid orders',
            spark: revenueSparkData,
            color: '#22c55e',
            trend: '+8%',
          },
          {
            label: 'Pending Vendors',
            value: stats.pendingVendorsCount.toString(),
            icon: <Users className="w-5 h-5 text-yellow-500" />,
            bg: 'bg-yellow-50',
            href: '/admin/vendors',
            sub: 'awaiting approval',
            spark: [2, 3, 1, 4, 2, stats.pendingVendorsCount, stats.pendingVendorsCount],
            color: '#eab308',
            trend: null,
          },
          {
            label: 'Products',
            value: stats.products.toLocaleString(),
            icon: <Package className="w-5 h-5 text-purple-500" />,
            bg: 'bg-purple-50',
            href: '/admin/products',
            sub: 'active listings',
            spark: [20, 25, 22, 28, 30, 27, stats.products % 10 + 25],
            color: '#a855f7',
            trend: '+5%',
          },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md hover:border-gray-200 transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>{s.icon}</div>
              {s.trend && (
                <span className="flex items-center gap-0.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3" /> {s.trend}
                </span>
              )}
            </div>
            <p className="text-2xl font-black text-gray-900">{s.value}</p>
            <p className="text-xs font-semibold text-gray-700 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mb-3">{s.sub}</p>
            <div className="h-8 opacity-70 group-hover:opacity-100 transition-opacity">
              <Sparkline data={s.spark} color={s.color} height={32} />
            </div>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {(stats.pending > 0 || stats.pendingVendorsCount > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {stats.pending > 0 && (
            <Link href="/admin/orders?status=PENDING"
              className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl hover:bg-yellow-100 transition-colors group">
              <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-yellow-900 text-sm">{stats.pending} orders pending</p>
                <p className="text-xs text-yellow-700">Need confirmation</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-yellow-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          )}
          {stats.pendingVendorsCount > 0 && (
            <Link href="/admin/vendors?status=PENDING"
              className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl hover:bg-blue-100 transition-colors group">
              <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-blue-900 text-sm">{stats.pendingVendorsCount} vendors awaiting approval</p>
                <p className="text-xs text-blue-700">Review applications below</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-black text-gray-900">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <div className="px-5 py-10 text-center text-gray-400 text-sm">No orders yet</div>
            ) : (
              recentOrders.slice(0, 7).map(order => (
                <Link key={order.id} href={`/admin/orders/${order.id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900">#{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400 truncate">{order.user?.name} · {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="hidden sm:block"><StatusBadge status={order.paymentStatus} type="payment" /></span>
                    <StatusBadge status={order.orderStatus} type="order" />
                    <p className="text-sm font-black text-gray-900 text-right">{formatPrice(order.totalAmount)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Pending Vendors — with inline approve/reject */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-black text-gray-900">Pending Vendors</h2>
            <Link href="/admin/vendors" className="text-xs text-blue-600 font-semibold hover:text-blue-700">
              View all
            </Link>
          </div>
          {pendingVendors.length === 0 ? (
            <div className="p-10 text-center">
              <CheckCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">All caught up!</p>
              <p className="text-xs text-gray-400">No pending vendor applications</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingVendors.map((v: any) => (
                <div key={v.id} className="px-5 py-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{v.storeName}</p>
                      <p className="text-xs text-gray-400 truncate">{v.user?.email}</p>
                      <p className="text-xs text-gray-400">{formatDate(v.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVendorAction(v.id, 'approve')}
                      disabled={approvingId === v.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      {approvingId === v.id ? '...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleVendorAction(v.id, 'reject')}
                      disabled={approvingId === v.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-red-50 hover:text-red-700 disabled:opacity-60 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
