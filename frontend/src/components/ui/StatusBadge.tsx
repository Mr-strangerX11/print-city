import React from 'react';
import { cn, ORDER_STATUS_COLORS, PAYMENT_STATUS_COLORS, VENDOR_STATUS_COLORS, INVOICE_STATUS_COLORS } from '@/lib/utils';

type BadgeType = 'order' | 'payment' | 'vendor' | 'custom' | 'payout' | 'invoice';

interface StatusBadgeProps {
  status: string;
  type?: BadgeType;
  className?: string;
}

const CUSTOM_ORDER_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  REVIEWING: 'bg-blue-100 text-blue-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  PRINTING: 'bg-purple-100 text-purple-800',
  SHIPPED: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
};

const PRODUCT_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  ARCHIVED: 'bg-gray-100 text-gray-500',
};

export function StatusBadge({ status, type = 'order', className }: StatusBadgeProps) {
  let colorClass = '';
  switch (type) {
    case 'order': colorClass = ORDER_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'; break;
    case 'payment': colorClass = PAYMENT_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'; break;
    case 'vendor': colorClass = VENDOR_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'; break;
    case 'custom': colorClass = CUSTOM_ORDER_COLORS[status] ?? PRODUCT_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'; break;
    case 'invoice': colorClass = INVOICE_STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'; break;
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', colorClass, className)}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
