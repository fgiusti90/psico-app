// src/components/ui/FeeSemaphore.tsx
'use client';

interface FeeSemaphoreProps {
  percentage: number;
}

export function FeeSemaphore({ percentage }: FeeSemaphoreProps) {
  let colorClass: string;
  let label: string;

  if (percentage <= 5) {
    colorClass = 'bg-green-500';
    label = 'OK';
  } else if (percentage <= 15) {
    colorClass = 'bg-yellow-500';
    label = 'Revisar';
  } else {
    colorClass = 'bg-red-500';
    label = 'Ajustar';
  }

  return (
    <span className={`${colorClass} text-white text-xs font-medium px-2 sm:px-2.5 py-1 rounded-full whitespace-nowrap`}>
      {label} ({percentage.toFixed(1)}%)
    </span>
  );
}