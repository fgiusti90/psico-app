// src/components/InflationForm.tsx
'use client';

import React, { useState } from 'react';
import type { InflationRecord, InflationRecordInsert } from '@/types/database';

interface InflationFormProps {
  record?: InflationRecord | null;
  onSave: (data: InflationRecordInsert & { id?: string }) => void;
  onCancel: () => void;
}

export function InflationForm({ record, onSave, onCancel }: InflationFormProps) {
  const [form, setForm] = useState({
    month: record?.month?.slice(0, 7) || new Date().toISOString().slice(0, 7),
    percentage: record?.percentage?.toString() || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(record?.id ? { id: record.id } : {}),
      month: form.month + '-01',
      percentage: parseFloat(form.percentage)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-5">
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Mes *
          </label>
          <input
            type="month"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
            value={form.month}
            onChange={e => setForm({ ...form, month: e.target.value })}
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Inflación % *
          </label>
          <input
            type="number"
            step="0.1"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
            value={form.percentage}
            onChange={e => setForm({ ...form, percentage: e.target.value })}
            required
            placeholder="0.0"
          />
        </div>
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