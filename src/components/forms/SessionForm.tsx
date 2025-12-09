// src/components/SessionForm.tsx
'use client';

import React, { useState } from 'react';
import type { Session, SessionInsert, SessionType } from '@/types/database';
import { SESSION_TYPE_LABELS } from '@/types/database';

interface SessionFormProps {
  session?: Session | null;
  treatmentId: string;
  currentFee: number;
  onSave: (data: SessionInsert & { id?: string }) => void;
  onCancel: () => void;
}

export function SessionForm({ session, treatmentId, currentFee, onSave, onCancel }: SessionFormProps) {
  const [form, setForm] = useState({
    session_date: session?.session_date || new Date().toISOString().split('T')[0],
    session_type: (session?.session_type || 'session') as SessionType,
    fee_charged: session?.fee_charged?.toString() || currentFee.toString(),
    is_paid: session?.is_paid || false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(session?.id ? { id: session.id } : {}),
      treatment_id: treatmentId,
      session_date: form.session_date,
      session_type: form.session_type,
      fee_charged: parseFloat(form.fee_charged),
      is_paid: form.is_paid
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-5">
      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Fecha *
          </label>
          <input
            type="date"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
            value={form.session_date}
            onChange={e => setForm({ ...form, session_date: e.target.value })}
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Tipo *
          </label>
          <select
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors bg-white cursor-pointer"
            value={form.session_type}
            onChange={e => setForm({ ...form, session_type: e.target.value as SessionType })}
          >
            {Object.entries(SESSION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Honorario *
          </label>
          <input
            type="number"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
            value={form.fee_charged}
            onChange={e => setForm({ ...form, fee_charged: e.target.value })}
            required
          />
        </div>
        <div className="flex-1 flex items-end">
          <label className="flex items-center cursor-pointer mb-2.5">
            <input
              type="checkbox"
              checked={form.is_paid}
              onChange={e => setForm({ ...form, is_paid: e.target.checked })}
              className="w-4 h-4 rounded border-stone-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="ml-2 text-sm text-stone-700">Cobrada</span>
          </label>
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