// src/components/ui/StatCard.tsx
'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  subvalue?: string;
  icon: string;
}

export function StatCard({ label, value, subvalue, icon }: StatCardProps) {
  return (
    <div className="bg-stone-50 rounded-xl p-3 sm:p-4 flex items-center gap-3">
      <div className="text-2xl sm:text-3xl">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-lg sm:text-2xl font-bold text-teal-600 truncate">{value}</div>
        <div className="text-xs sm:text-sm text-stone-500">{label}</div>
        {subvalue && <div className="text-xs text-stone-400">{subvalue}</div>}
      </div>
    </div>
  );
}
