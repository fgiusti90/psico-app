// src/components/TreatmentForm.tsx
'use client';

import React, { useState } from 'react';
import type { Treatment, TreatmentInsert } from '@/types/database';

interface TreatmentFormProps {
  treatment?: Treatment | null;
  patientId: string;
  onSave: (data: TreatmentInsert & { id?: string }) => void;
  onCancel: () => void;
}

export function TreatmentForm({ treatment, patientId, onSave, onCancel }: TreatmentFormProps) {
  const [form, setForm] = useState({
    start_date: treatment?.start_date || new Date().toISOString().split('T')[0],
    end_date: treatment?.end_date || '',
    initial_fee: treatment?.initial_fee?.toString() || '',
    current_fee: treatment?.current_fee?.toString() || '',
    is_active: treatment?.is_active ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initialFee = parseFloat(form.initial_fee);
    onSave({
      ...(treatment?.id ? { id: treatment.id } : {}),
      patient_id: patientId,
      start_date: form.start_date,
      end_date: form.end_date || null,
      initial_fee: initialFee,
      current_fee: form.current_fee ? parseFloat(form.current_fee) : initialFee,
      is_active: form.is_active
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-5">
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Fecha de inicio *
          </label>
          <input
            type="date"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
            value={form.start_date}
            onChange={e => setForm({ ...form, start_date: e.target.value })}
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Fecha de fin
          </label>
          <input
            type="date"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
            value={form.end_date}
            onChange={e => setForm({ ...form, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Honorario inicial *
          </label>
          <input
            type="number"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
            value={form.initial_fee}
            onChange={e => setForm({ 
              ...form, 
              initial_fee: e.target.value,
              current_fee: form.current_fee || e.target.value 
            })}
            required
            placeholder="0"
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Honorario actual
          </label>
          <input
            type="number"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
            value={form.current_fee}
            onChange={e => setForm({ ...form, current_fee: e.target.value })}
            placeholder={form.initial_fee || '0'}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={e => setForm({ ...form, is_active: e.target.checked })}
            className="w-4 h-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="ml-2 text-sm text-stone-700">Tratamiento activo</span>
        </label>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 bg-white text-stone-600 border border-stone-200 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          Guardar
        </button>
      </div>
    </form>
  );
}
