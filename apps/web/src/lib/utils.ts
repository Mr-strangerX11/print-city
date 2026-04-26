import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number | string, currency = 'NPR') {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(num);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatRelative(date: string | Date) {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PRINTING: 'bg-purple-100 text-purple-800',
  PACKED: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-gray-100 text-gray-800',
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  ISSUED: 'bg-blue-100 text-blue-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
};

export const VENDOR_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  SUSPENDED: 'bg-red-100 text-red-800',
};

export const ORDER_TIMELINE = [
  { status: 'PENDING', label: 'Order Placed', icon: '📦' },
  { status: 'CONFIRMED', label: 'Confirmed', icon: '✅' },
  { status: 'PRINTING', label: 'Printing', icon: '🖨️' },
  { status: 'PACKED', label: 'Packed', icon: '📫' },
  { status: 'SHIPPED', label: 'Shipped', icon: '🚚' },
  { status: 'DELIVERED', label: 'Delivered', icon: '🎉' },
];

export function getOrderStepIndex(status: string) {
  return ORDER_TIMELINE.findIndex((s) => s.status === status);
}

export function getErrorMsg(err: any, fallback = 'Something went wrong'): string {
  const raw = err?.response?.data?.message;
  const msg = typeof raw === 'string'
    ? raw
    : raw?.message ?? raw?.error ?? raw?.[0]?.message;
  return String(msg ?? err?.response?.data?.error ?? err?.message ?? fallback);
}
