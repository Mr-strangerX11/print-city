'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { LayoutDashboard, ShoppingBag, Users, Package, Paintbrush, CreditCard, Upload, Store, FileText, Printer, Truck, Tag, MessageSquare, BarChart2, Layers } from 'lucide-react';

const NAV = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: 'Orders', href: '/admin/orders', icon: <ShoppingBag className="w-4 h-4" /> },
  { label: 'Invoices', href: '/admin/invoices', icon: <FileText className="w-4 h-4" /> },
  { label: 'Production', href: '/admin/production', icon: <Printer className="w-4 h-4" /> },
  { label: 'Shipping', href: '/admin/shipping', icon: <Truck className="w-4 h-4" /> },
  { label: 'Coupons', href: '/admin/coupons', icon: <Tag className="w-4 h-4" /> },
  { label: 'Support', href: '/admin/support', icon: <MessageSquare className="w-4 h-4" /> },
  { label: 'Reports', href: '/admin/reports', icon: <BarChart2 className="w-4 h-4" /> },
  { label: 'Custom Orders', href: '/admin/custom-orders', icon: <Paintbrush className="w-4 h-4" /> },
  { label: 'Products', href: '/admin/products', icon: <Package className="w-4 h-4" /> },
  { label: 'Categories', href: '/admin/categories', icon: <Layers className="w-4 h-4" /> },
  { label: 'Vendors', href: '/admin/vendors', icon: <Store className="w-4 h-4" /> },
  { label: 'Users', href: '/admin/users', icon: <Users className="w-4 h-4" /> },
  { label: 'Payouts', href: '/admin/payouts', icon: <CreditCard className="w-4 h-4" /> },
  { label: 'CSV Import', href: '/admin/import', icon: <Upload className="w-4 h-4" /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && user.role !== 'ADMIN') router.push('/');
  }, [user, loading, router]);
  if (loading || !user) return null;
  return <DashboardShell title="Admin" navItems={NAV}>{children}</DashboardShell>;
}
