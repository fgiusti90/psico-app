// src/components/tabs/SessionsTab.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { StatCard } from '@/components/ui';
import { formatCurrency, formatCurrencyShort, formatDate } from '@/lib/utils';
import { SESSION_TYPE_LABELS } from '@/types/database';
import type { Patient, Treatment, Session } from '@/types/database';

interface SessionsTabProps {
  sessions: Session[];
  patients: Patient[];
  getTreatment: (treatmentId: string) => Treatment | undefined;
  getPatient: (patientId: string) => Patient | undefined;
  toggleSessionPaid: (id: string) => Promise<boolean>;
  onNewSession: () => void;
  onEditSession: (session: Session, treatment: Treatment | undefined) => void;
  onDeleteSession: (sessionId: string) => void;
}

export function SessionsTab({
  sessions,
  patients,
  getTreatment,
  getPatient,
  toggleSessionPaid,
  onNewSession,
  onEditSession,
  onDeleteSession
}: SessionsTabProps) {
  const [patientFilter, setPatientFilter] = useState<string>('all');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number | 'all'>('all');

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    sessions.forEach(s => {
      years.add(new Date(s.session_date).getFullYear());
    });
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions
      .filter(session => {
        const sessionDate = new Date(session.session_date);
        const sessionYear = sessionDate.getFullYear();
        const sessionMonth = sessionDate.getMonth() + 1;

        if (sessionYear !== year) return false;
        if (month !== 'all' && sessionMonth !== month) return false;

        if (patientFilter !== 'all') {
          const treatment = getTreatment(session.treatment_id);
          if (!treatment || treatment.patient_id !== patientFilter) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())
      .map(session => {
        const treatment = getTreatment(session.treatment_id);
        const patient = treatment ? getPatient(treatment.patient_id) : undefined;
        return { session, treatment, patient };
      });
  }, [sessions, year, month, patientFilter, getTreatment, getPatient]);

  const stats = useMemo(() => {
    const allSessions = filteredSessions.map(s => s.session);
    const totalWorked = allSessions.reduce((sum, s) => sum + s.fee_charged, 0);
    const paidSessions = allSessions.filter(s => s.is_paid);
    const totalCollected = paidSessions.reduce((sum, s) => sum + s.fee_charged, 0);
    return {
      total: allSessions.length,
      paid: paidSessions.length,
      totalWorked,
      totalCollected
    };
  }, [filteredSessions]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold">Prestaciones</h2>
        <button
          onClick={onNewSession}
          className="px-4 py-2 sm:px-5 sm:py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
        >
          + Nueva prestación
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-stone-50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 sm:gap-4 items-end">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-stone-500 mb-1">Paciente</label>
            <select
              value={patientFilter}
              onChange={e => setPatientFilter(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              <option value="all">Todos</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Año</label>
            <select
              value={year}
              onChange={e => setYear(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Mes</label>
            <select
              value={month}
              onChange={e => setMonth(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              <option value="all">Todos</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleDateString('es-AR', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard label="Prestaciones" value={stats.total} icon="📅" />
        <StatCard label="Cobradas" value={stats.paid} icon="✓" />
        <StatCard label="Trabajado" value={formatCurrencyShort(stats.totalWorked)} icon="💼" />
        <StatCard label="Cobrado" value={formatCurrencyShort(stats.totalCollected)} icon="💰" />
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {filteredSessions.map(({ session, patient, treatment }) => (
          <div
            key={session.id}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 border border-stone-200 rounded-xl gap-2 sm:gap-4"
          >
            <div className="flex flex-wrap gap-2 sm:gap-4 items-center text-xs sm:text-sm">
              <span className="font-medium">{formatDate(session.session_date)}</span>
              <span className="font-semibold">{patient?.name || 'Paciente'}</span>
              <span className="text-stone-500 hidden sm:inline">{SESSION_TYPE_LABELS[session.session_type]}</span>
              <span className="font-medium text-teal-600">{formatCurrency(session.fee_charged)}</span>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => toggleSessionPaid(session.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  session.is_paid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {session.is_paid ? '✓ Cobrada' : '○ Pendiente'}
              </button>
              <button
                onClick={() => onEditSession(session, treatment)}
                className="p-1.5 text-stone-400 hover:text-teal-600 hover:bg-teal-50 rounded"
              >
                ✎
              </button>
              <button
                onClick={() => onDeleteSession(session.id)}
                className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded"
              >
                ×
              </button>
            </div>
          </div>
        ))}

        {filteredSessions.length === 0 && (
          <p className="text-center text-stone-400 py-10">
            No hay prestaciones para los filtros seleccionados
          </p>
        )}
      </div>
    </>
  );
}