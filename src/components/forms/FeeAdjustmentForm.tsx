// src/components/FeeAdjustmentForm.tsx
'use client';

import React, { useState, useMemo } from 'react';
import type { FeeAdjustment } from '@/types/database';

interface FeeAdjustmentFormProps {
  patientName: string;
  currentFee: number;
  previousFee: number; // Para edición: el fee anterior al ajuste
  suggestedFee?: number; // Sugerencia basada en inflación
  treatmentId: string;
  adjustment?: FeeAdjustment | null; // Si existe, estamos editando
  onSave: (data: { 
    treatmentId: string; 
    newFee: number; 
    effectiveDate: string;
    adjustmentId?: string;
  }) => void;
  onDelete?: (adjustmentId: string) => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', { 
    style: 'currency', 
    currency: 'ARS', 
    maximumFractionDigits: 0 
  }).format(amount);
};

export function FeeAdjustmentForm({ 
  patientName, 
  currentFee, 
  previousFee,
  suggestedFee,
  treatmentId, 
  adjustment,
  onSave, 
  onDelete,
  onCancel 
}: FeeAdjustmentFormProps) {
  const isEditing = !!adjustment;
  
  // Para edición, usamos los valores del ajuste existente
  // Para creación, usamos el currentFee como referencia
  const baseFee = isEditing ? adjustment.previous_fee : currentFee;
  
  const [form, setForm] = useState({
    newFee: isEditing ? adjustment.new_fee.toString() : '',
    effectiveDate: isEditing 
      ? adjustment.adjustment_date 
      : new Date().toISOString().split('T')[0]
  });

  const adjustmentPercentage = useMemo(() => {
    const newFee = parseFloat(form.newFee);
    if (isNaN(newFee) || newFee === 0 || baseFee === 0) return 0;
    return ((newFee - baseFee) / baseFee) * 100;
  }, [form.newFee, baseFee]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newFee = parseFloat(form.newFee);
    if (isNaN(newFee) || newFee <= 0) return;
    
    onSave({
      treatmentId,
      newFee,
      effectiveDate: form.effectiveDate,
      adjustmentId: adjustment?.id
    });
  };

  const handleDelete = () => {
    if (adjustment && onDelete) {
      if (window.confirm('¿Eliminar este ajuste? El honorario volverá al valor anterior.')) {
        onDelete(adjustment.id);
      }
    }
  };

  const applySuggested = () => {
    if (suggestedFee) {
      setForm({ ...form, newFee: suggestedFee.toString() });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5">
      {/* Info del paciente */}
      <div className="bg-stone-50 rounded-lg p-4 mb-5">
        <p className="text-sm text-stone-500">Paciente</p>
        <p className="font-semibold text-lg">{patientName}</p>
      </div>

      {/* Honorario de referencia (solo lectura) */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-600 mb-1.5">
          {isEditing ? 'Honorario anterior al ajuste' : 'Honorario actual'}
        </label>
        <div className="px-3 py-2.5 bg-stone-100 border border-stone-200 rounded-lg text-lg font-semibold text-stone-700">
          {formatCurrency(baseFee)}
        </div>
      </div>

      {/* Sugerencia basada en inflación */}
      {!isEditing && suggestedFee && suggestedFee > currentFee && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Sugerido por inflación</p>
              <p className="text-lg font-bold text-amber-600">{formatCurrency(suggestedFee)}</p>
            </div>
            <button
              type="button"
              onClick={applySuggested}
              className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200 transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Nuevo honorario */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-600 mb-1.5">
          {isEditing ? 'Honorario ajustado' : 'Nuevo honorario'} *
        </label>
        <input
          type="number"
          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
          value={form.newFee}
          onChange={e => setForm({ ...form, newFee: e.target.value })}
          required
          placeholder="Ingresá el monto"
          autoFocus
        />
        {form.newFee && (
          <p className={`text-sm mt-1 ${adjustmentPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {adjustmentPercentage >= 0 ? '↑' : '↓'} {Math.abs(adjustmentPercentage).toFixed(1)}% de ajuste
          </p>
        )}
      </div>

      {/* Fecha de vigencia */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-600 mb-1.5">
          Fecha de vigencia *
        </label>
        <input
          type="date"
          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
          value={form.effectiveDate}
          onChange={e => setForm({ ...form, effectiveDate: e.target.value })}
          required
        />
        <p className="text-xs text-stone-400 mt-1">
          Fecha desde cuando entra en vigencia el {isEditing ? 'ajuste' : 'nuevo honorario'}
        </p>
      </div>

      {/* Resumen del ajuste */}
      {form.newFee && (
        <div className="bg-teal-50 rounded-lg p-4 mb-5">
          <p className="text-sm text-teal-700 mb-1">Resumen del ajuste</p>
          <div className="flex items-center gap-2 text-lg">
            <span className="text-stone-600">{formatCurrency(baseFee)}</span>
            <span className="text-stone-400">→</span>
            <span className="font-bold text-teal-600">{formatCurrency(parseFloat(form.newFee) || 0)}</span>
            <span className={`text-sm font-medium ${adjustmentPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ({adjustmentPercentage >= 0 ? '+' : ''}{adjustmentPercentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <div>
          {isEditing && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Eliminar ajuste
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 bg-white text-stone-600 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!form.newFee || parseFloat(form.newFee) <= 0}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Actualizar' : 'Guardar'} ajuste
          </button>
        </div>
      </div>
    </form>
  );
}
