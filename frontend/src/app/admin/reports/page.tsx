'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { TrendingUp, ShoppingBag, Users, DollarSign, Package, RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orders, invoices, users, products] = await Promise.all([
        api.get('/orders/stats').catch(() => ({ data: { data: null } })),
        api.get('/invoices/stats').catch(() => ({ data: { data: null } })),
        api.get('/users/stats').catch(() => ({ data: { data: null } })),
        api.get('/products/stats').catch(() => ({ data: { data: null } })),
      ]);
      setData({
        orders: orders.data.data,
        invoices: invoices.data.data,
        users: users.data.data,
        products: products.data.data,
      });
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const StatCard = ({ label, value, sub, change, icon, color }: any) => (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>{icon}</div>
        {change !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );

  const orders = data?.orders;
  const invoices = data?.invoices;
  const users = data?.users;
  const products = data?.products;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Reports & Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Business performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
            {(['7d', '30d', '90d', '1y'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>{p}</button>
            ))}
          </div>
          <button onClick={load} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-xl px-3 py-2">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* Revenue */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Revenue</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Revenue" value={formatPrice(invoices?.totalRevenue ?? 0)}
                icon={<DollarSign className="w-5 h-5 text-green-600" />} color="bg-green-50"
                sub={`${invoices?.totalInvoices ?? 0} invoices`}
              />
              <StatCard
                label="Platform Earnings" value={formatPrice(invoices?.platformEarnings ?? 0)}
                icon={<TrendingUp className="w-5 h-5 text-violet-600" />} color="bg-violet-50"
                sub="After vendor payouts"
              />
              <StatCard
                label="Vendor Payouts" value={formatPrice(invoices?.vendorPayouts ?? 0)}
                icon={<DollarSign className="w-5 h-5 text-blue-600" />} color="bg-blue-50"
                sub="Paid to vendors"
              />
              <StatCard
                label="This Month" value={formatPrice(invoices?.monthlyRevenue ?? 0)}
                icon={<TrendingUp className="w-5 h-5 text-cyan-600" />} color="bg-cyan-50"
              />
            </div>
          </div>

          {/* Orders */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Orders</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Total Orders" value={orders?.total ?? '—'}
                icon={<ShoppingBag className="w-5 h-5 text-orange-500" />} color="bg-orange-50"
              />
              <StatCard
                label="Pending" value={orders?.pending ?? '—'}
                icon={<ShoppingBag className="w-5 h-5 text-yellow-500" />} color="bg-yellow-50"
              />
              <StatCard
                label="Delivered" value={orders?.delivered ?? '—'}
                icon={<ShoppingBag className="w-5 h-5 text-green-500" />} color="bg-green-50"
              />
              <StatCard
                label="Avg Order Value" value={formatPrice(orders?.avgOrderValue ?? 0)}
                icon={<TrendingUp className="w-5 h-5 text-indigo-500" />} color="bg-indigo-50"
              />
            </div>
          </div>

          {/* Users & Products */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Users</h2>
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Total Users" value={users?.total ?? '—'}
                  icon={<Users className="w-5 h-5 text-blue-500" />} color="bg-blue-50"
                />
                <StatCard
                  label="New This Month" value={users?.newThisMonth ?? '—'}
                  icon={<Users className="w-5 h-5 text-violet-500" />} color="bg-violet-50"
                />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Catalog</h2>
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Total Products" value={products?.total ?? '—'}
                  icon={<Package className="w-5 h-5 text-cyan-500" />} color="bg-cyan-50"
                />
                <StatCard
                  label="Active Vendors" value={products?.activeVendors ?? '—'}
                  icon={<Package className="w-5 h-5 text-teal-500" />} color="bg-teal-50"
                />
              </div>
            </div>
          </div>

          {/* Top Products / Recent Orders tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top selling products placeholder */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Top Products</h3>
              {(products?.topProducts ?? []).length > 0 ? (
                <div className="space-y-3">
                  {(products.topProducts as any[]).map((p: any, i: number) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{p.title}</p>
                        <p className="text-xs text-gray-400">{p.vendor?.storeName}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900">{p.orderCount} orders</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Package className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400">No data available yet</p>
                </div>
              )}
            </div>

            {/* Order status breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-bold text-gray-900 mb-4">Order Status Breakdown</h3>
              {orders?.byStatus ? (
                <div className="space-y-3">
                  {Object.entries(orders.byStatus as Record<string, number>).map(([status, count]) => {
                    const pct = orders.total > 0 ? Math.round((count / orders.total) * 100) : 0;
                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-gray-700">{status.replace(/_/g, ' ')}</span>
                          <span className="text-gray-500">{count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ShoppingBag className="w-8 h-8 text-gray-200 mb-2" />
                  <p className="text-xs text-gray-400">No data available yet</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
