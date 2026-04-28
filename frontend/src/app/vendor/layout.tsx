'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LayoutDashboard, Package, DollarSign, CreditCard, Settings, FileText } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/vendor/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'My Designs', href: '/vendor/designs', icon: <Package className="w-4 h-4" /> },
  { label: 'Earnings', href: '/vendor/earnings', icon: <DollarSign className="w-4 h-4" /> },
  { label: 'Invoices', href: '/vendor/invoices', icon: <FileText className="w-4 h-4" /> },
  { label: 'Payouts', href: '/vendor/payouts', icon: <CreditCard className="w-4 h-4" /> },
  { label: 'Settings', href: '/vendor/settings', icon: <Settings className="w-4 h-4" /> },
];

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'VENDOR') router.push('/');
  }, [user, loading, router]);
  if (loading || !user) return null;
  return <DashboardShell title="Vendor Hub" navItems={NAV}>{children}</DashboardShell>;
}
