'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HelpCircle, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQS = [
  {
    category: 'Orders & Shipping',
    items: [
      {
        q: 'How long does it take to receive my order?',
        a: 'Standard orders are printed and shipped within 2–4 business days. Delivery takes an additional 3–7 business days depending on your location. Total time from order to doorstep is typically 5–11 business days.',
      },
      {
        q: 'Do you offer nationwide delivery in Nepal?',
        a: 'Yes! We deliver to all major cities and districts across Nepal. Shipping rates and delivery times vary by location. Kathmandu Valley typically receives orders in 2–3 days after dispatch.',
      },
      {
        q: 'Can I track my order?',
        a: 'Absolutely. Once your order is shipped, you\'ll receive a tracking number via email. You can also use our Track Order page with your order ID at any time.',
      },
      {
        q: 'What happens if my order is lost in transit?',
        a: 'If your order doesn\'t arrive within 14 business days of the expected delivery date, contact our support team. We\'ll investigate with the courier and either resend your order or issue a full refund.',
      },
    ],
  },
  {
    category: 'Products & Printing',
    items: [
      {
        q: 'What printing methods do you use?',
        a: 'We use Direct-to-Garment (DTG) for apparel and UV printing for hard goods (mugs, phone cases). DTG produces vibrant, photo-quality prints that are wash-durable. All inks are eco-friendly.',
      },
      {
        q: 'What file formats do you accept for designs?',
        a: 'We accept PNG, JPG, SVG, and WebP files up to 10MB. For best results, upload PNG files at 300 DPI or higher with a transparent background. Minimum recommended size is 2000×2000 pixels.',
      },
      {
        q: 'Will my design look exactly the same on the product?',
        a: 'Colors may vary slightly between screen and print due to differences in color profiles (RGB vs CMYK). We recommend using CMYK color values when designing for print. Our preview tool gives you a close approximation.',
      },
      {
        q: 'Do you offer bulk or wholesale orders?',
        a: 'Yes! For orders of 20+ units, contact us for bulk pricing. We offer 10–30% discounts depending on quantity and product type. Custom packaging is also available for business orders.',
      },
    ],
  },
  {
    category: 'Payments',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept credit/debit cards via Stripe, eSewa, and Khalti. All payments are processed securely with SSL encryption. We do not store your card details.',
      },
      {
        q: 'When is my card charged?',
        a: 'Your card is charged immediately when you place an order. For custom design orders, payment is collected after our team reviews and confirms the final price.',
      },
      {
        q: 'Can I get a refund to my original payment method?',
        a: 'Yes, approved refunds are returned to your original payment method within 5–7 business days. eSewa and Khalti refunds may take 1–3 additional business days depending on your provider.',
      },
    ],
  },
  {
    category: 'Vendors & Selling',
    items: [
      {
        q: 'How do I become a vendor on AP?',
        a: 'Sign up as a Vendor during registration. Once your account is approved by our admin team, you can upload designs, set prices, and start selling. Approval typically takes 24–48 hours.',
      },
      {
        q: 'What commission does AP take?',
        a: 'AP takes a platform commission (default 15%) on each sale. The remainder goes to you as the vendor. Your commission rate may be adjusted by the admin team based on your sales volume.',
      },
      {
        q: 'When do I get paid as a vendor?',
        a: 'Vendor payouts are processed weekly, covering all delivered and paid orders from the previous week. You\'ll receive an email notification when a payout is initiated.',
      },
      {
        q: 'Can I sell custom design orders?',
        a: 'Custom design orders submitted by customers are managed by AP admins centrally. As a vendor, you earn from your listed designs being purchased by customers through the marketplace.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn('border border-gray-100 rounded-2xl overflow-hidden transition-all', open && 'shadow-sm')}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-sm text-gray-900 pr-4">{q}</span>
        <ChevronDown className={cn('w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-200', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-5 pb-5 bg-white">
          <div className="border-t border-gray-100 pt-4">
            <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState(FAQS[0].category);

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: 'var(--page-bg)' }}>

        {/* Hero */}
        <section className="bg-brand-ink py-16">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 mb-4">
              <HelpCircle className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Frequently Asked Questions</h1>
            <p className="text-gray-300 text-sm">Everything you need to know about ordering, printing, and selling on AP.</p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

            {/* Category nav */}
            <div className="md:col-span-1">
              <div className="sticky top-24 space-y-1">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-3">Categories</p>
                {FAQS.map(section => (
                  <button key={section.category} onClick={() => setActiveCategory(section.category)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      activeCategory === section.category
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    )}>
                    {section.category}
                  </button>
                ))}
              </div>
            </div>

            {/* FAQ list */}
            <div className="md:col-span-3 space-y-6">
              {FAQS.filter(s => s.category === activeCategory).map(section => (
                <div key={section.category}>
                  <h2 className="font-black text-gray-900 text-lg mb-4">{section.category}</h2>
                  <div className="space-y-2 bg-white rounded-2xl border border-gray-100 p-2">
                    {section.items.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
                  </div>
                </div>
              ))}

              {/* Still need help */}
              <div className="bg-brand-ink rounded-2xl p-6 text-center">
                <p className="text-white font-bold mb-1">Still have questions?</p>
                <p className="text-gray-400 text-sm mb-4">Our support team is happy to help.</p>
                <Link href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-gray-900 font-semibold rounded-xl text-sm hover:bg-gray-100 transition-colors">
                  Contact Support <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
