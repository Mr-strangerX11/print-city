'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MailCheck, RefreshCw } from 'lucide-react';
import { authApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { toast } from 'sonner';
import Cookies from 'js-cookie';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const { login } = useAuth();

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.push('/register');
  }, [email, router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(''));
      inputRefs.current[5]?.focus();
    }
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter the 6-digit code'); return; }
    setLoading(true);
    try {
      const res = await authApi.verifyOtp(email, code);
      const { accessToken, refreshToken } = res.data.data;
      await login(accessToken, refreshToken);
      toast.success('Email verified! Welcome to Print City.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Invalid or expired OTP');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      await authApi.resendOtp(email);
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      toast.success('New code sent to your email');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <Navbar />
      <div className="flex items-center justify-center p-4 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm text-center space-y-6">

            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center">
                <MailCheck className="w-8 h-8 text-violet-600" />
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-black text-gray-900">Check your inbox</h1>
              <p className="text-gray-500 text-sm mt-2">
                We sent a 6-digit code to <span className="font-semibold text-gray-700">{email}</span>
              </p>
            </div>

            {/* OTP inputs */}
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-black border-2 border-gray-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              ))}
            </div>

            <button
              onClick={verify}
              disabled={loading || otp.join('').length < 6}
              className="w-full py-3.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Verifying…' : 'Verify Email'}
            </button>

            <div className="text-sm text-gray-500">
              {countdown > 0 ? (
                <p>Resend code in <span className="font-semibold text-gray-700">{countdown}s</span></p>
              ) : (
                <button
                  onClick={resend}
                  disabled={resending}
                  className="flex items-center gap-1.5 mx-auto text-violet-600 font-semibold hover:text-violet-700 disabled:opacity-50"
                >
                  {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Resend code
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400">
              Wrong email?{' '}
              <Link href="/register" className="text-violet-600 font-semibold hover:text-violet-700">
                Go back
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
