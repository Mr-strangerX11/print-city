import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { RotateCcw, Clock, ShieldCheck, AlertCircle, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

export const metadata = { title: 'Returns & Refunds | AP' };

const ELIGIBLE = [
  'Item arrived damaged or defective',
  'Wrong item or wrong size was delivered',
  'Significant print quality issue (fading, cracking, misalignment)',
  'Item never arrived after 14 business days',
];

const NOT_ELIGIBLE = [
  'Change of mind or incorrect size ordered',
  'Custom/personalised designs (unless defective)',
  'Items that have been worn, washed, or altered',
  'Orders returned without prior approval',
];

const STEPS = [
  { step: '01', title: 'Contact Support', desc: 'Email us at support@ap.com within 7 days of receiving your order. Include your order ID, photos of the issue, and a brief description.' },
  { step: '02', title: 'Get Approval', desc: 'Our team reviews your request within 1–2 business days. We\'ll email you an RMA (Return Merchandise Authorization) number if approved.' },
  { step: '03', title: 'Ship Item Back', desc: 'Pack the item securely and ship it to our returns address with the RMA number clearly marked on the package.' },
  { step: '04', title: 'Refund Processed', desc: 'Once we receive and inspect the item, your refund is processed within 5–7 business days to your original payment method.' },
];

export default function ReturnsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: 'var(--page-bg)' }}>

        {/* Hero */}
        <section className="bg-brand-ink py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 mb-4">
              <RotateCcw className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Returns &amp; Refunds</h1>
            <p className="text-gray-300 text-sm max-w-md mx-auto">We stand behind our print quality. If something isn't right, we'll make it right.</p>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">

          {/* Policy summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: <Clock className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', title: '7-Day Window', desc: 'Report issues within 7 days of delivery' },
              { icon: <ShieldCheck className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', title: 'Full Refund', desc: 'Eligible returns get 100% refund' },
              { icon: <RotateCcw className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', title: 'Free Returns', desc: 'No cost for defective or wrong items' },
            ].map(item => (
              <div key={item.title} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-start gap-3">
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Eligible / Not eligible */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="font-black text-gray-900">Eligible for Return</h2>
              </div>
              <ul className="space-y-3">
                {ELIGIBLE.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <XCircle className="w-5 h-5 text-red-500" />
                <h2 className="font-black text-gray-900">Not Eligible</h2>
              </div>
              <ul className="space-y-3">
                {NOT_ELIGIBLE.map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="font-black text-gray-900 mb-6 text-lg">How to Return an Item</h2>
            <div className="space-y-6">
              {STEPS.map((s, i) => (
                <div key={s.step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                      {s.step}
                    </div>
                    {i < STEPS.length - 1 && <div className="w-0.5 flex-1 bg-gray-100 my-2" />}
                  </div>
                  <div className="pb-2">
                    <h3 className="font-bold text-gray-900 mb-1">{s.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Important note */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-800 text-sm mb-1">Custom Designs</p>
              <p className="text-sm text-amber-700 leading-relaxed">
                Custom and personalised orders are final sale unless defective or incorrect. Please double-check all details — design, size, and quantity — before confirming your order.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
            <p className="font-bold text-gray-900 mb-1">Need to start a return?</p>
            <p className="text-sm text-gray-500 mb-4">Contact our support team and we'll guide you through the process.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/contact"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-brand-gradient text-white font-semibold rounded-xl text-sm hover:opacity-90 transition-opacity">
                Contact Support <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/track-order"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-gray-100 text-gray-700 font-semibold rounded-xl text-sm hover:bg-gray-200 transition-colors">
                Track My Order
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
