// src/components/QuickSessionForm.tsx
'use client';

import React, { useState, useMemo } from 'react';
import type { Patient, Treatment, SessionInsert, SessionType } from '@/types/database';
import { SESSION_TYPE_LABELS } from '@/types/database';

interface QuickSessionFormProps {
  patientsWithTreatment: { patient: Patient; treatment: Treatment }[];
  onSave: (data: SessionInsert) => void;
  onCancel: () => void;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0
  }).format(amount);
};

export function QuickSessionForm({ patientsWithTreatment, onSave, onCancel }: QuickSessionFormProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [form, setForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    session_type: 'session' as SessionType,
    fee_charged: '',
    is_paid: false
  });

  const selectedItem = useMemo(() => {
    return patientsWithTreatment.find(item => item.patient.id === selectedPatientId);
  }, [patientsWithTreatment, selectedPatientId]);

  // Cuando se selecciona un paciente, actualizar el honorario por defecto
  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    const item = patientsWithTreatment.find(i => i.patient.id === patientId);
    if (item) {
      setForm(prev => ({
        ...prev,
        fee_charged: item.treatment.current_fee.toString()
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    onSave({
      treatment_id: selectedItem.treatment.id,
      session_date: form.session_date,
      session_type: form.session_type,
      fee_charged: parseFloat(form.fee_charged),
      is_paid: form.is_paid
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-5">
      {/* Selector de paciente */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-stone-600 mb-1.5">
          Paciente *
        </label>
        <select
          className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors bg-white"
          value={selectedPatientId}
          onChange={e => handlePatientChange(e.target.value)}
          required
        >
          <option value="">Seleccionar paciente...</option>
          {patientsWithTreatment.map(({ patient, treatment }) => (
            <option key={patient.id} value={patient.id}>
              {patient.name} ({formatCurrency(treatment.current_fee)})
            </option>
          ))}
        </select>
      </div>

      {selectedItem && (
        <>
          {/* Info del tratamiento */}
          <div className="bg-stone-50 rounded-lg p-3 mb-4 text-sm">
            <span className="text-stone-500">Honorario actual: </span>
            <span className="font-semibold text-teal-600">
              {formatCurrency(selectedItem.treatment.current_fee)}
            </span>
          </div>

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
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm outline-none focus:border-teal-500 transition-colors bg-white"
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
        </>
      )}

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
          disabled={!selectedPatientId || !form.fee_charged}
          className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Guardar sesión
        </button>
      </div>
    </form>
  );
}