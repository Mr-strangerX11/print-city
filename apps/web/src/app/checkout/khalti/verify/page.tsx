'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? '';

function KhaltiVerifyContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const pidx = params.get('pidx');
    if (!pidx) {
      setError('Missing pidx from Khalti.');
      setStatus('error');
      return;
    }

    fetch(`${API}/api/payments/khalti/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ pidx }),
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.message ?? 'Verification failed');
        setStatus('success');
        setTimeout(() => router.push(`/orders/${json.orderId}`), 2000);
      })
      .catch((err: Error) => {
        setError(err.message);
        setStatus('error');
      });
  }, [params, router]);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center space-y-4">
        {status === 'verifying' && (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-zinc-300 font-medium">Verifying your Khalti payment…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <svg className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-zinc-100">Payment Successful</h1>
            <p className="text-sm text-zinc-400">Your order has been confirmed. Redirecting…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
              <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-zinc-100">Verification Failed</h1>
            <p className="text-sm text-red-400">{error}</p>
            <button
              onClick={() => router.push('/orders')}
              className="mt-2 rounded-lg bg-zinc-800 px-5 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
            >
              Go to Orders
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function KhaltiVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <KhaltiVerifyContent />
    </Suspense>
  );
}
