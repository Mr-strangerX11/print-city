import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Cookie } from 'lucide-react';

export const metadata = { title: 'Cookie Policy' };

const types = [
  {
    name: 'Essential Cookies',
    required: true,
    description: 'These cookies are necessary for the website to function. They enable core functionality such as security, authentication, and your shopping cart. You cannot opt out of these cookies.',
    examples: ['accessToken — keeps you logged in', 'refreshToken — silently renews your session', 'cart — persists your cart across pages'],
  },
  {
    name: 'Analytics Cookies',
    required: false,
    description: 'These cookies help us understand how visitors interact with our website, which pages are most popular, and where users drop off. The data is aggregated and anonymous.',
    examples: ['Page view tracking', 'Session duration', 'Referral source'],
  },
  {
    name: 'Preference Cookies',
    required: false,
    description: 'These cookies remember your preferences such as your selected region, language, or display settings to provide a more personalized experience on return visits.',
    examples: ['Currency preference', 'Recently viewed products'],
  },
];

export default function CookiePage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
              <Cookie className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-amber-600 uppercase tracking-wide">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Cookie Policy</h1>
          <p className="text-gray-500 mb-10">Last updated: April 2026</p>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
            <h2 className="font-black text-gray-900 mb-3">What Are Cookies?</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Cookies are small text files stored in your browser when you visit a website. They help us keep you logged in, remember your cart, and understand how you use our site so we can improve it.
            </p>
          </div>

          <div className="space-y-4">
            {types.map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-black text-gray-900">{t.name}</h2>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    t.required ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {t.required ? 'Required' : 'Optional'}
                  </span>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">{t.description}</p>
                <ul className="space-y-1">
                  {t.examples.map((ex, i) => (
                    <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />
                      {ex}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-4">
            <h2 className="font-black text-gray-900 mb-3">Managing Cookies</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              You can control and delete cookies through your browser settings. Note that disabling essential cookies will affect site functionality such as staying logged in. For more information, visit your browser's help documentation.
            </p>
          </div>

          <p className="text-center text-sm text-gray-400 mt-8">
            Questions? <Link href="/contact" className="text-blue-600 font-semibold hover:text-blue-700">Contact us</Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
