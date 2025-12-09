// src/components/PatientForm.tsx
'use client';

import React, { useState } from 'react';
import type { Patient, PatientInsert, PatientStatus } from '@/types/database';

interface PatientFormProps {
  patient?: Patient | null;
  onSave: (data: PatientInsert & { id?: string }) => void;
  onCancel: () => void;
}

export function PatientForm({ patient, onSave, onCancel }: PatientFormProps) {
  const [form, setForm] = useState({
    name: patient?.name || '',
    contact: patient?.contact || '',
    father_name: patient?.father_name || '',
    mother_name: patient?.mother_name || '',
    status: (patient?.status || 'active') as PatientStatus
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(patient?.id ? { id: patient.id } : {}),
      name: form.name,
      contact: form.contact || null,
      father_name: form.father_name || null,
      mother_name: form.mother_name || null,
      status: form.status
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-5">
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-600 mb-1.5">
          Nombre del paciente *
        </label>
        <input
          type="text"
          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          required
          placeholder="Nombre completo"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-600 mb-1.5">
          Contacto
        </label>
        <input
          type="text"
          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
          value={form.contact}
          onChange={e => setForm({ ...form, contact: e.target.value })}
          placeholder="Teléfono o email"
        />
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Nombre del padre
          </label>
          <input
            type="text"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
            value={form.father_name}
            onChange={e => setForm({ ...form, father_name: e.target.value })}
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-stone-600 mb-1.5">
            Nombre de la madre
          </label>
          <input
            type="text"
            className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors"
            value={form.mother_name}
            onChange={e => setForm({ ...form, mother_name: e.target.value })}
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-600 mb-1.5">
          Estado
        </label>
        <select
          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors bg-white cursor-pointer"
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value as PatientStatus })}
        >
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
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