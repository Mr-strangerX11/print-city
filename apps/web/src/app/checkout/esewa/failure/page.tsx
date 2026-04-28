'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function EsewaFailureContent() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get('order_id');

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
          <svg className="h-8 w-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-zinc-100">Payment Cancelled</h1>
        <p className="text-sm text-zinc-400">Your eSewa payment was not completed. No charges were made.</p>
        <div className="flex gap-3 justify-center pt-2">
          {orderId && (
            <button
              onClick={() => router.push(`/checkout?order_id=${orderId}`)}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => router.push('/orders')}
            className="rounded-lg bg-zinc-800 px-5 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            My Orders
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EsewaFailurePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <EsewaFailureContent />
    </Suspense>
  );
}
