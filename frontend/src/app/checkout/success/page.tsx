'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Package } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const params = useSearchParams();
  const orderId = params.get('order_id');

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--page-bg)' }}>
      <div className="max-w-md w-full rounded-3xl p-10 text-center shadow-sm"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text-heading)' }}>Payment Successful!</h1>
        <p className="mb-8" style={{ color: 'var(--text-muted)' }}>Your order has been confirmed and is being processed.</p>
        {orderId && (
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Order ID: <strong style={{ color: 'var(--text-heading)' }}>#{orderId.slice(-8).toUpperCase()}</strong>
          </p>
        )}
        <div className="flex flex-col gap-3">
          {orderId && (
            <Link href={`/dashboard/orders/${orderId}`}
              className="flex items-center justify-center gap-2 py-3 bg-brand-gradient text-white font-semibold rounded-xl hover:opacity-90 transition-colors">
              <Package className="w-4 h-4" /> Track Your Order
            </Link>
          )}
          <Link href="/products"
            className="py-3 font-semibold rounded-xl transition-colors hover:bg-[var(--hover-bg)]"
            style={{ border: '1px solid var(--border-color)', color: 'var(--text-body)' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
