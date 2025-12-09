// src/components/tabs/InflationTab.tsx
'use client';

import React, { useMemo } from 'react';
import { formatMonthYear } from '@/lib/utils';
import type { InflationRecord } from '@/types/database';

interface InflationTabProps {
  inflationRecords: InflationRecord[];
  onNewInflation: () => void;
  onDeleteInflation: (id: string) => void;
}

export function InflationTab({ inflationRecords, onNewInflation, onDeleteInflation }: InflationTabProps) {
  const accumulatedInflation = useMemo(() => {
    const sorted = [...inflationRecords].sort((a, b) =>
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
    let accumulated = 0;
    return sorted.map(r => {
      accumulated += r.percentage;
      return { ...r, accumulated };
    });
  }, [inflationRecords]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold">Registros de Inflación</h2>
        <button
          onClick={onNewInflation}
          className="px-4 py-2 sm:px-5 sm:py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          + Registrar inflación
        </button>
      </div>

      {/* Inflación acumulada total */}
      {accumulatedInflation.length > 0 && (
        <div className="bg-teal-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <p className="text-xs sm:text-sm text-teal-700">Inflación acumulada total</p>
          <p className="text-2xl sm:text-3xl font-bold text-teal-600">
            {accumulatedInflation[accumulatedInflation.length - 1]?.accumulated.toFixed(1)}%
          </p>
          <p className="text-xs text-teal-600 mt-1">
            Desde {formatMonthYear(accumulatedInflation[0]?.month)} hasta {formatMonthYear(accumulatedInflation[accumulatedInflation.length - 1]?.month)}
          </p>
        </div>
      )}

      {/* Lista de registros */}
      <div className="space-y-2">
        {accumulatedInflation.slice().reverse().map(record => (
          <div
            key={record.id}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-stone-50 p-3 sm:p-4 rounded-lg gap-2"
          >
            <div className="flex items-center justify-between sm:justify-start gap-3 sm:gap-4">
              <span className="font-medium capitalize text-sm sm:text-base">
                {formatMonthYear(record.month)}
              </span>
              <span className="text-teal-600 font-bold text-base sm:text-lg">{record.percentage}%</span>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
              <span className="text-xs sm:text-sm text-stone-500">
                Acumulado: <span className="font-semibold">{record.accumulated.toFixed(1)}%</span>
              </span>
              <button
                onClick={() => onDeleteInflation(record.id)}
                className="text-red-500 hover:text-red-700 text-xl leading-none px-2"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {accumulatedInflation.length === 0 && (
          <p className="text-center text-stone-400 py-10">
            No hay registros de inflación
          </p>
        )}
      </div>
    </>
  );
}
