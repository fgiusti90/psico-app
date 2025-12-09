// src/components/tabs/FeesTab.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { StatCard, FeeSemaphore } from '@/components/ui';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Patient, Treatment, FeeAdjustment, InflationRecord } from '@/types/database';

interface FeesTabProps {
  treatments: Treatment[];
  inflationRecords: InflationRecord[];
  getPatient: (patientId: string) => Patient | undefined;
  getTreatmentFeeAdjustments: (treatmentId: string) => FeeAdjustment[];
  onNewFeeAdjustment: (data: {
    treatmentId: string;
    patientName: string;
    currentFee: number;
    previousFee: number;
    suggestedFee?: number;
    adjustment?: FeeAdjustment;
  }) => void;
}

export function FeesTab({
  treatments,
  inflationRecords,
  getPatient,
  getTreatmentFeeAdjustments,
  onNewFeeAdjustment
}: FeesTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const feesData = useMemo(() => {
    return treatments
      .filter(t => t.is_active)
      .map(treatment => {
        const patient = getPatient(treatment.patient_id);
        const adjustments = getTreatmentFeeAdjustments(treatment.id);
        const lastAdjustmentDate = adjustments[0]?.adjustment_date || treatment.start_date;

        const accumulatedInflation = inflationRecords
          .filter(ir => new Date(ir.month) >= new Date(lastAdjustmentDate))
          .reduce((sum, ir) => sum + ir.percentage, 0);

        const suggestedFee = Math.round(treatment.current_fee * (1 + accumulatedInflation / 100));
        const suggestedPercentage = accumulatedInflation;

        return {
          treatment,
          patient,
          adjustments,
          lastAdjustmentDate,
          accumulatedInflation,
          suggestedFee,
          suggestedPercentage
        };
      })
      .filter(item => {
        if (!searchQuery.trim()) return true;
        return item.patient?.name.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => b.accumulatedInflation - a.accumulatedInflation);
  }, [treatments, inflationRecords, getPatient, getTreatmentFeeAdjustments, searchQuery]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold">Gestión de Honorarios</h2>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 pl-9 pr-8 py-2 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Pacientes a revisar"
          value={feesData.filter(f => f.accumulatedInflation > 5 && f.accumulatedInflation <= 15).length}
          icon="🟡"
        />
        <StatCard
          label="Pacientes a ajustar"
          value={feesData.filter(f => f.accumulatedInflation > 15).length}
          icon="🔴"
        />
        <StatCard
          label="Pacientes OK"
          value={feesData.filter(f => f.accumulatedInflation <= 5).length}
          icon="🟢"
        />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {feesData.map(({ treatment, patient, adjustments, lastAdjustmentDate, accumulatedInflation, suggestedFee, suggestedPercentage }) => (
          <div key={treatment.id} className="bg-stone-50 rounded-xl p-3 sm:p-4">
            <div className="flex justify-between items-start gap-2 mb-3">
              <div className="min-w-0">
                <h3 className="font-semibold text-base sm:text-lg truncate">{patient?.name}</h3>
                <p className="text-xs sm:text-sm text-stone-500">Último ajuste: {formatDate(lastAdjustmentDate)}</p>
              </div>
              <FeeSemaphore percentage={accumulatedInflation} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
              <div>
                <p className="text-xs text-stone-400 uppercase">Inicial</p>
                <p className="text-sm sm:text-lg font-semibold">{formatCurrency(treatment.initial_fee)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase">Actual</p>
                <p className="text-sm sm:text-lg font-semibold text-teal-600">{formatCurrency(treatment.current_fee)}</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase">Inflación Acum.</p>
                <p className="text-sm sm:text-lg font-semibold text-orange-500">{accumulatedInflation.toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase">Sugerido</p>
                <p className="text-sm sm:text-lg font-semibold text-blue-600">
                  {formatCurrency(suggestedFee)}
                  <span className="text-xs font-normal ml-1">(+{suggestedPercentage.toFixed(1)}%)</span>
                </p>
              </div>
            </div>

            {/* Historial de ajustes */}
            {adjustments.length > 0 && (
              <div className="border-t border-stone-200 pt-3 mt-3">
                <p className="text-xs font-semibold text-stone-500 uppercase mb-2">Historial de Ajustes</p>
                <div className="flex flex-wrap gap-2">
                  {adjustments.slice(0, 3).map(adj => (
                    <button
                      key={adj.id}
                      onClick={() => onNewFeeAdjustment({
                        treatmentId: treatment.id,
                        patientName: patient?.name || 'Paciente',
                        currentFee: treatment.current_fee,
                        previousFee: adj.previous_fee,
                        adjustment: adj
                      })}
                      className="text-xs bg-white px-2 py-1 rounded border border-stone-200 hover:border-teal-300 transition-colors"
                    >
                      {formatDate(adj.adjustment_date)}: {formatCurrency(adj.new_fee)}
                      <span className={adj.adjustment_percentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {' '}({adj.adjustment_percentage >= 0 ? '+' : ''}{adj.adjustment_percentage.toFixed(1)}%)
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4">
              <button
                onClick={() => onNewFeeAdjustment({
                  treatmentId: treatment.id,
                  patientName: patient?.name || 'Paciente',
                  currentFee: treatment.current_fee,
                  previousFee: treatment.current_fee,
                  suggestedFee: suggestedFee
                })}
                className="w-full sm:w-auto px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
              >
                Nuevo ajuste
              </button>
            </div>
          </div>
        ))}

        {feesData.length === 0 && (
          <p className="text-center text-stone-400 py-10">
            {searchQuery ? 'No se encontraron pacientes' : 'No hay tratamientos activos'}
          </p>
        )}
      </div>
    </>
  );
}
