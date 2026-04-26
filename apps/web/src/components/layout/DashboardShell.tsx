'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface DashboardShellProps {
  children: React.ReactNode;
  title: string;
  navItems: NavItem[];
}

export function DashboardShell({ children, title, navItems }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--page-bg)' }}>
      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
        style={{ background: 'var(--surface)', borderRight: '1px solid var(--border-color)' }}>

        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center text-white font-bold text-sm">AP</div>
            <span className="font-bold text-lg" style={{ color: 'var(--text-heading)' }}>{title}</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                  active
                    ? 'bg-brand-gradient text-white shadow-sm'
                    : 'hover:bg-[var(--hover-bg)]',
                )}
                style={active ? {} : { color: 'var(--text-body)' }}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4" style={{ borderTop: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'var(--hover-bg)' }}>
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate" style={{ color: 'var(--text-heading)' }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{user?.email}</p>
            </div>
          </div>
          <button onClick={logout}
            className="mt-2 w-full px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors text-left">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="h-16 flex items-center justify-between px-4 lg:hidden"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-[var(--hover-bg)] transition-colors">
              <Menu className="w-5 h-5" style={{ color: 'var(--text-body)' }} />
            </button>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center text-white font-bold text-xs">AP</div>
              <span className="font-bold" style={{ color: 'var(--text-heading)' }}>{title}</span>
            </Link>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
