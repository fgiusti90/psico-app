// src/lib/utils.ts

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);
};

export const formatCurrencyShort = (amount: number): string => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}k`;
  }
  return `$${amount}`;
};

export const formatDate = (date: string | null): string => {
  if (!date) return '-';
  return new Date(date + 'T00:00:00').toLocaleDateString('es-AR');
};

export const formatMonthYear = (date: string): string => {
  return new Date(date + 'T00:00:00').toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric'
  });
};

export const formatMonthShort = (date: string): string => {
  return new Date(date + 'T00:00:00').toLocaleDateString('es-AR', {
    month: 'short'
  }).toUpperCase().replace('.', '');
};
