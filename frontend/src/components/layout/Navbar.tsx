'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart, Search, Menu, X, LogOut, LayoutDashboard,
  Store, Package, Bell, ChevronDown, Sparkles, UserCircle2,
  Heart, MapPin, User,
} from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { notificationsApi } from '@/lib/api';
import { cn, formatRelative } from '@/lib/utils';
import { LogoImage } from '@/components/ui/LogoImage';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function Navbar() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifHasMore, setNotifHasMore] = useState(false);
  const [notifLoadingMore, setNotifLoadingMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
      setSearchQuery('');
    }
  };

  const dashboardLink =
    user?.role === 'ADMIN' ? '/admin' :
    user?.role === 'VENDOR' ? '/vendor/dashboard' : '/dashboard';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!user) return;
    notificationsApi.unreadCount()
      .then(({ data }) => setUnreadCount(data.data?.count ?? 0))
      .catch(() => {});
  }, [user]);

  const openNotifications = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    setUserMenuOpen(false);
    if (next && notifications.length === 0) {
      notificationsApi.list({ limit: 20 })
        .then(({ data }) => {
          const d = data.data;
          setNotifications(d.items ?? []);
          setNotifHasMore(d.hasMore ?? false);
        })
        .catch(() => {});
    }
  };

  const loadMoreNotifications = async () => {
    setNotifLoadingMore(true);
    try {
      const { data } = await notificationsApi.list({ limit: 20, skip: notifications.length });
      const d = data.data;
      setNotifications(prev => [...prev, ...(d.items ?? [])]);
      setNotifHasMore(d.hasMore ?? false);
    } catch { /* ignore */ }
    finally { setNotifLoadingMore(false); }
  };

  const markAllRead = async () => {
    await notificationsApi.markAllRead().catch(() => {});
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, readAt: new Date().toISOString() })));
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <nav
      className={cn(
        'sticky top-0 z-50 backdrop-blur-xl border-b transition-all duration-200',
        scrolled ? 'shadow-lg shadow-black/10 dark:shadow-black/30' : '',
      )}
      style={{ background: 'var(--nav-bg)', borderBottomColor: 'var(--nav-border)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 group hover:opacity-90 transition-opacity">
            <LogoImage
              width={120}
              height={48}
              className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
              fallbackClassName="text-xl font-black text-[var(--text-heading)]"
            />
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4 lg:mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-faint)' }} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search designs, products, vendors..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/40 transition-all"
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-heading)',
                }}
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-lg transition-colors" style={{ background: 'var(--hover-bg)' }}>
                <Search className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-0.5">
            {/* Nav Links */}
            <div className="hidden md:flex items-center gap-0.5">
              <Link href="/products"
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[var(--hover-bg)]"
                style={{ color: 'var(--text-body)' }}>
                Products
              </Link>
              <Link href="/vendors"
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-[var(--hover-bg)]"
                style={{ color: 'var(--text-body)' }}>
                Vendors
              </Link>
              <Link href="/design-studio"
                className="hidden lg:flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-purple-500 dark:text-purple-300 hover:bg-purple-500/10 transition-colors">
                <Sparkles className="w-3.5 h-3.5" /> Custom Design
              </Link>
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications */}
            {user && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={openNotifications}
                  className="relative p-2 rounded-xl transition-colors hover:bg-[var(--hover-bg)]"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" style={{ color: 'var(--text-body)' }} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-black px-0.5 leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-12 w-80 rounded-2xl shadow-2xl z-50 animate-slide-up overflow-hidden"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm" style={{ color: 'var(--text-heading)' }}>Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">{unreadCount}</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 font-medium">
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                      {notifications.length === 0 ? (
                        <div className="px-4 py-10 text-center">
                          <Bell className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-faint)' }} />
                          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No notifications yet</p>
                        </div>
                      ) : (
                        <>
                          {notifications.map((n: any) => (
                            <div key={n.id}
                              className={cn('px-4 py-3 transition-colors cursor-default hover:bg-[var(--hover-bg)]', !n.readAt && 'bg-purple-500/5')}>
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn('text-sm leading-snug', !n.readAt ? 'font-semibold' : '')}
                                  style={{ color: !n.readAt ? 'var(--text-heading)' : 'var(--text-body)' }}>
                                  {n.title}
                                </p>
                                {!n.readAt && <span className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0 mt-1" />}
                              </div>
                              {n.message && <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--text-faint)' }}>{n.message}</p>}
                              <p className="text-[11px] mt-1" style={{ color: 'var(--text-faint)' }}>{formatRelative(n.createdAt)}</p>
                            </div>
                          ))}
                          {notifHasMore && (
                            <button
                              onClick={loadMoreNotifications}
                              disabled={notifLoadingMore}
                              className="w-full py-2.5 text-xs text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 font-medium hover:bg-[var(--hover-bg)] transition-colors disabled:opacity-50"
                            >
                              {notifLoadingMore ? 'Loading...' : 'Load more'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="px-4 py-2.5" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--hover-bg)' }}>
                      <Link href="/dashboard/orders" onClick={() => setNotifOpen(false)}
                        className="block text-center text-xs font-medium text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors">
                        View all activity →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative p-2 rounded-xl transition-colors hover:bg-[var(--hover-bg)]" aria-label="Cart">
              <ShoppingCart className="w-5 h-5" style={{ color: 'var(--text-body)' }} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-brand-gradient text-white text-[9px] rounded-full flex items-center justify-center font-black px-1 shadow-sm">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {/* User Menu or Auth Icon */}
            {user ? (
              <div className="relative" ref={userRef}>
                <button
                  onClick={() => { setUserMenuOpen(v => !v); setNotifOpen(false); }}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl transition-colors hover:bg-[var(--hover-bg)]"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-black shadow-sm ring-2 ring-purple-500/30">
                    {(user.name.trim()[0] ?? 'U').toUpperCase()}
                  </div>
                  <ChevronDown className={cn('w-3.5 h-3.5 hidden sm:block transition-transform duration-200', userMenuOpen && 'rotate-180')} style={{ color: 'var(--text-faint)' }} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-64 rounded-2xl shadow-2xl py-1.5 z-50 animate-slide-up overflow-hidden"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border-color)' }}>
                    <div className="px-4 py-3 mb-1" style={{ background: 'var(--hover-bg)', borderBottom: '1px solid var(--border-color)' }}>
                      <div className="flex items-center gap-2.5">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-purple-500/30" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-black flex-shrink-0">
                            {(user.name.trim()[0] ?? 'U').toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-heading)' }}>{user.name}</p>
                          <p className="text-xs truncate" style={{ color: 'var(--text-faint)' }}>{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {user.role === 'CUSTOMER' && (
                      <>
                        {[
                          { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
                          { href: '/dashboard/orders',   icon: Package,         label: 'All Orders' },
                          { href: '/dashboard/wishlist', icon: Heart,           label: 'Wishlist', badge: wishlistIds.length > 0 ? wishlistIds.length : null },
                          { href: '/cart',               icon: ShoppingCart,    label: 'Cart', badge: itemCount > 0 ? itemCount : null },
                          { href: '/dashboard/address',  icon: MapPin,          label: 'Addresses' },
                          { href: '/dashboard/profile',  icon: User,            label: 'My Profile' },
                        ].map(({ href, icon: Icon, label, badge }) => (
                          <Link key={href} href={href} onClick={() => setUserMenuOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-[var(--hover-bg)]"
                            style={{ color: 'var(--text-body)' }}>
                            <span className="flex items-center gap-3">
                              <Icon className="w-4 h-4" style={{ color: 'var(--text-faint)' }} /> {label}
                            </span>
                            {badge && <span className="px-1.5 py-0.5 bg-purple-500/15 text-purple-500 dark:text-purple-400 text-[11px] font-bold rounded-full">{badge}</span>}
                          </Link>
                        ))}
                      </>
                    )}

                    {user.role === 'VENDOR' && (
                      <>
                        {[
                          { href: '/vendor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                          { href: '/vendor/designs',   icon: Store,           label: 'My Designs' },
                          { href: '/vendor/earnings',  icon: Package,         label: 'Earnings' },
                        ].map(({ href, icon: Icon, label }) => (
                          <Link key={href} href={href} onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--hover-bg)]"
                            style={{ color: 'var(--text-body)' }}>
                            <Icon className="w-4 h-4" style={{ color: 'var(--text-faint)' }} /> {label}
                          </Link>
                        ))}
                      </>
                    )}

                    {user.role === 'ADMIN' && (
                      <Link href="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-[var(--hover-bg)]"
                        style={{ color: 'var(--text-body)' }}>
                        <LayoutDashboard className="w-4 h-4" style={{ color: 'var(--text-faint)' }} /> Admin Panel
                      </Link>
                    )}

                    <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
                    <button onClick={logout}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 transition-colors">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className="p-2 rounded-xl transition-colors hover:bg-[var(--hover-bg)]" aria-label="Account">
                <UserCircle2 className="w-6 h-6" style={{ color: 'var(--text-body)' }} />
              </Link>
            )}

            {/* Mobile Toggle */}
            <button onClick={() => setMenuOpen(v => !v)} className="md:hidden p-2 rounded-xl transition-colors hover:bg-[var(--hover-bg)] ml-0.5">
              {menuOpen
                ? <X className="w-5 h-5" style={{ color: 'var(--text-body)' }} />
                : <Menu className="w-5 h-5" style={{ color: 'var(--text-body)' }} />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-4 py-4 space-y-1 animate-fade-in shadow-2xl"
          style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-color)' }}>
          <form onSubmit={handleSearch} className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-faint)' }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search designs, products..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)', color: 'var(--text-heading)' }}
            />
          </form>
          {[
            { href: '/products',      label: 'Products' },
            { href: '/vendors',       label: 'Vendors' },
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-[var(--hover-bg)]"
              style={{ color: 'var(--text-body)' }}>
              {label}
            </Link>
          ))}
          <Link href="/design-studio" onClick={() => setMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl hover:bg-purple-500/10 transition-colors text-purple-500 dark:text-purple-300">
            <Sparkles className="w-4 h-4" /> Custom Design
          </Link>
          {user && user.role === 'CUSTOMER' && (
            <>
              {[
                { href: '/dashboard',          icon: LayoutDashboard, label: 'Overview' },
                { href: '/dashboard/orders',   icon: Package,         label: 'All Orders' },
                { href: '/dashboard/address',  icon: MapPin,          label: 'Addresses' },
                { href: '/dashboard/profile',  icon: User,            label: 'My Profile' },
              ].map(({ href, icon: Icon, label }) => (
                <Link key={href} href={href} onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-[var(--hover-bg)]"
                  style={{ color: 'var(--text-body)' }}>
                  <Icon className="w-4 h-4" style={{ color: 'var(--text-faint)' }} /> {label}
                </Link>
              ))}
            </>
          )}
          {user && user.role !== 'CUSTOMER' && (
            <Link href={dashboardLink} onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-[var(--hover-bg)]"
              style={{ color: 'var(--text-body)' }}>
              <LayoutDashboard className="w-4 h-4" style={{ color: 'var(--text-faint)' }} /> Dashboard
            </Link>
          )}
          {user ? (
            <button onClick={() => { logout(); setMenuOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-500/10 font-medium rounded-xl mt-2 pt-3"
              style={{ borderTop: '1px solid var(--border-color)' }}>
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          ) : (
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-[var(--hover-bg)] mt-2 pt-3"
              style={{ color: 'var(--text-body)', borderTop: '1px solid var(--border-color)' }}>
              <UserCircle2 className="w-4 h-4" style={{ color: 'var(--text-faint)' }} /> Sign In to Account
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
