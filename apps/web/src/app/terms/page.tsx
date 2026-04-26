import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FileText } from 'lucide-react';

export const metadata = { title: 'Terms of Service' };

const sections = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using AP Marketplace, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. We reserve the right to update these terms at any time, with notice provided via email or site announcement.`,
  },
  {
    title: '2. User Accounts',
    body: `You must create an account to place orders or sell on our platform. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must be at least 16 years old to use our services.`,
  },
  {
    title: '3. Vendor Responsibilities',
    body: `Vendors are responsible for the accuracy of product listings, fulfilling orders in a timely manner, maintaining adequate stock levels, and complying with all applicable laws. Vendors must not list counterfeit, prohibited, or misleading products. AP Marketplace reserves the right to suspend or terminate vendor accounts for policy violations.`,
  },
  {
    title: '4. Orders and Payments',
    body: `Orders are binding once confirmed. Prices are displayed in Nepalese Rupees (NPR). Payment is processed securely through our payment partners. We reserve the right to cancel orders in cases of pricing errors, payment fraud, or stock unavailability. All sales are subject to our Returns & Refunds policy.`,
  },
  {
    title: '5. Intellectual Property',
    body: `Vendors retain ownership of their original designs. By listing on AP Marketplace, vendors grant us a non-exclusive license to display, reproduce, and promote their products on our platform. Vendors must not infringe third-party intellectual property rights.`,
  },
  {
    title: '6. Prohibited Conduct',
    body: `You may not use our platform to post false or misleading content, engage in fraudulent transactions, harass or harm other users, attempt to circumvent our security systems, or violate any applicable laws or regulations.`,
  },
  {
    title: '7. Limitation of Liability',
    body: `AP Marketplace acts as a marketplace connecting buyers and vendors. We are not responsible for the quality, safety, or legality of items listed by vendors. Our liability is limited to the amount paid for the specific transaction giving rise to the claim.`,
  },
  {
    title: '8. Governing Law',
    body: `These Terms are governed by the laws of Nepal. Any disputes shall be subject to the exclusive jurisdiction of the courts located in Kathmandu, Nepal.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-10">Last updated: April 2026</p>

          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {sections.map((s, i) => (
              <div key={i} className="p-6">
                <h2 className="font-black text-gray-900 mb-3">{s.title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
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
