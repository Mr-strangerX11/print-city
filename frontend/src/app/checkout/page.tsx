'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, CreditCard, MapPin, ChevronDown, Tag, X, Check } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ordersApi, paymentsApi, addressesApi, couponsApi } from '@/lib/api';
import { formatPrice, getErrorMsg } from '@/lib/utils';
import { toast } from 'sonner';

const schema = z.object({
  shippingName: z.string().min(2),
  shippingPhone: z.string().min(10),
  shippingAddress: z.string().min(5),
  shippingCity: z.string().min(2),
  shippingState: z.string().min(2),
  shippingZip: z.string().min(4),
  shippingCountry: z.string().default('Nepal'),
  notes: z.string().optional(),
  paymentMethod: z.enum(['stripe', 'esewa', 'khalti']),
});
type FormData = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, refreshCart } = useCart();
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [addrOpen, setAddrOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; label: string } | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: 'stripe', shippingCountry: 'Nepal' },
  });
  const paymentMethod = watch('paymentMethod');

  useEffect(() => {
    if (!user) return;
    addressesApi.list()
      .then(({ data }) => setSavedAddresses(data.data ?? []))
      .catch(() => {});
  }, [user]);

  const applyAddress = (addr: any) => {
    setValue('shippingName', addr.name);
    setValue('shippingPhone', addr.phone);
    setValue('shippingAddress', addr.address);
    setValue('shippingCity', addr.city);
    setValue('shippingState', addr.state);
    setValue('shippingZip', addr.zip ?? '');
    setAddrOpen(false);
    toast.success(`Address "${addr.label}" applied`);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await couponsApi.validate(couponCode.trim().toUpperCase(), cart!.subtotal);
      const { coupon, discountAmount } = data.data;
      const label = coupon.type === 'PERCENTAGE'
        ? `${coupon.value}% off`
        : coupon.type === 'FIXED'
        ? `Rs. ${coupon.value} off`
        : 'Free shipping';
      setAppliedCoupon({ code: coupon.code, discountAmount, label });
      toast.success(`Coupon applied — ${label}`);
    } catch (err: any) {
      toast.error(getErrorMsg(err, 'Invalid coupon code'));
    } finally { setCouponLoading(false); }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  useEffect(() => {
    if (!user) router.push('/login');
  }, [user, router]);

  useEffect(() => {
    if (user && (!cart || cart.items.length === 0)) router.push('/cart');
  }, [user, cart, router]);

  if (!user || !cart || cart.items.length === 0) return null;

  const finalTotal = Math.max(0, cart.subtotal - (appliedCoupon?.discountAmount ?? 0));

  const onSubmit = async (data: FormData) => {
    try {
      const { data: orderRes } = await ordersApi.checkout({
        ...data,
        couponCode: appliedCoupon?.code,
      });
      const order = orderRes.data;

      if (data.paymentMethod === 'stripe') {
        const { data: payRes } = await paymentsApi.createCheckout(order.id);
        if (payRes.data?.url) window.location.href = payRes.data.url;

      } else if (data.paymentMethod === 'esewa') {
        const { data: payRes } = await paymentsApi.initiateEsewa(order.id);
        const { paymentUrl, formData } = payRes.data;
        await refreshCart();

        // Build a hidden form and POST to eSewa (their API requires form submission, not redirect)
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentUrl;
        Object.entries(formData as Record<string, string>).forEach(([key, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });
        document.body.appendChild(form);
        form.submit();

      } else {
        // Khalti
        const { data: payRes } = await paymentsApi.initiateKhalti(order.id);
        const { paymentUrl } = payRes.data;
        await refreshCart();
        window.location.href = paymentUrl;
      }
    } catch (err: any) {
      toast.error(getErrorMsg(err, 'Checkout failed'));
    }
  };

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-black text-gray-900 mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-2 space-y-5 order-2 lg:order-1">
            {/* Shipping */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-black text-gray-900 text-lg">Shipping Details</h2>
                {savedAddresses.length > 0 && (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setAddrOpen(!addrOpen)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Saved Addresses
                      <ChevronDown className={`w-3 h-3 transition-transform ${addrOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {addrOpen && (
                      <div className="absolute right-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {savedAddresses.map((addr) => (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => applyAddress(addr)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                          >
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold text-gray-700">{addr.label}</span>
                              {addr.isDefault && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Default</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{addr.name} · {addr.phone}</p>
                            <p className="text-xs text-gray-400">{addr.address}, {addr.city}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { name: 'shippingName', label: 'Full Name', placeholder: 'Jane Doe', col: 2 },
                  { name: 'shippingPhone', label: 'Phone', placeholder: '98XXXXXXXX', col: 1 },
                  { name: 'shippingAddress', label: 'Address', placeholder: 'Street, Locality', col: 2 },
                  { name: 'shippingCity', label: 'City', placeholder: 'Kathmandu', col: 1 },
                  { name: 'shippingState', label: 'Province', placeholder: 'Bagmati', col: 1 },
                  { name: 'shippingZip', label: 'ZIP Code', placeholder: '44600', col: 1 },
                ].map(({ name, label, placeholder, col }) => (
                  <div key={name} className={col === 2 ? 'sm:col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
                    <input {...register(name as any)} placeholder={placeholder}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                    {errors[name as keyof FormData] && <p className="text-xs text-red-500 mt-1">Required</p>}
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Order Notes (optional)</label>
                  <textarea {...register('notes')} rows={2} placeholder="Any special instructions..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h2 className="font-black text-gray-900 text-lg mb-5">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'stripe', label: 'Credit / Debit Card', sub: 'Visa, Mastercard, Amex', icon: <CreditCard className="w-5 h-5 text-blue-600" /> },
                  { value: 'esewa', label: 'eSewa', sub: 'Pay with eSewa digital wallet', icon: <span className="text-green-600 font-bold text-sm">eSewa</span> },
                  { value: 'khalti', label: 'Khalti', sub: 'Pay with Khalti digital wallet', icon: <span className="text-purple-600 font-bold text-sm">Khalti</span> },
                ].map((m) => (
                  <label key={m.value} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === m.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" {...register('paymentMethod')} value={m.value} className="sr-only" />
                    <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">{m.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                      <p className="text-xs text-gray-500">{m.sub}</p>
                    </div>
                    {paymentMethod === m.value && <div className="ml-auto w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>}
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-4 bg-brand-gradient text-white font-semibold rounded-2xl hover:opacity-90 disabled:opacity-60 transition-opacity shadow-sm text-base">
              {isSubmitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {isSubmitting ? 'Processing...' : `Pay ${formatPrice(finalTotal)}`}
            </button>
          </form>

          {/* Order Summary */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:sticky lg:top-20 space-y-4">
              <h3 className="font-black text-gray-900">Order Summary</h3>

              {/* Items */}
              <div className="space-y-3">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600 flex-1 truncate pr-2">{item.variant.product.title} ×{item.qty}</span>
                    <span className="font-medium text-gray-900">{formatPrice(Number(item.variant.price) * item.qty)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              {!appliedCoupon ? (
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text" placeholder="Coupon code"
                      value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={e => e.key === 'Enter' && applyCoupon()}
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 font-mono tracking-wider"
                    />
                  </div>
                  <button
                    type="button" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
                    className="px-3 py-2 text-xs font-bold bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 flex-shrink-0"
                  >
                    {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-green-800 font-mono">{appliedCoupon.code}</p>
                    <p className="text-xs text-green-600">{appliedCoupon.label}</p>
                  </div>
                  <button type="button" onClick={removeCoupon} className="text-green-600 hover:text-green-800 flex-shrink-0">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Totals */}
              <div className="border-t border-gray-100 pt-3 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.subtotal)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>−{formatPrice(appliedCoupon.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
