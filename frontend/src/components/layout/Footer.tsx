import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer style={{ background: 'var(--surface-alt)', borderTop: '1px solid var(--border-color)' }}>

      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 grid grid-cols-1 md:grid-cols-12 gap-10">

        {/* Brand */}
        <div className="md:col-span-4">
          <div className="mb-4">
            <Image
              src="/footer.png"
              alt="Print City"
              width={140}
              height={56}
              className="h-12 w-auto object-contain dark:brightness-0 dark:invert"
            />
          </div>
          <p className="text-sm leading-relaxed mb-6 max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Design. Print. Deliver. Premium custom merchandise from top independent creators, shipped nationwide.
          </p>
          <Link href="/register?role=VENDOR"
            className="inline-flex items-center gap-2 px-4 py-2 font-semibold text-xs rounded-xl transition-colors hover:bg-[var(--hover-bg)]"
            style={{ background: 'var(--hover-bg)', border: '1px solid var(--border-color)', color: 'var(--text-heading)' }}>
            Start selling <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Links */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8">
          {[
            {
              title: 'Shop', links: [
                { label: 'All Products',   href: '/products' },
                { label: 'T-Shirts',       href: '/products?category=t-shirts' },
                { label: 'Hoodies',        href: '/products?category=hoodies' },
                { label: 'Custom Design',  href: '/design-studio' },
                { label: 'Wishlist',       href: '/dashboard/wishlist' },
              ],
            },
            {
              title: 'Vendors', links: [
                { label: 'Browse Vendors',   href: '/vendors' },
                { label: 'Become a Vendor',  href: '/register?role=VENDOR' },
                { label: 'Vendor Dashboard', href: '/vendor/dashboard' },
                { label: 'Vendor Earnings',  href: '/vendor/earnings' },
              ],
            },
            {
              title: 'Support', links: [
                { label: 'Track Order',      href: '/track-order' },
                { label: 'Returns & Refunds', href: '/returns' },
                { label: 'Contact Us',       href: '/contact' },
                { label: 'FAQ',              href: '/faq' },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-bold text-sm mb-4" style={{ color: 'var(--text-heading)' }}>{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href}
                      className="text-sm transition-colors hover:text-purple-500 dark:hover:text-purple-400"
                      style={{ color: 'var(--text-muted)' }}>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 pb-24 md:pb-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>© {YEAR} AP Marketplace. All rights reserved.</p>
          <div className="flex items-center gap-6">
            {[
              { href: '/privacy', label: 'Privacy Policy' },
              { href: '/terms',   label: 'Terms of Service' },
              { href: '/cookie',  label: 'Cookie Policy' },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="text-xs transition-colors hover:text-[var(--text-muted)]"
                style={{ color: 'var(--text-faint)' }}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
