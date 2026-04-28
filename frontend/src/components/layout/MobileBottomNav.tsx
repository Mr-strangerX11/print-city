'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3X3, Sparkles, ShoppingCart, User } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/products', icon: Grid3X3, label: 'Shop' },
  { href: '/design-studio', icon: Sparkles, label: 'Design', accent: true },
  { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: true },
  { href: '/dashboard', icon: User, label: 'Account', auth: true },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const { user } = useAuth();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden">
      {/* Blur bg */}
      <div className="absolute inset-0 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.15)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
        style={{ background: 'var(--nav-bg)', borderTop: '1px solid var(--nav-border)' }} />

      <div className="relative flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {NAV_ITEMS.map(({ href, icon: Icon, label, accent, badge, auth }) => {
          const active = isActive(href);
          const accountHref = user
            ? (user.role === 'ADMIN' ? '/admin' : user.role === 'VENDOR' ? '/vendor/dashboard' : '/dashboard')
            : '/login';
          const resolvedHref = auth ? accountHref : href;

          return (
            <Link
              key={label}
              href={resolvedHref}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 min-w-[56px]',
                accent
                  ? 'bg-brand-gradient text-white shadow-lg shadow-purple-500/40 scale-110 -translate-y-1'
                  : active
                  ? 'text-purple-500 dark:text-purple-400'
                  : 'text-gray-400 dark:text-white/40'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5', accent && 'w-5 h-5')} />
                {badge && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-0.5">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-semibold leading-none',
                accent && 'text-white',
              )}>
                {label}
              </span>
              {active && !accent && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-purple-500 dark:bg-purple-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
