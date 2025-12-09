// src/components/tabs/PendingTab.tsx
'use client';

import React from 'react';
import { StatCard } from '@/components/ui';
import { formatCurrency, formatCurrencyShort, formatDate } from '@/lib/utils';
import { SESSION_TYPE_LABELS } from '@/types/database';
import type { Patient, Treatment, Session } from '@/types/database';

interface PendingGroup {
  patient: Patient;
  sessions: Session[];
  total: number;
  treatment: Treatment | undefined;
}

interface PendingTabProps {
  pendingData: PendingGroup[];
  totalPending: number;
  toggleSessionPaid: (id: string) => Promise<boolean>;
}

export function PendingTab({ pendingData, totalPending, toggleSessionPaid }: PendingTabProps) {
  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl font-semibold">Pagos Pendientes</h2>
        <div className="text-left sm:text-right">
          <p className="text-xs sm:text-sm text-stone-500">Total pendiente</p>
          <p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard label="Pacientes con deuda" value={pendingData.length} icon="👤" />
        <StatCard label="Sesiones sin cobrar" value={pendingData.reduce((sum, p) => sum + p.sessions.length, 0)} icon="📅" />
        <StatCard label="Total pendiente" value={formatCurrencyShort(totalPending)} icon="💸" />
      </div>

      {/* Lista por paciente */}
      <div className="space-y-3 sm:space-y-4">
        {pendingData.map(({ patient, sessions, total }) => (
          <div key={patient.id} className="bg-stone-50 rounded-xl p-3 sm:p-4">
            <div className="flex justify-between items-start gap-2 mb-3 sm:mb-4">
              <div>
                <h3 className="font-semibold text-base sm:text-lg">{patient.name}</h3>
                <p className="text-xs sm:text-sm text-stone-500">{sessions.length} sesiones pendientes</p>
              </div>
              <div className="text-right">
                <p className="text-lg sm:text-xl font-bold text-red-600">{formatCurrency(total)}</p>
              </div>
            </div>

            <div className="space-y-2">
              {sessions.map(session => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-2 sm:p-3 rounded-lg text-xs sm:text-sm gap-2"
                >
                  <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
                    <span className="font-medium">{formatDate(session.session_date)}</span>
                    <span className="text-stone-500">{SESSION_TYPE_LABELS[session.session_type]}</span>
                    <span className="font-medium text-red-600">{formatCurrency(session.fee_charged)}</span>
                  </div>
                  <button
                    onClick={() => toggleSessionPaid(session.id)}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors self-start sm:self-auto"
                  >
                    Marcar cobrada
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {pendingData.length === 0 && (
          <div className="text-center py-10">
            <p className="text-4xl mb-4">🎉</p>
            <p className="text-stone-400">No hay pagos pendientes</p>
          </div>
        )}
      </div>
    </>
  );
}
