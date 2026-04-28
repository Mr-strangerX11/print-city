import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Shield } from 'lucide-react';

export const metadata = { title: 'Privacy Policy' };

const sections = [
  {
    title: 'Information We Collect',
    body: `We collect information you provide when you create an account, place an order, or contact us. This includes your name, email address, phone number, shipping address, and payment details. We also automatically collect technical data such as your IP address, browser type, and pages visited.`,
  },
  {
    title: 'How We Use Your Information',
    body: `We use your information to process orders and payments, send order updates and shipping notifications, improve our platform and personalize your experience, respond to customer support requests, and send promotional communications (with your consent).`,
  },
  {
    title: 'Sharing Your Information',
    body: `We share your information with vendors to fulfill your orders, payment processors (Stripe, eSewa, Khalti) to handle transactions, and shipping partners to deliver your orders. We do not sell your personal information to third parties.`,
  },
  {
    title: 'Data Security',
    body: `We implement industry-standard security measures to protect your data, including SSL/TLS encryption, secure password hashing, and regular security audits. However, no method of transmission over the internet is 100% secure.`,
  },
  {
    title: 'Cookies',
    body: `We use essential cookies to keep you logged in and maintain your cart. We also use analytics cookies to understand how visitors use our site. You can disable non-essential cookies through your browser settings.`,
  },
  {
    title: 'Your Rights',
    body: `You have the right to access, correct, or delete your personal information. You can update your profile information from your dashboard. To request account deletion or a copy of your data, please contact us at privacy@apmarketplace.com.`,
  },
  {
    title: 'Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. We will notify you of significant changes by email or by posting a notice on our website. Continued use of our services after changes constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Legal</span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
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
