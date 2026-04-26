'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LayoutDashboard, Package, Heart, User, Upload, MapPin, ShoppingCart, FileText, MessageSquare } from 'lucide-react';

const NAV = [
  { label: 'Overview', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'All Orders', href: '/dashboard/orders', icon: <Package className="w-4 h-4" /> },
  { label: 'Invoices', href: '/dashboard/invoices', icon: <FileText className="w-4 h-4" /> },
  { label: 'Support', href: '/dashboard/support', icon: <MessageSquare className="w-4 h-4" /> },
  { label: 'Wishlist', href: '/dashboard/wishlist', icon: <Heart className="w-4 h-4" /> },
  { label: 'Addresses', href: '/dashboard/address', icon: <MapPin className="w-4 h-4" /> },
  { label: 'My Profile', href: '/dashboard/profile', icon: <User className="w-4 h-4" /> },
  { label: 'Cart', href: '/cart', icon: <ShoppingCart className="w-4 h-4" /> },
  { label: 'Design Studio', href: '/design-studio', icon: <Upload className="w-4 h-4" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'CUSTOMER') router.push('/');
  }, [user, loading, router]);
  if (loading || !user) return null;
  return <DashboardShell title="My Account" navItems={NAV}>{children}</DashboardShell>;
}
