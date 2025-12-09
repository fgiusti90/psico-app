// src/components/ui/ChartTooltips.tsx
'use client';

import { formatCurrency } from '@/lib/utils';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

export function BillingTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 sm:p-3 rounded-lg shadow-lg border border-stone-200">
        <p className="font-semibold text-stone-700 capitalize text-sm">{label}</p>
        <p className="text-teal-600 font-bold text-sm">{formatCurrency(payload[0].value)}</p>
      </div>
    );
  }
  return null;
}

export function SessionsTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2 sm:p-3 rounded-lg shadow-lg border border-stone-200">
        <p className="font-semibold text-stone-700 capitalize text-sm">{label}</p>
        <p className="text-teal-600 font-bold text-sm">{payload[0].value} prestaciones</p>
      </div>
    );
  }
  return null;
}
