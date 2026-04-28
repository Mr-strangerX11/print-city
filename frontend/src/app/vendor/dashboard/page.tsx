'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package, DollarSign, TrendingUp, Eye, Plus, AlertCircle, ArrowUpRight, Star, Clock } from 'lucide-react';
import { productsApi, payoutsApi, vendorsApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatPrice, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/StatusBadge';

function MiniStat({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`p-4 rounded-2xl ${color}`}>
      <p className="text-2xl font-black text-inherit">{value}</p>
      <p className="text-sm font-semibold mt-0.5">{label}</p>
      {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [vendorProfile, setVendorProfile] = useState<any>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productsApi.list({ limit: 6 }),
      payoutsApi.earnings().catch(() => ({ data: { data: null } })),
      vendorsApi.getProfile().catch(() => ({ data: { data: null } })),
      payoutsApi.list({ limit: 3 }).catch(() => ({ data: { data: [] } })),
    ]).then(([prods, earn, vendor, pays]) => {
      setProducts(prods.data.data.items ?? []);
      setEarnings(earn.data.data);
      setVendorProfile(vendor.data.data);
      setPayouts(pays.data.data?.items ?? pays.data.data ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-2xl" />)}
    </div>
  );

  const isPending = vendorProfile?.status === 'PENDING';
  const isSuspended = vendorProfile?.status === 'SUSPENDED';
  const commissionRate = (vendorProfile?.commissionRate ?? 0.1) * 100;
  const activeProducts = products.filter(p => p.status === 'ACTIVE').length;
  const pendingProducts = products.filter(p => p.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center text-white text-xl font-black shadow-md">
            {(vendorProfile?.storeName ?? user?.name ?? 'V')[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 leading-tight">
              {vendorProfile?.storeName ?? 'Your Store'}
            </h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <Link href="/vendor/designs/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-sm flex-shrink-0">
          <Plus className="w-4 h-4" /> New Design
        </Link>
      </div>

      {/* Status banners */}
      {isPending && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Store Pending Approval</p>
            <p className="text-sm text-amber-700 mt-0.5">Your store is under review. You can upload designs now — they'll go live once approved.</p>
          </div>
        </div>
      )}
      {isSuspended && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900">Store Suspended</p>
            <p className="text-sm text-red-700 mt-0.5">Contact support to resolve your account status.</p>
          </div>
        </div>
      )}
      {pendingProducts > 0 && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
          <AlertCircle className="w-4 h-4 text-blue-500" />
          <p className="text-sm font-semibold text-blue-800">{pendingProducts} design{pendingProducts > 1 ? 's' : ''} pending admin review</p>
          <Link href="/vendor/designs" className="ml-auto text-xs text-blue-600 font-bold hover:text-blue-700">View →</Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{products.length}</p>
          <p className="text-xs font-semibold text-gray-600 mt-0.5">Total Designs</p>
          <p className="text-xs text-gray-400">{activeProducts} active</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <p className="text-xl font-black text-gray-900">{formatPrice(earnings?.totalEarnings ?? 0)}</p>
          <p className="text-xs font-semibold text-gray-600 mt-0.5">Total Earnings</p>
          <p className="text-xs text-gray-400">lifetime</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
          </div>
          <p className="text-xl font-black text-gray-900">{formatPrice(earnings?.pendingEarnings ?? 0)}</p>
          <p className="text-xs font-semibold text-gray-600 mt-0.5">Pending Payout</p>
          <p className="text-xs text-gray-400">next cycle</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center mb-3">
            <Eye className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-black text-gray-900">{commissionRate.toFixed(0)}%</p>
          <p className="text-xs font-semibold text-gray-600 mt-0.5">Commission Rate</p>
          <p className="text-xs text-gray-400">per sale</p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Designs */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
            <h2 className="font-black text-gray-900">Recent Designs</h2>
            <Link href="/vendor/designs" className="text-xs text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-bold text-gray-700 mb-1">No designs yet</p>
              <p className="text-sm text-gray-400 mb-5">Upload your first design to start earning commissions</p>
              <Link href="/vendor/designs/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors">
                <Plus className="w-4 h-4" /> Upload First Design
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {products.map((p: any) => (
                <div key={p.id} className="flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  {/* Thumbnail */}
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {p.images?.[0]?.url ? (
                      <Image
                        src={p.images[0].url}
                        alt={p.title}
                        width={48}
                        height={48}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-gray-400 text-xs font-bold">
                        {p.title[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${p.slug}`} target="_blank"
                      className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors line-clamp-1">
                      {p.title}
                    </Link>
                    <div className="flex items-center gap-2 sm:gap-3 mt-0.5 flex-wrap">
                      <p className="text-xs text-gray-400 hidden sm:block">{formatDate(p.createdAt)}</p>
                      {p._count?.reviews > 0 && (
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs text-gray-400">{p._count.reviews}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={p.status} type="custom" />
                    <p className="font-black text-sm text-gray-900 hidden sm:block">{formatPrice(p.basePrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Commission info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="font-black text-gray-900 mb-4">How You Earn</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <span className="text-sm text-blue-700 font-medium">Your Rate</span>
                <span className="text-xl font-black text-blue-700">{commissionRate.toFixed(0)}%</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm text-gray-600">Accrues when</span>
                <span className="text-xs font-bold text-gray-800 text-right">Delivered + Paid</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <span className="text-sm text-green-700 font-medium">Payout cycle</span>
                <span className="text-sm font-black text-green-700">Weekly</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 leading-relaxed">
              For every Rs. 1,000 sale at your rate, you earn Rs. {(1000 * commissionRate / 100).toFixed(0)}.
            </p>
          </div>

          {/* Recent Payouts */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-50">
              <h3 className="font-black text-gray-900 text-sm">Recent Payouts</h3>
              <Link href="/vendor/payouts" className="text-xs text-blue-600 font-bold hover:text-blue-700">View all</Link>
            </div>
            {payouts.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-gray-400">No payouts yet</div>
            ) : (
              <div className="divide-y divide-gray-50">
                {payouts.slice(0, 3).map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{formatPrice(p.amount)}</p>
                      <p className="text-xs text-gray-400">{formatDate(p.periodEnd)}</p>
                    </div>
                    <StatusBadge status={p.status} type="payout" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <h3 className="font-black text-gray-900 text-sm mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              {[
                { href: '/vendor/designs/new', label: 'Upload New Design', icon: '🎨' },
                { href: '/vendor/designs', label: 'Manage Designs', icon: '📦' },
                { href: '/vendor/earnings', label: 'View Earnings', icon: '💰' },
                { href: '/vendor/settings', label: 'Store Settings', icon: '⚙️' },
              ].map(({ href, label, icon }) => (
                <Link key={href} href={href}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors font-medium">
                  <span>{icon}</span> {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
