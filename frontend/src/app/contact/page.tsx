'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, Loader2, MessageSquare } from 'lucide-react';

const TOPICS = [
  'Order Issue', 'Returns & Refunds', 'Payment Problem',
  'Design Upload Help', 'Vendor Enquiry', 'Other',
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    setError('');
    try {
      // Simulate sending — replace with real API call when backend email endpoint is ready
      await new Promise(res => setTimeout(res, 1200));
      setSent(true);
    } catch {
      setError('Something went wrong. Please email us directly at support@ap.com');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen" style={{ background: 'var(--page-bg)' }}>

        {/* Hero */}
        <section className="bg-brand-ink py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 border border-white/20 mb-4">
              <MessageSquare className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white mb-3">Contact Us</h1>
            <p className="text-gray-300 text-sm">We're here to help. Reach out and we'll respond within 24 hours.</p>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* Contact info */}
            <div className="space-y-4">
              <h2 className="font-black text-gray-900 text-lg">Get in Touch</h2>

              {[
                { icon: <Mail className="w-5 h-5 text-blue-600" />, bg: 'bg-blue-50', label: 'Email', value: 'support@ap.com', href: 'mailto:support@ap.com' },
                { icon: <Phone className="w-5 h-5 text-green-600" />, bg: 'bg-green-50', label: 'Phone', value: '+977 98XXXXXXXX', href: 'tel:+97798XXXXXXXX' },
                { icon: <MapPin className="w-5 h-5 text-purple-600" />, bg: 'bg-purple-50', label: 'Location', value: 'Kathmandu, Nepal', href: null },
                { icon: <Clock className="w-5 h-5 text-orange-600" />, bg: 'bg-orange-50', label: 'Hours', value: 'Sun–Fri, 9am–6pm NPT', href: null },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">{item.value}</a>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-blue-700 mb-1">Quick links</p>
                <div className="space-y-1.5">
                  <Link href="/track-order" className="block text-sm text-blue-600 hover:underline">→ Track an order</Link>
                  <Link href="/returns" className="block text-sm text-blue-600 hover:underline">→ Returns & Refunds</Link>
                  <Link href="/faq" className="block text-sm text-blue-600 hover:underline">→ FAQ</Link>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8">
                {sent ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Message Sent!</h3>
                    <p className="text-gray-500 text-sm mb-6">
                      Thanks for reaching out. We'll reply to <strong>{form.email}</strong> within 24 hours.
                    </p>
                    <button onClick={() => { setSent(false); setForm({ name: '', email: '', topic: '', message: '' }); }}
                      className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors">
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <h2 className="font-black text-gray-900 text-lg mb-1">Send a Message</h2>
                    <p className="text-sm text-gray-400 mb-4">Fill in the form and we'll get back to you as soon as possible.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Name <span className="text-red-400">*</span></label>
                        <input name="name" value={form.name} onChange={handleChange} required
                          placeholder="Priya Sharma"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address <span className="text-red-400">*</span></label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} required
                          placeholder="priya@example.com"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Topic</label>
                      <select name="topic" value={form.topic} onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 appearance-none">
                        <option value="">Select a topic...</option>
                        {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1.5">Message <span className="text-red-400">*</span></label>
                      <textarea name="message" value={form.message} onChange={handleChange} required rows={5}
                        placeholder="Describe your issue or question in detail. Include your order ID if relevant..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-gray-50 resize-none" />
                      <p className="text-xs text-gray-400 mt-1">{form.message.length}/1000 characters</p>
                    </div>

                    {error && (
                      <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
                    )}

                    <button type="submit" disabled={sending || !form.name || !form.email || !form.message}
                      className="w-full py-3 bg-brand-gradient text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm">
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {sending ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
