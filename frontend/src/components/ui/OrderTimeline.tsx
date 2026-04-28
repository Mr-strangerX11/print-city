import React from 'react';
import { cn, ORDER_TIMELINE, getOrderStepIndex } from '@/lib/utils';
import { CheckCircle, Circle } from 'lucide-react';

interface OrderTimelineProps {
  currentStatus: string;
  className?: string;
}

export function OrderTimeline({ currentStatus, className }: OrderTimelineProps) {
  if (currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED') {
    return (
      <div className={cn('flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100', className)}>
        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-lg">✕</div>
        <div>
          <p className="font-semibold text-red-700">{currentStatus === 'CANCELLED' ? 'Order Cancelled' : 'Order Refunded'}</p>
          <p className="text-sm text-red-500 mt-0.5">This order has been {currentStatus.toLowerCase()}.</p>
        </div>
      </div>
    );
  }

  const currentIdx = getOrderStepIndex(currentStatus);

  return (
    <div className={cn('space-y-0', className)}>
      {ORDER_TIMELINE.map((step, idx) => {
        const done = idx <= currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={step.status} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all',
                done ? 'bg-brand-gradient text-white shadow-sm' : 'bg-gray-100 text-gray-400',
              )}>
                {done ? <CheckCircle className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
              </div>
              {idx < ORDER_TIMELINE.length - 1 && (
                <div className={cn('w-0.5 h-8 mt-1', done ? 'bg-blue-500' : 'bg-gray-200')} />
              )}
            </div>
            <div className="pb-6">
              <p className={cn('text-sm font-semibold', done ? 'text-gray-900' : 'text-gray-400')}>
                {step.icon} {step.label}
              </p>
              {active && (
                <p className="text-xs text-blue-600 mt-0.5 font-medium">Current status</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
